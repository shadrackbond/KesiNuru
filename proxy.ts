import { NextRequest, NextResponse } from "next/server";

const COOKIE = "kesinuru_session";

function toBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function sessionIsValid(value: string | undefined, secret: string) {
  if (!value) return false;
  const [id, signature] = value.split(".");
  if (!id || !signature || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(id),
    );
  } catch {
    return false;
  }
}

async function sign(id: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id)));
}

export async function proxy(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return NextResponse.next();
  if (await sessionIsValid(request.cookies.get(COOKIE)?.value, secret)) return NextResponse.next();

  const id = crypto.randomUUID();
  const signed = `${id}.${await sign(id, secret)}`;
  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
