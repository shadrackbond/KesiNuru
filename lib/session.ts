import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kesinuru_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return value;
}

function signature(id: string) {
  return createHmac("sha256", secret()).update(id).digest("base64url");
}

export function verifySignedSession(value: string | undefined): string | null {
  if (!value) return null;
  const [id, suppliedSignature] = value.split(".");
  if (!id || !suppliedSignature || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = Buffer.from(signature(id));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return id;
}

export async function requireSessionId() {
  const store = await cookies();
  const id = verifySignedSession(store.get(SESSION_COOKIE)?.value);
  if (!id) throw new Error("A valid KesiNuru session is required.");
  return id;
}
