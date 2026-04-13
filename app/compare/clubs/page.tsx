import { redirect } from "next/navigation";

export default async function CompareClubsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ clubs?: string }>;
}) {
  const { clubs } = await searchParams;
  redirect(`/compare${clubs ? `?clubs=${clubs}` : ""}`);
}
