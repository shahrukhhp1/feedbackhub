import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { createQuestion } from "@/server/repositories/questions";
import { getQuestion } from "@/server/repositories/questions";
import { submitAnswer } from "@/server/services/answers.service";
import { getInstallationById } from "@/server/repositories/installations";
import {
  createTestApp,
  isTestDatabaseConfigured,
  loginAsAdmin,
  registerTestInstallation,
  resetTestData,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("isolation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  it("prevents answering another app's question", async () => {
    const { userId } = await loginAsAdmin();
    const appA = await createTestApp(userId, `app-a-${randomUUID().slice(0, 8)}`);
    const appB = await createTestApp(userId, `app-b-${randomUUID().slice(0, 8)}`);

    const question = await createQuestion({
      appId: appA.app.id,
      title: "How likely are you to recommend us?",
      answerType: "rating",
      status: "active",
      required: false,
      allowMultipleAnswers: false,
      createdBy: userId,
    });

    const installationB = await registerTestInstallation(appB.app.id, appB.clientKey);
    const installationRecord = await getInstallationById(installationB.installationId);
    expect(installationRecord).toBeDefined();

    await expect(
      submitAnswer(installationRecord!, {
        source: "remote",
        questionId: question.id,
        answer: 4,
        clientRequestId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(await getQuestion(question.id)).toBeDefined();
  });

  it("scopes answers to the submitting installation", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installationA = await registerTestInstallation(app.id, clientKey, "user-a");
    const installationB = await registerTestInstallation(app.id, clientKey, "user-b");

    const recordA = await getInstallationById(installationA.installationId);
    const recordB = await getInstallationById(installationB.installationId);
    expect(recordA).toBeDefined();
    expect(recordB).toBeDefined();

    const clientRequestId = randomUUID();
    const first = await submitAnswer(recordA!, {
      source: "hardcoded",
      externalQuestionKey: "feedback",
      questionText: "How was your stay?",
      answerType: "short_text",
      answer: "Great",
      clientRequestId,
    });

    await expect(
      submitAnswer(recordB!, {
        source: "hardcoded",
        externalQuestionKey: "feedback",
        questionText: "How was your stay?",
        answerType: "short_text",
        answer: "Great",
        clientRequestId,
      }),
    ).resolves.toMatchObject({
      answerId: expect.not.stringMatching(first.answerId),
    });
  });
});
