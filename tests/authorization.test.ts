import { describe, expect, it } from "vitest";
import { assertOwnedSession, ForbiddenError } from "@/lib/authorization";

describe("case ownership boundary", () => {
  it("allows a matching owner session", () => {
    expect(() => assertOwnedSession("session-a", "session-a")).not.toThrow();
  });

  it("rejects a different session", () => {
    expect(() => assertOwnedSession("session-a", "session-b")).toThrow(ForbiddenError);
  });

  it("rejects an empty owner", () => {
    expect(() => assertOwnedSession("", "session-a")).toThrow(ForbiddenError);
  });
});
