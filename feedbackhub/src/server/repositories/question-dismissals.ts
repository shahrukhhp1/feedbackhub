import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { questionDismissals } from "@/server/db/schema";

export type QuestionDismissal = typeof questionDismissals.$inferSelect;

export async function dismissQuestion(
  questionId: string,
  installationId: string,
): Promise<QuestionDismissal> {
  const [dismissal] = await getDb()
    .insert(questionDismissals)
    .values({ questionId, installationId })
    .onConflictDoNothing({
      target: [questionDismissals.questionId, questionDismissals.installationId],
    })
    .returning();
  if (dismissal) {
    return dismissal;
  }

  const [existing] = await getDb()
    .select()
    .from(questionDismissals)
    .where(
      and(
        eq(questionDismissals.questionId, questionId),
        eq(questionDismissals.installationId, installationId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Failed to dismiss question");
  }
  return existing;
}

export async function getDismissedQuestionIds(installationId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ questionId: questionDismissals.questionId })
    .from(questionDismissals)
    .where(eq(questionDismissals.installationId, installationId));
  return rows.map((row) => row.questionId);
}
