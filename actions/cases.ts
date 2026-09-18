"use server";

import { CaseCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";

const createCaseSchema = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.enum(CaseCategory),
});

export async function createCase(formData: FormData) {
  const ownerSessionId = await requireSessionId();
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
  const caseId = z.string().cuid().parse(formData.get("caseId"));
  await prisma.case.deleteMany({ where: { id: caseId, ownerSessionId } });
  revalidatePath("/dashboard");
}
