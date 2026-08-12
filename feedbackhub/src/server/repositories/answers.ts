import { and, asc, desc, eq, gte, lt, lte, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { answers, installations } from "@/server/db/schema";
import type { CursorPage, DbOrTransaction } from "./types";

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type AnswerWithUser = Answer & { userGuid: string; contactEmail: string | null };

export type ListAnswersFilters = {
  appId?: string;
  questionId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
};

function encodeAnswerCursor(createdAt: Date, id: string): string {
  return `${createdAt.getTime()}:${id}`;
}

function decodeAnswerCursor(cursor: string): { createdAt: Date; id: string } {
  const separatorIndex = cursor.indexOf(":");
  const timestamp = cursor.slice(0, separatorIndex);
  const id = cursor.slice(separatorIndex + 1);
  return { createdAt: new Date(Number(timestamp)), id };
}

type Db = DbOrTransaction;

export async function createAnswer(data: NewAnswer, db: Db = getDb()): Promise<Answer> {
  const [answer] = await db.insert(answers).values(data).returning();
  return answer;
}

export async function countAnswersByQuestion(questionId: string): Promise<number> {
  const rows = await getDb()
    .select({ id: answers.id })
    .from(answers)
    .where(eq(answers.questionId, questionId));
  return rows.length;
}

export async function getAnswerByClientRequestId(
  installationId: string,
  clientRequestId: string,
  db: Db = getDb(),
): Promise<Answer | undefined> {
  const [answer] = await db
    .select()
    .from(answers)
    .where(
      and(
        eq(answers.installationId, installationId),
        eq(answers.clientRequestId, clientRequestId),
      ),
    )
    .limit(1);
  return answer;
}

export async function getAnswerById(id: string): Promise<Answer | undefined> {
  const [answer] = await getDb().select().from(answers).where(eq(answers.id, id)).limit(1);
  return answer;
}

export async function listAnswers(
  filters: ListAnswersFilters = {},
): Promise<CursorPage<AnswerWithUser>> {
  const limit = filters.limit ?? 20;
  const conditions = [];

  if (filters.appId) {
    conditions.push(eq(answers.appId, filters.appId));
  }
  if (filters.questionId) {
    conditions.push(eq(answers.questionId, filters.questionId));
  }
  if (filters.from) {
    conditions.push(gte(answers.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(answers.createdAt, filters.to));
  }
  if (filters.cursor) {
    const { createdAt, id } = decodeAnswerCursor(filters.cursor);
    conditions.push(
      or(
        lt(answers.createdAt, createdAt),
        and(eq(answers.createdAt, createdAt), lt(answers.id, id)),
      )!,
    );
  }

  const rows = await getDb()
    .select({
      id: answers.id,
      appId: answers.appId,
      installationId: answers.installationId,
      questionId: answers.questionId,
      externalQuestionKey: answers.externalQuestionKey,
      questionTextSnapshot: answers.questionTextSnapshot,
      answerType: answers.answerType,
      answer: answers.answer,
      clientRequestId: answers.clientRequestId,
      createdAt: answers.createdAt,
      userGuid: installations.userGuid,
      contactEmail: installations.contactEmail,
    })
    .from(answers)
    .innerJoin(installations, eq(answers.installationId, installations.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(answers.createdAt), desc(answers.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last ? encodeAnswerCursor(last.createdAt, last.id) : null,
  };
}

export async function listAnswersForExport(
  appId: string,
  from: Date,
  to: Date,
): Promise<AnswerWithUser[]> {
  return getDb()
    .select({
      id: answers.id,
      appId: answers.appId,
      installationId: answers.installationId,
      questionId: answers.questionId,
      externalQuestionKey: answers.externalQuestionKey,
      questionTextSnapshot: answers.questionTextSnapshot,
      answerType: answers.answerType,
      answer: answers.answer,
      clientRequestId: answers.clientRequestId,
      createdAt: answers.createdAt,
      userGuid: installations.userGuid,
      contactEmail: installations.contactEmail,
    })
    .from(answers)
    .innerJoin(installations, eq(answers.installationId, installations.id))
    .where(
      and(
        eq(answers.appId, appId),
        gte(answers.createdAt, from),
        lte(answers.createdAt, to),
      ),
    )
    .orderBy(asc(answers.createdAt), asc(answers.id));
}
