import RequireAuth from "../../components/RequireAuth";
import MeetingDetailClient from "./MeetingDetailClient";

export default function MeetingPage() {
  return (
    <RequireAuth>
      <MeetingDetailClient />
    </RequireAuth>
  );
}
