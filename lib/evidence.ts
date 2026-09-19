import { extname } from "node:path";

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

const allowed = {
  "application/pdf": { extension: ".pdf", signature: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { extension: ".jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: ".png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
} as const;

export function validateEvidenceFile(filename: string, mimeType: string, bytes: Uint8Array) {
  if (!filename || filename.length > 180) throw new Error("Choose a file with a shorter name.");
  if (!bytes.length) throw new Error("The selected file is empty.");
  if (bytes.length > MAX_EVIDENCE_BYTES) throw new Error("Files must be 10 MB or smaller.");
  const config = allowed[mimeType as keyof typeof allowed];
  if (!config) throw new Error("Only PDF, JPEG and PNG files are accepted.");
  const hasSignature = config.signature.every((byte, index) => bytes[index] === byte);
  if (!hasSignature) throw new Error("The file contents do not match the selected file type.");
  const extension = extname(filename).toLowerCase();
  const validExtension =
    mimeType === "image/jpeg"
      ? [".jpg", ".jpeg"].includes(extension)
      : extension === config.extension;
  if (!validExtension) throw new Error("The filename extension does not match the file type.");
  return { extension: config.extension };
}

export function safeDownloadName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "evidence";
}
