export function getValidCodes(): string[] {
  return (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidAccessCode(code: string): boolean {
  return getValidCodes().includes(code.trim());
}

export function isOwnerCode(code: string): boolean {
  const owner = process.env.OWNER_ACCESS_CODE;
  return Boolean(owner && code.trim() === owner);
}

export function checkAccess(
  ownerCookieValue: string | undefined,
  accessCookieValue: string | undefined,
): boolean {
  if (ownerCookieValue && isOwnerCode(ownerCookieValue)) return true;
  if (accessCookieValue && isValidAccessCode(accessCookieValue)) return true;
  return false;
}
