import { extname } from "node:path";

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_FILES_PER_CASE = 20;
export const MAX_TOTAL_EVIDENCE_BYTES_PER_CASE = 50 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;

const allowed = {
  "application/pdf": { extension: ".pdf", signature: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { extension: ".jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: ".png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
} as const;

function inspectPdf(bytes: Uint8Array) {
  const text = Buffer.from(bytes).toString("latin1");
  const activeMarkers = ["/JavaScript", "/OpenAction", "/Launch", "/EmbeddedFile", "/RichMedia"];
  if (activeMarkers.some((marker) => text.includes(marker))) {
    throw new Error("PDFs containing active or embedded content are not accepted.");
  }
}

function inspectPng(bytes: Uint8Array) {
  if (bytes.length < 24) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("The image dimensions are invalid or too large.");
  }
}

export function safeEvidenceName(value: string) {
  const basename = value.split(/[\\/]/).pop() ?? "";
  return basename
    .replace(/[\u0000-\u001f\u007f]/g, "_")
    .replace(/[^\p{L}\p{N} ._()-]/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function validateEvidenceFile(filename: string, mimeType: string, bytes: Uint8Array) {
  const safeName = safeEvidenceName(filename);
  if (!safeName || safeName.length > 180) throw new Error("Choose a file with a shorter name.");
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
  if (mimeType === "application/pdf") inspectPdf(bytes);
  if (mimeType === "image/png") inspectPng(bytes);
  return { extension: config.extension, filename: safeName };
}

export function safeDownloadName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "evidence";
}
