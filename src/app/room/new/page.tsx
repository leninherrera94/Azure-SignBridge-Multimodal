import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

// /room/new → redirect to /room/<uuid>
export default function NewRoomPage() {
  redirect(`/room/${randomUUID()}`);
}
