-- Store MVP evidence in PostgreSQL so deployments do not depend on ephemeral local disks.
ALTER TABLE "EvidenceFile" ADD COLUMN "content" BYTEA NOT NULL DEFAULT '\\x';
ALTER TABLE "EvidenceFile" ALTER COLUMN "content" DROP DEFAULT;
