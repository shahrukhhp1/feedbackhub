import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
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
  resetTestData,
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

  beforeEach(async () => {
    await resetTestData();
  });

  it("paginates admin replies using the sequence cursor", async () => {
    const getMessagesSpy = vi
      .spyOn(messagesRepo, "getMessagesAfterSequence")
      .mockImplementation((installationId, afterSequence) =>
        messagesRepo.getMessagesAfterSequence(installationId, afterSequence, 2),
      );

    try {
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

      const firstPage = await getSyncData(installationRecord!, 0);
      expect(firstPage.replies).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(Number(firstPage.nextCursor)).toBeGreaterThan(0);

      const secondPage = await getSyncData(
        installationRecord!,
        Number(firstPage.nextCursor),
      );
      expect(secondPage.replies.length).toBeGreaterThanOrEqual(1);
      expect(secondPage.replies.some((reply) => reply.body === "Reply 3")).toBe(true);
    } finally {
      getMessagesSpy.mockRestore();
    }
  });

  it("includes admin replies in sync output", async () => {
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

    const { conversationId } = await submitAnswer(installationRecord!, {
      source: "remote",
      questionId: question.id,
      answer: true,
      clientRequestId: randomUUID(),
    });

    await replyToConversation(conversationId, { body: "Thanks, we can help." }, userId, "superadmin");

    const sync = await getSyncData(installationRecord!, 0);
    expect(sync.questions.some((item) => item.id === question.id)).toBe(true);
    expect(sync.replies.some((reply) => reply.body === "Thanks, we can help.")).toBe(true);
  });
});
