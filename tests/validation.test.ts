import { describe, expect, it } from "vitest";
import { objectIdSchema } from "@/lib/validation";

describe("MongoDB identifiers", () => {
  it("accepts a 24-character ObjectId", () => {
    expect(objectIdSchema.parse("507f1f77bcf86cd799439011")).toBe("507f1f77bcf86cd799439011");
  });

  it("rejects the former CUID format", () => {
    expect(() => objectIdSchema.parse("clx1234567890abcdefghijk")).toThrow();
  });
});
