import { redirect } from "next/navigation";

export default function CandidateCvRedirect() {
  redirect("/candidate/dashboard");
}
