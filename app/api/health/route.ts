import { deploymentConfigStatus } from "@/lib/deployment";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = deploymentConfigStatus({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
  let database = false;
  if (config.checks.databaseUrl) {
    try {
      await prisma.case.findFirst({ select: { id: true } });
      database = true;
    } catch {
      database = false;
    }
  }
  const ready = config.ready && database;
  return Response.json(
    {
      status: ready ? "ok" : "degraded",
      checks: { configuration: config.ready, database },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
