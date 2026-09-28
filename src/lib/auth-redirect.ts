/**
 * Validira `next` parametar za preusmjeravanje nakon prijave.
 * Dozvoljeni su samo interni putovi koji počinju s "/" —
 * odbacuje "//host" (protocol-relative) i bilo kakve backslashove
 * (npr. "/\attacker.com" koje preglednici rješavaju kao vanjski URL).
 */
export function sanitizeNextPath(value: unknown): string | undefined {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return undefined;
}
