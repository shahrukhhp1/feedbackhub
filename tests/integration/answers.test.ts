import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { createQuestion } from "@/server/repositories/questions";
import { getAnswerByClientRequestId } from "@/server/repositories/answers";
import { getInstallationById } from "@/server/repositories/installations";
import { submitAnswer } from "@/server/services/answers.service";
import {
  createTestApp,
  isTestDatabaseConfigured,
  loginAsAdmin,
  registerTestInstallation,
  resetTestData,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("answers", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  it("submits a remote answer for an active question", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);
    const installationRecord = await getInstallationById(installation.installationId);

    const question = await createQuestion({
      appId: app.id,
      title: "Rate your experience",
      answerType: "rating",
      status: "active",
      required: true,
      allowMultipleAnswers: false,
      createdBy: userId,
    });

    const clientRequestId = randomUUID();
    const result = await submitAnswer(installationRecord!, {
      source: "remote",
      questionId: question.id,
      answer: 5,
      clientRequestId,
    });

    expect(result.answerId).toBeTruthy();
    expect(result.conversationId).toBeTruthy();

    const stored = await getAnswerByClientRequestId(installation.installationId, clientRequestId);
    expect(stored?.questionId).toBe(question.id);
  });

  it("submits a hardcoded answer without a managed question", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);
    const installationRecord = await getInstallationById(installation.installationId);

    const clientRequestId = randomUUID();
    const result = await submitAnswer(installationRecord!, {
      source: "hardcoded",
      externalQuestionKey: "checkout-feedback",
      questionText: "Any comments?",
      answerType: "long_text",
      answer: "Smooth checkout",
      clientRequestId,
    });

    const stored = await getAnswerByClientRequestId(installation.installationId, clientRequestId);
    expect(stored?.externalQuestionKey).toBe("checkout-feedback");
    expect(result.conversationId).toBeTruthy();
  });

  it("returns the same answer on idempotent retries", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);
    const installationRecord = await getInstallationById(installation.installationId);

    const clientRequestId = randomUUID();
    const payload = {
      source: "hardcoded" as const,
      externalQuestionKey: "onboarding",
      questionText: "How was onboarding?",
      answerType: "yes_no" as const,
      answer: true,
      clientRequestId,
    };

    const first = await submitAnswer(installationRecord!, payload);
    const second = await submitAnswer(installationRecord!, payload);

    expect(second).toEqual(first);
  });
});
