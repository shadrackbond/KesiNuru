import { describe, expect, it } from "vitest";
import { safeDownloadName, validateEvidenceFile } from "@/lib/evidence";

describe("evidence validation", () => {
  it("accepts a real PDF signature", () => {
    expect(
      validateEvidenceFile(
        "record.pdf",
        "application/pdf",
        new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      ),
    ).toEqual({ extension: ".pdf" });
  });

  it("rejects a renamed executable", () => {
    expect(() =>
      validateEvidenceFile("record.pdf", "application/pdf", new Uint8Array([0x4d, 0x5a, 0x90])),
    ).toThrow(/contents/);
  });

  it("sanitises response header filenames", () => {
    expect(safeDownloadName('bad\r\n"name.pdf')).toBe("bad___name.pdf");
  });
});
