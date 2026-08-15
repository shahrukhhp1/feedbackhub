import { and, desc, eq, gt, gte, ilike, inArray, isNull, lt, lte, notInArray, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { answers, questions } from "@/server/db/schema";

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

import type { CursorPage } from "./types";

export type ListQuestionsFilters = {
  appId?: string;
  status?: string;
  cursor?: string;
  limit?: number;
};

function encodeQuestionCursor(updatedAt: Date, id: string): string {
  return `${updatedAt.getTime()}:${id}`;
}

function decodeQuestionCursor(cursor: string): { updatedAt: Date; id: string } {
  const separatorIndex = cursor.indexOf(":");
  return {
    updatedAt: new Date(Number(cursor.slice(0, separatorIndex))),
    id: cursor.slice(separatorIndex + 1),
  };
}

export type UpdateQuestionMetadataInput = Partial<
  Pick<
    Question,
    | "status"
    | "startsAt"
    | "endsAt"
    | "title"
    | "description"
    | "required"
    | "allowMultipleAnswers"
    | "options"
  >
>;

export async function createQuestion(data: NewQuestion): Promise<Question> {
  const [question] = await getDb().insert(questions).values(data).returning();
  return question;
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  const [question] = await getDb()
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);
  return question;
}

export async function listQuestions(
  filters: ListQuestionsFilters = {},
): Promise<Question[] | CursorPage<Question>> {
  if (!filters.cursor && !filters.limit) {
    const conditions = [];
    if (filters.appId) {
      conditions.push(eq(questions.appId, filters.appId));
    }
    if (filters.status) {
      conditions.push(eq(questions.status, filters.status));
    }

    const query = getDb().select().from(questions);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(questions.updatedAt));
    }
    return query.orderBy(desc(questions.updatedAt));
  }

  return listQuestionsPaginated(filters);
}

export async function listQuestionsPaginated(
  filters: ListQuestionsFilters = {},
): Promise<CursorPage<Question>> {
  const limit = filters.limit ?? 20;
  const conditions = [];

  if (filters.appId) {
    conditions.push(eq(questions.appId, filters.appId));
  }
  if (filters.status) {
    conditions.push(eq(questions.status, filters.status));
  }
  if (filters.cursor) {
    const { updatedAt, id } = decodeQuestionCursor(filters.cursor);
    conditions.push(
      or(
        lt(questions.updatedAt, updatedAt),
        and(eq(questions.updatedAt, updatedAt), lt(questions.id, id)),
      )!,
    );
  }

  const rows = await getDb()
    .select()
    .from(questions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(questions.updatedAt), desc(questions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? encodeQuestionCursor(last.updatedAt, last.id) : null,
  };
}

export async function countAnswersForQuestion(questionId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: sql<number>`count(*)::int` })
    .from(answers)
    .where(eq(answers.questionId, questionId));
  return row?.value ?? 0;
}

export async function updateQuestionMetadata(
  id: string,
  data: UpdateQuestionMetadataInput,
): Promise<Question | undefined> {
  const [question] = await getDb()
    .update(questions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(questions.id, id))
    .returning();
  return question;
}

export async function duplicateQuestion(
  id: string,
  createdBy: string,
): Promise<Question> {
  const source = await getQuestion(id);
  if (!source) {
    throw new Error(`Question not found: ${id}`);
  }

  const [question] = await getDb()
    .insert(questions)
    .values({
      appId: source.appId,
      title: source.title,
      description: source.description,
      answerType: source.answerType,
      options: source.options,
      required: source.required,
      allowMultipleAnswers: source.allowMultipleAnswers,
      status: "draft",
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      createdBy,
    })
    .returning();
  return question;
}

export async function getActiveQuestionsForSync(
  appId: string,
  installationId: string,
  now: Date = new Date(),
): Promise<Question[]> {
  const db = getDb();

  const answeredIds = db
    .select({ questionId: answers.questionId })
    .from(answers)
    .where(
      and(
        eq(answers.installationId, installationId),
        sql`${answers.questionId} IS NOT NULL`,
      ),
    );

  return db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.appId, appId),
        eq(questions.status, "active"),
        or(isNull(questions.startsAt), lte(questions.startsAt, now)),
        or(isNull(questions.endsAt), gt(questions.endsAt, now)),
        or(
          eq(questions.allowMultipleAnswers, true),
          notInArray(questions.id, answeredIds),
        ),
      ),
    )
    .orderBy(questions.createdAt);
}
