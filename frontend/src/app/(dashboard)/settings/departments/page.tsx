import { redirect } from "next/navigation";

export default function DepartmentsRedirectPage() {
  redirect("/settings?tab=departments");
}
