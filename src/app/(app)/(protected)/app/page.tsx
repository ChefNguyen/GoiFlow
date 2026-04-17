import { redirect } from "next/navigation";

export default function ProtectedAppRedirectPage() {
  redirect("/game/setup");
}
