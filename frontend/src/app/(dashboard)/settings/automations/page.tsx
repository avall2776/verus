import { redirect } from "next/navigation";

export default function AutomationsRedirectPage() {
  redirect("/settings?tab=automations");
}
