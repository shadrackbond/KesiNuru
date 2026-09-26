import { describe, expect, it } from "vitest";
import { safeDownloadName, safeEvidenceName, validateEvidenceFile } from "@/lib/evidence";

describe("evidence validation", () => {
  it("accepts a real PDF signature", () => {
    expect(
      validateEvidenceFile(
        "record.pdf",
        "application/pdf",
        new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      ),
    ).toEqual({ extension: ".pdf", filename: "record.pdf" });
  });

  it("rejects a renamed executable", () => {
    expect(() =>
      validateEvidenceFile("record.pdf", "application/pdf", new Uint8Array([0x4d, 0x5a, 0x90])),
    ).toThrow(/contents/);
  });

  it("sanitises response header filenames", () => {
    expect(safeDownloadName('bad\r\n"name.pdf')).toBe("bad___name.pdf");
  });

  it("removes path components from stored evidence names", () => {
    expect(safeEvidenceName("../../private/payment record.pdf")).toBe("payment record.pdf");
  });

  it("rejects PDFs containing active actions", () => {
    expect(() =>
      validateEvidenceFile(
        "active.pdf",
        "application/pdf",
        new TextEncoder().encode("%PDF-1.7 /OpenAction 1 0 R"),
      ),
    ).toThrow(/executable actions/);
  });

  it("allows inert embedded metadata streams", () => {
    expect(
      validateEvidenceFile(
        "signed-record.pdf",
        "application/pdf",
        new TextEncoder().encode("%PDF-1.7 /Type /EmbeddedFile /Subtype /application#2Foctet-stream"),
      ),
    ).toEqual({ extension: ".pdf", filename: "signed-record.pdf" });
  });

  it("rejects visible file-attachment annotations", () => {
    expect(() =>
      validateEvidenceFile(
        "attached.pdf",
        "application/pdf",
        new TextEncoder().encode("%PDF-1.7 /Subtype /FileAttachment /FS 10 0 R"),
      ),
    ).toThrow(/file attachments/);
  });

  it("rejects oversized PNG dimensions", () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 10_000);
    view.setUint32(20, 10_000);
    expect(() => validateEvidenceFile("huge.png", "image/png", bytes)).toThrow(/dimensions/);
  });
});
