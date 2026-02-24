import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.core.config import settings
from app.deps import get_db
from app.email_utils import send_password_reset_email
from app.models import User
from app.schemas import ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, SetPasswordRequest, Token, UserCreate, UserLogin, UserOut, UserProfileUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name or None,
        last_name=payload.last_name or None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.first_name is not None:
        current_user.first_name = payload.first_name.strip() or None
    if payload.last_name is not None:
        current_user.last_name = payload.last_name.strip() or None
    if payload.email is not None:
        new_email = payload.email.lower().strip()
        if new_email != current_user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            current_user.email = new_email
    db.commit()
    db.refresh(current_user)
    return current_user


# ---- Google OAuth ----
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
def google_login():
    """Redirect user to Google OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    redirect_uri = f"{settings.API_BASE_URL}/auth/google/callback"
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
def google_callback(code: str | None = None, state: str | None = None, db: Session = Depends(get_db)):
    """Exchange auth code for tokens, fetch user info, create/find user, return JWT via redirect."""
    if not code:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_code")
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=oauth_not_configured")
    redirect_uri = f"{settings.API_BASE_URL}/auth/google/callback"
    with httpx.Client() as client:
        token_resp = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if token_resp.status_code != 200:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed")
    tokens = token_resp.json()
    access_token = tokens.get("access_token")
    if not access_token:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=no_access_token")
    with httpx.Client() as client:
        user_resp = client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if user_resp.status_code != 200:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=userinfo_failed")
    guser = user_resp.json()
    email = (guser.get("email") or "").lower().strip()
    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=no_email")
    first_name = guser.get("given_name") or None
    last_name = guser.get("family_name") or None
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=None,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update name if we have new info
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        db.commit()
    token = create_access_token(user.id)
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={token}")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        return {"message": "If that email exists, we've sent a reset link."}
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    user.password_reset_token = token
    user.password_reset_expires = expires
    db.commit()
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_password_reset_email(user.email, reset_link)
    return {"message": "If that email exists, we've sent a reset link."}


@router.post("/me/set-password")
def set_password(
    payload: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set password for OAuth-only users (e.g. to unlink from Google sign-in)."""
    if current_user.hashed_password:
        raise HTTPException(status_code=400, detail="Account already has a password; use change-password instead")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password set. You can now sign in with email and password."}


@router.patch("/me/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="Account uses Google sign-in; set a password in account settings first")
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated."}


@router.delete("/me")
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the current user and all their data."""
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.password_reset_token == payload.token,
        User.password_reset_expires > datetime.now(timezone.utc),
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"message": "Password has been reset. You can now sign in."}
