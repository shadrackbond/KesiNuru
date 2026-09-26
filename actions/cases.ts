"use server";

import { CaseCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { objectIdSchema } from "@/lib/validation";

const createCaseSchema = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.enum(CaseCategory),
});
const MAX_CASES_PER_SESSION = 10;

export async function createCase(formData: FormData) {
  const ownerSessionId = await requireSessionId();
  const caseCount = await prisma.case.count({ where: { ownerSessionId } });
  if (caseCount >= MAX_CASES_PER_SESSION) {
    redirect("/cases/new?error=This%20demo%20session%20has%20reached%20its%2010-case%20limit");
  }
  const result = createCaseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
  });
  if (!result.success) redirect("/cases/new?error=Please%20check%20the%20case%20details");

  const item = await prisma.case.create({ data: { ...result.data, ownerSessionId } });
  revalidatePath("/dashboard");
  redirect(`/cases/${item.id}`);
}

export async function deleteCase(formData: FormData) {
  const ownerSessionId = await requireSessionId();
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  await prisma.case.deleteMany({ where: { id: caseId, ownerSessionId } });
  revalidatePath("/dashboard");
  redirect("/dashboard?deleted=1");
}
