export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

import { getDb } from "@/server/db";

export type DbExecutor = ReturnType<typeof getDb>;
export type DbTransaction = Parameters<Parameters<DbExecutor["transaction"]>[0]>[0];
export type DbOrTransaction = DbExecutor | DbTransaction;
