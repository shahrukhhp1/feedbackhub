/**
 * PROTECTED INTEGRATION TESTS — core product flow (HTTP API).
 *
 * Do not modify, delete, or weaken these tests unless the user explicitly asks.
 * See tests/PROTECTED_TESTS.md and .cursor/rules/protected-integration-tests.mdc.
 */
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  clearAdminSessionCookie,
  createApiRequest,
  expectJsonOk,
  loginAsAdminForApi,
} from "./api-helpers";
import {
  isTestDatabaseConfigured,
  resetTestData,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("core flow (protected API)", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    clearAdminSessionCookie();
    await teardownTestDb();
  });

  beforeEach(async () => {
    clearAdminSessionCookie();
    await resetTestData();
  });

  it("creates an app, question, registers, syncs, and submits an answer via HTTP APIs", async () => {
    const [
      { POST: createAppRoute },
      { GET: listQuestionsRoute, POST: createQuestionRoute },
      { GET: getQuestionRoute },
      { POST: registerRoute },
      { GET: syncRoute },
      { POST: submitAnswerRoute },
    ] = await Promise.all([
      import("@/app/api/admin/apps/route"),
      import("@/app/api/admin/questions/route"),
      import("@/app/api/admin/questions/[questionId]/route"),
      import("@/app/api/v1/installations/register/route"),
      import("@/app/api/v1/sync/route"),
      import("@/app/api/v1/answers/route"),
    ]);

    await loginAsAdminForApi();

    const slug = `flow-${randomUUID().slice(0, 8)}`;
    const createAppResponse = await createAppRoute(
      createApiRequest("/api/admin/apps", {
        method: "POST",
        body: {
          name: "Flow Test App",
          slug,
          status: "active",
        },
      }),
    );
    const createAppBody = await expectJsonOk<{
      app: { id: string; name: string; slug: string };
      clientKey: string;
    }>(createAppResponse);
    expect(createAppBody.app.slug).toBe(slug);
    expect(createAppBody.clientKey.length).toBeGreaterThan(10);

    const createQuestionResponse = await createQuestionRoute(
      createApiRequest("/api/admin/questions", {
        method: "POST",
        body: {
          appId: createAppBody.app.id,
          title: "How was your visit?",
          answerType: "rating",
          status: "active",
          required: true,
          allowMultipleAnswers: false,
        },
      }),
    );
    const createdQuestion = await expectJsonOk<{
      id: string;
      appId: string;
      title: string;
      status: string;
    }>(createQuestionResponse);
    expect(createdQuestion.appId).toBe(createAppBody.app.id);
    expect(createdQuestion.status).toBe("active");

    const listQuestionsResponse = await listQuestionsRoute(
      createApiRequest(`/api/admin/questions?appId=${createAppBody.app.id}`),
    );
    const listedQuestions = await expectJsonOk<{
      items: Array<{ id: string }>;
    }>(listQuestionsResponse);
    expect(listedQuestions.items.some((item) => item.id === createdQuestion.id)).toBe(true);

    const getQuestionResponse = await getQuestionRoute(
      createApiRequest(`/api/admin/questions/${createdQuestion.id}`),
      { params: Promise.resolve({ questionId: createdQuestion.id }) },
    );
    const fetchedQuestion = await expectJsonOk<{ id: string; title: string }>(getQuestionResponse);
    expect(fetchedQuestion.id).toBe(createdQuestion.id);
    expect(fetchedQuestion.title).toBe("How was your visit?");

    clearAdminSessionCookie();

    const userGuid = randomUUID();
    const registerResponse = await registerRoute(
      createApiRequest("/api/v1/installations/register", {
        method: "POST",
        body: {
          appId: createAppBody.app.id,
          clientKey: createAppBody.clientKey,
          userGuid,
          platform: "ios",
          appVersion: "1.0.0",
          locale: "en-US",
          timezone: "UTC",
        },
      }),
    );
    const registration = await expectJsonOk<{
      installationId: string;
      token: string;
    }>(registerResponse);
    expect(registration.installationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(registration.token.length).toBeGreaterThan(10);

    const syncResponse = await syncRoute(
      createApiRequest("/api/v1/sync?after=0", {
        headers: { authorization: `Bearer ${registration.token}` },
      }),
    );
    const syncBody = await expectJsonOk<{
      questions: Array<{ id: string; title: string }>;
      replies: unknown[];
      nextCursor: string;
      serverTime: string;
    }>(syncResponse);
    expect(syncBody.questions.some((q) => q.id === createdQuestion.id)).toBe(true);
    expect(syncBody.nextCursor).toBeTruthy();
    expect(syncBody.serverTime).toBeTruthy();

    const clientRequestId = randomUUID();
    const answerResponse = await submitAnswerRoute(
      createApiRequest("/api/v1/answers", {
        method: "POST",
        headers: { authorization: `Bearer ${registration.token}` },
        body: {
          questionId: createdQuestion.id,
          answer: 5,
          clientRequestId,
        },
      }),
    );
    const answerBody = await expectJsonOk<{
      answerId: string;
      conversationId: string;
    }>(answerResponse);
    expect(answerBody.answerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(answerBody.conversationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const syncAfterAnswer = await syncRoute(
      createApiRequest("/api/v1/sync?after=0", {
        headers: { authorization: `Bearer ${registration.token}` },
      }),
    );
    const syncAfterAnswerBody = await expectJsonOk<{
      questions: Array<{ id: string }>;
    }>(syncAfterAnswer);
    expect(syncAfterAnswerBody.questions.some((q) => q.id === createdQuestion.id)).toBe(false);
  });
});
