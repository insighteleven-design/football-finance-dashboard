import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { checkAccess } from "@/lib/accessCodes";
import RequestAccessForm from "./RequestAccessForm";

export const dynamic = "force-dynamic";

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from = "/" } = await searchParams;

  // If the visitor already has valid access, send them straight through
  const cookieStore = await cookies();
  const ownerCookie  = cookieStore.get("intelligence_owner")?.value;
  const accessCookie = cookieStore.get("intelligence_access")?.value;

  if (checkAccess(ownerCookie, accessCookie)) {
    redirect(from);
  }

  return (
    <Suspense>
      <RequestAccessForm from={from} />
    </Suspense>
  );
}
