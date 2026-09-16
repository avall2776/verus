import { redirect } from "next/navigation";

export default function QuickRepliesRedirectPage() {
  redirect("/settings?tab=quick-replies");
}
