import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import * as messagesRepo from "@/server/repositories/messages";
import { createQuestion } from "@/server/repositories/questions";
import { getInstallationById } from "@/server/repositories/installations";
import { replyToConversation } from "@/server/services/inbox.service";
import { submitAnswer } from "@/server/services/answers.service";
import { getSyncData } from "@/server/services/sync.service";
import {
  createTestApp,
  isTestDatabaseConfigured,
  loginAsAdmin,
  registerTestInstallation,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("sync", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("paginates admin replies using the sequence cursor", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);
    const installationRecord = await getInstallationById(installation.installationId);
    expect(installationRecord).toBeDefined();

    const question = await createQuestion({
      appId: app.id,
      title: "Sync question",
      answerType: "short_text",
      status: "active",
      required: false,
      allowMultipleAnswers: false,
      createdBy: userId,
    });

    const { conversationId } = await submitAnswer(installationRecord!, {
      source: "remote",
      questionId: question.id,
      answer: "hello",
      clientRequestId: randomUUID(),
    });

    await replyToConversation(conversationId, { body: "Reply 1" }, userId, "superadmin");
    await replyToConversation(conversationId, { body: "Reply 2" }, userId, "superadmin");
    await replyToConversation(conversationId, { body: "Reply 3" }, userId, "superadmin");

    const firstPage = await messagesRepo.getMessagesAfterSequence(
      installationRecord!.id,
      0,
      2,
    );
    expect(firstPage).toHaveLength(2);

    const secondPage = await messagesRepo.getMessagesAfterSequence(
      installationRecord!.id,
      firstPage.at(-1)!.sequence,
      10,
    );
    const syncedBodies = [...firstPage, ...secondPage].map((reply) => reply.body);
    expect(syncedBodies).toContain("Reply 1");
    expect(syncedBodies).toContain("Reply 2");
    expect(syncedBodies).toContain("Reply 3");

    const syncPayload = await getSyncData(installationRecord!, 0);
    const adminReplyBodies = syncPayload.replies
      .filter((reply) => reply.senderType === "admin")
      .map((reply) => reply.body);
    expect(adminReplyBodies).toEqual(["Reply 1", "Reply 2", "Reply 3"]);
    expect(syncPayload.hasMore).toBeUndefined();
  });

  it("returns admin replies and drops answered questions from sync", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);
    const installationRecord = await getInstallationById(installation.installationId);
    expect(installationRecord).toBeDefined();

    const question = await createQuestion({
      appId: app.id,
      title: "Need help?",
      answerType: "yes_no",
      status: "active",
      required: false,
      allowMultipleAnswers: false,
      createdBy: userId,
    });

    const syncBeforeAnswer = await getSyncData(installationRecord!, 0);
    expect(syncBeforeAnswer.questions.some((item) => item.id === question.id)).toBe(true);

    const { conversationId } = await submitAnswer(installationRecord!, {
      source: "remote",
      questionId: question.id,
      answer: true,
      clientRequestId: randomUUID(),
    });

    await replyToConversation(conversationId, { body: "Thanks, we can help." }, userId, "superadmin");

    const syncAfterAnswer = await getSyncData(installationRecord!, 0);
    expect(syncAfterAnswer.questions.some((item) => item.id === question.id)).toBe(false);
    expect(syncAfterAnswer.replies.some((reply) => reply.body === "Thanks, we can help.")).toBe(
      true,
    );
  });
});
