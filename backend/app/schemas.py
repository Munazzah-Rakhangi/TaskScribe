from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ActionItemCreate(BaseModel):
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None


class MeetingCreate(BaseModel):
    title: str
    transcript: str
    summary: Optional[str] = None
    action_items: List[ActionItemCreate] = Field(default_factory=list)


class MeetingUpdate(MeetingCreate):
    pass


class ActionItemOut(BaseModel):
    id: int
    task: str
    owner: str | None = None
    deadline: str | None = None

    class Config:
        from_attributes = True


class MeetingOut(BaseModel):
    id: int
    title: str
    transcript: str
    summary: str | None = None
    created_at: datetime | None = None  # None for legacy records before fix
    action_items: List[ActionItemOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ExtractActionItemsRequest(BaseModel):
    transcript: str


class ExtractedActionItem(BaseModel):
    task: str
    owner: str | None = None
    deadline: str | None = None


class ExtractActionItemsResponse(BaseModel):
    summary: str | None = None
    action_items: List[ExtractedActionItem]


# Auth
class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ReminderItem(BaseModel):
    meeting_id: int
    meeting_title: str
    task: str
    owner: str | None
    deadline: str | None
