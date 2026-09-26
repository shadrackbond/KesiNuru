import { describe, expect, it } from "vitest";
import { deploymentConfigStatus } from "@/lib/deployment";
import { securityHeaders } from "@/lib/security-headers";

describe("deployment safety", () => {
  it("requires a database name and production secrets", () => {
    expect(
      deploymentConfigStatus({
        DATABASE_URL: "mongodb+srv://user:password@cluster.mongodb.net/",
        SESSION_SECRET: "short",
        GEMINI_API_KEY: "replace-with-key",
      }).ready,
    ).toBe(false);
  });

  it("accepts a complete deployment configuration", () => {
    expect(
      deploymentConfigStatus({
        DATABASE_URL: "mongodb+srv://user:password@cluster.mongodb.net/kesinuru",
        SESSION_SECRET: "a-secure-session-secret-with-32-characters",
        GEMINI_API_KEY: "configured-key",
        GEMINI_MODEL: "gemini-3.5-flash",
      }).ready,
    ).toBe(true);
  });

  it("sets the core browser security headers", () => {
    const keys = securityHeaders.map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "Referrer-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Permissions-Policy",
      ]),
    );
  });
});
