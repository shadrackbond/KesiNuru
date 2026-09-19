import { ArrowLeft, Eye, FileCheck2, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEvidence, uploadEvidence } from "@/actions/evidence";
import { getOwnedCase } from "@/lib/cases";
import { isEligibleAnswer } from "@/lib/intake";
import { prisma } from "@/lib/prisma";

function fileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ error?: string; uploaded?: string }>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  if (!caseId) notFound();
  const item = await getOwnedCase(caseId);
  const eligibility = await prisma.intakeResponse.findUnique({
    where: { caseId_questionKey: { caseId, questionKey: "eligibility" } },
    select: { answer: true },
  });
  if (!isEligibleAnswer(eligibility?.answer)) redirect(`/cases/${caseId}/intake`);
  const files = await prisma.evidenceFile.findMany({
    where: { caseId },
    select: {
      id: true,
      filename: true,
      documentType: true,
      sizeBytes: true,
      processingStatus: true,
      uploadedAt: true,
    },
    orderBy: { uploadedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        Back to case
      </Link>
      <div className="mt-7">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Evidence upload</p>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">
          Add supporting records
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/55">
          Upload only material relevant to {item.title}. Files are stored privately and every read
          checks case ownership.
        </p>
      </div>
      {query.error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {query.error}
        </div>
      ) : null}
      {query.uploaded ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          Evidence uploaded successfully.
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          action={uploadEvidence}
          encType="multipart/form-data"
          className="surface space-y-5 p-6"
        >
          <input type="hidden" name="caseId" value={caseId} />
          <div className="grid size-12 place-items-center rounded-2xl bg-mint text-forest">
            <FileUp className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Upload a file</h2>
            <p className="mt-1 text-sm leading-6 text-ink/50">
              PDF, JPEG or PNG. Maximum 10 MB per file.
            </p>
          </div>
          <label className="block text-sm font-bold">
            Document type
            <select className="field" name="documentType" required defaultValue="">
              <option value="" disabled>
                Select a type
              </option>
              {[
                "Contract",
                "Payslip",
                "Payment record",
                "Message or email",
                "Termination letter",
                "Other",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Choose file
            <input
              className="mt-2 block w-full rounded-2xl border border-dashed border-forest/25 bg-cream p-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:font-semibold file:text-white"
              name="file"
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            />
          </label>
          <button className="button-primary w-full" type="submit">
            <FileUp className="size-4" />
            Upload evidence
          </button>
          <div className="flex gap-3 rounded-2xl bg-mint/40 p-3 text-xs leading-5 text-forest">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>Type, extension, content signature and file size are validated on the server.</p>
          </div>
        </form>
        <section className="surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Uploaded evidence</h2>
              <p className="mt-1 text-sm text-ink/50">
                {files.length} {files.length === 1 ? "file" : "files"}
              </p>
            </div>
            <FileCheck2 className="size-6 text-leaf" />
          </div>
          {files.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-cream px-5 py-10 text-center">
              <p className="font-bold">No evidence uploaded yet</p>
              <p className="mt-2 text-sm text-ink/50">
                You can continue even when a document is unavailable.
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {files.map((file) => (
                <li key={file.id} className="rounded-2xl border border-forest/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{file.filename}</p>
                      <p className="mt-1 text-xs text-ink/45">
                        {file.documentType} · {fileSize(file.sizeBytes)} ·{" "}
                        {file.processingStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        className="button-secondary min-h-9 px-3 py-1 text-xs"
                        href={`/cases/${caseId}/evidence/${file.id}`}
                        target="_blank"
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </Link>
                      <form action={deleteEvidence}>
                        <input type="hidden" name="caseId" value={caseId} />
                        <input type="hidden" name="evidenceId" value={file.id} />
                        <button
                          className="button-secondary min-h-9 px-3 py-1 text-xs text-red-700"
                          type="submit"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 border-t border-forest/10 pt-6">
            <p className="text-sm text-ink/55">
              When the core documents are uploaded, return to the case workspace. Document
              processing is the next milestone.
            </p>
            <Link href={`/cases/${caseId}`} className="button-primary mt-4">
              Finish evidence step
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
