import "server-only";

import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { answers, auditLogs, conversations } from "@/server/db/schema";

export type DashboardOverview = {
  openConversations: number;
  waitingForUserConversations: number;
  answersLast7Days: number;
  answersLast30Days: number;
  recentActivity: Array<{
    id: number;
    action: string;
    entityType: string;
    entityId: string | null;
    actorUserId: string | null;
    createdAt: string;
  }>;
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const db = getDb();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [openRows, waitingRows, answers7Rows, answers30Rows, recentLogs] = await Promise.all([
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.status, "open")),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.status, "waiting_for_user")),
    db
      .select({ id: answers.id })
      .from(answers)
      .where(gte(answers.createdAt, sevenDaysAgo)),
    db
      .select({ id: answers.id })
      .from(answers)
      .where(gte(answers.createdAt, thirtyDaysAgo)),
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10),
  ]);

  return {
    openConversations: openRows.length,
    waitingForUserConversations: waitingRows.length,
    answersLast7Days: answers7Rows.length,
    answersLast30Days: answers30Rows.length,
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorUserId: log.actorUserId,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function getDashboardOverviewForApps(appIds: string[]): Promise<DashboardOverview> {
  if (appIds.length === 0) {
    return {
      openConversations: 0,
      waitingForUserConversations: 0,
      answersLast7Days: 0,
      answersLast30Days: 0,
      recentActivity: [],
    };
  }

  const db = getDb();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [openRows, waitingRows, answers7Rows, answers30Rows] = await Promise.all([
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(inArray(conversations.appId, appIds), eq(conversations.status, "open"))),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(inArray(conversations.appId, appIds), eq(conversations.status, "waiting_for_user")),
      ),
    db
      .select({ id: answers.id })
      .from(answers)
      .where(and(inArray(answers.appId, appIds), gte(answers.createdAt, sevenDaysAgo))),
    db
      .select({ id: answers.id })
      .from(answers)
      .where(and(inArray(answers.appId, appIds), gte(answers.createdAt, thirtyDaysAgo))),
  ]);

  const recentLogs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  return {
    openConversations: openRows.length,
    waitingForUserConversations: waitingRows.length,
    answersLast7Days: answers7Rows.length,
    answersLast30Days: answers30Rows.length,
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorUserId: log.actorUserId,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
