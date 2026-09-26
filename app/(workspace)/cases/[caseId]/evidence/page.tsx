import {
  ArrowLeft,
  BrainCircuit,
  Eye,
  FileCheck2,
  FileUp,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEvidence, uploadEvidence } from "@/actions/evidence";
import { processEvidence } from "@/actions/processing";
import { SubmitButton } from "@/components/submit-button";
import { isEligibleAnswer } from "@/lib/intake";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";

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
  searchParams: Promise<{ error?: string; uploaded?: string; deleted?: string }>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  if (!caseId) notFound();
  const ownerSessionId = await requireSessionId();
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: {
      title: true,
      intakeResponses: {
        where: { questionKey: "eligibility" },
        select: { answer: true },
        take: 1,
      },
      evidenceFiles: {
        select: {
          id: true,
          filename: true,
          documentType: true,
          sizeBytes: true,
          processingStatus: true,
          processingSummary: true,
          processingError: true,
          uploadedAt: true,
          _count: { select: { facts: true } },
        },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });
  if (!item) notFound();
  if (!isEligibleAnswer(item.intakeResponses[0]?.answer)) redirect(`/cases/${caseId}/intake`);
  const files = item.evidenceFiles;
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
      {query.deleted ? (
        <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Evidence deleted.
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
              PDF, JPEG or PNG. Maximum 10 MB per file, 20 files and 50 MB per case.
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
          <SubmitButton className="button-primary w-full" pendingText="Uploading securely…">
            <FileUp className="size-4" />
            Upload evidence
          </SubmitButton>
          <div className="flex gap-3 rounded-2xl bg-mint/40 p-3 text-xs leading-5 text-forest">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              Type, extension, signature, size, image dimensions and active PDF content are checked
              on the server. This prototype does not replace production malware scanning.
            </p>
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
                      {file.processingSummary ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/55">
                          {file.processingSummary}
                        </p>
                      ) : null}
                      {file.processingError ? (
                        <p className="mt-2 text-xs font-semibold text-red-700">
                          Processing needs attention.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="button-secondary min-h-9 px-3 py-1 text-xs"
                        href={`/cases/${caseId}/evidence/${file.id}`}
                        target="_blank"
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </Link>
                      {file.processingStatus === "WAITING" ||
                      file.processingStatus === "FAILED" ||
                      file.processingStatus === "NEEDS_ATTENTION" ? (
                        <form action={processEvidence}>
                          <input type="hidden" name="caseId" value={caseId} />
                          <input type="hidden" name="evidenceId" value={file.id} />
                          <SubmitButton
                            className="button-primary min-h-9 px-3 py-1 text-xs"
                            pendingText="Processing…"
                          >
                            <BrainCircuit className="size-3.5" />
                            Process
                          </SubmitButton>
                        </form>
                      ) : (
                        <Link
                          className="button-primary min-h-9 px-3 py-1 text-xs"
                          href={`/cases/${caseId}/evidence/${file.id}/review`}
                        >
                          <FileCheck2 className="size-3.5" />
                          Review {file._count.facts ? `(${file._count.facts})` : ""}
                        </Link>
                      )}
                      <form action={deleteEvidence}>
                        <input type="hidden" name="caseId" value={caseId} />
                        <input type="hidden" name="evidenceId" value={file.id} />
                        <SubmitButton
                          className="button-secondary min-h-9 px-3 py-1 text-xs text-red-700"
                          pendingText="Deleting…"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 border-t border-forest/10 pt-6">
            <p className="text-sm text-ink/55">
              Process each document, then confirm, correct or reject every extracted fact before
              using it in the timeline or CasePack.
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
