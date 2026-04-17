import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BuildClient } from "./BuildClient";

export default async function BuildPage() {
  const session = await auth();
  if (!session) redirect("/");
  return <BuildClient />;
}
