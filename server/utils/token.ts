// Web Crypto verification avoids Node-only APIs and compares without a string early-exit.
export async function verifyPlanToken(actual: string, expected: string) {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(expected),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(expected),
  );
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(actual));
}
