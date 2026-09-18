CREATE SCHEMA IF NOT EXISTS "public";
CREATE TYPE "public"."CaseCategory" AS ENUM ('UNPAID_WAGES', 'DELAYED_WAGES', 'FINAL_PAY', 'TERMINATION_DOCUMENTATION', 'NOTICE_REVIEW');
CREATE TYPE "public"."CaseStage" AS ENUM ('INTAKE', 'EVIDENCE', 'FACT_REVIEW', 'TIMELINE', 'NURU_CHECK', 'ACTION_PATH', 'CASEPACK', 'COMPLETE');
CREATE TYPE "public"."VerificationStatus" AS ENUM ('CANDIDATE', 'CONFIRMED', 'CORRECTED', 'REJECTED', 'USER_STATED', 'CONFLICTING');
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('WAITING', 'PROCESSING', 'NEEDS_ATTENTION', 'READY', 'FAILED');
CREATE TYPE "public"."RelationshipType" AS ENUM ('SUPPORTS', 'CONFLICTS', 'CONTEXT');
CREATE TYPE "public"."CheckSeverity" AS ENUM ('INFO', 'ATTENTION', 'BLOCKING');

CREATE TABLE "public"."Case" (
  "id" TEXT NOT NULL, "ownerSessionId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "category" "public"."CaseCategory" NOT NULL, "jurisdiction" TEXT NOT NULL DEFAULT 'Kenya',
  "stage" "public"."CaseStage" NOT NULL DEFAULT 'INTAKE', "progress" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."IntakeResponse" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "questionKey" TEXT NOT NULL, "answer" JSONB NOT NULL,
  "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'USER_STATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntakeResponse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."EvidenceFile" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "filename" TEXT NOT NULL, "documentType" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL, "storageKey" TEXT NOT NULL,
  "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'WAITING',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."ExtractedFact" (
  "id" TEXT NOT NULL, "evidenceFileId" TEXT NOT NULL, "factType" TEXT NOT NULL, "candidateValue" JSONB NOT NULL,
  "correctedValue" JSONB, "page" INTEGER, "excerpt" TEXT, "confidence" DOUBLE PRECISION,
  "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'CANDIDATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExtractedFact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."CaseEvent" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "eventDate" TIMESTAMP(3),
  "approximateDate" TEXT, "description" TEXT NOT NULL, "verificationStatus" "public"."VerificationStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."EvidenceLink" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "evidenceFileId" TEXT NOT NULL, "extractedFactId" TEXT,
  "relationship" "public"."RelationshipType" NOT NULL, CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."NuruCheck" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "checkType" TEXT NOT NULL, "severity" "public"."CheckSeverity" NOT NULL,
  "description" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruCheck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."LegalSource" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "issuingBody" TEXT NOT NULL, "canonicalUrl" TEXT NOT NULL,
  "provision" TEXT, "versionDate" TIMESTAMP(3), "verifiedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."ActionReference" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "legalSourceId" TEXT NOT NULL, "explanation" TEXT NOT NULL,
  "reviewRequired" BOOLEAN NOT NULL DEFAULT true, CONSTRAINT "ActionReference_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."GeneratedDocument" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "documentType" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL, "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Case_ownerSessionId_updatedAt_idx" ON "public"."Case"("ownerSessionId", "updatedAt");
CREATE INDEX "IntakeResponse_caseId_idx" ON "public"."IntakeResponse"("caseId");
CREATE UNIQUE INDEX "IntakeResponse_caseId_questionKey_key" ON "public"."IntakeResponse"("caseId", "questionKey");
CREATE UNIQUE INDEX "EvidenceFile_storageKey_key" ON "public"."EvidenceFile"("storageKey");
CREATE INDEX "EvidenceFile_caseId_uploadedAt_idx" ON "public"."EvidenceFile"("caseId", "uploadedAt");
CREATE INDEX "ExtractedFact_evidenceFileId_factType_idx" ON "public"."ExtractedFact"("evidenceFileId", "factType");
CREATE INDEX "CaseEvent_caseId_eventDate_idx" ON "public"."CaseEvent"("caseId", "eventDate");
CREATE INDEX "EvidenceLink_evidenceFileId_idx" ON "public"."EvidenceLink"("evidenceFileId");
CREATE UNIQUE INDEX "EvidenceLink_eventId_evidenceFileId_extractedFactId_key" ON "public"."EvidenceLink"("eventId", "evidenceFileId", "extractedFactId");
CREATE INDEX "NuruCheck_caseId_status_idx" ON "public"."NuruCheck"("caseId", "status");
CREATE UNIQUE INDEX "LegalSource_canonicalUrl_provision_key" ON "public"."LegalSource"("canonicalUrl", "provision");
CREATE INDEX "ActionReference_caseId_idx" ON "public"."ActionReference"("caseId");
CREATE INDEX "GeneratedDocument_caseId_documentType_idx" ON "public"."GeneratedDocument"("caseId", "documentType");

ALTER TABLE "public"."IntakeResponse" ADD CONSTRAINT "IntakeResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EvidenceFile" ADD CONSTRAINT "EvidenceFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ExtractedFact" ADD CONSTRAINT "ExtractedFact_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "public"."EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EvidenceLink" ADD CONSTRAINT "EvidenceLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."CaseEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EvidenceLink" ADD CONSTRAINT "EvidenceLink_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "public"."EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EvidenceLink" ADD CONSTRAINT "EvidenceLink_extractedFactId_fkey" FOREIGN KEY ("extractedFactId") REFERENCES "public"."ExtractedFact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."NuruCheck" ADD CONSTRAINT "NuruCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ActionReference" ADD CONSTRAINT "ActionReference_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ActionReference" ADD CONSTRAINT "ActionReference_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "public"."LegalSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
