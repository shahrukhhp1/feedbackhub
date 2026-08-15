"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { App } from "@/lib/admin-types";
import { ApiRequestBlock } from "@/components/integration/api-request-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyableText } from "@/components/shared/copyable-text";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";

const EXAMPLE_USER_GUID = "your-local-installation-guid";
const EXAMPLE_WEB_USER_GUID = "stable-browser-session-or-user-id";
const EXAMPLE_CONTACT_EMAIL = "visitor@example.com";
const EXAMPLE_TOKEN = "INSTALLATION_TOKEN_FROM_STEP_1";
const EXAMPLE_QUESTION_ID = "QUESTION_ID_FROM_SYNC";
const EXAMPLE_REQUEST_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function IntegrationPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [appId, setAppId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrationKind, setIntegrationKind] = useState<"mobile" | "web">("mobile");

  const selectedApp = apps.find((app) => app.id === appId);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    void loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listApps();
      setApps(res.items);
      if (res.items[0]) setAppId(res.items[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }

  const registerBody = useMemo(
    () =>
      integrationKind === "web"
        ? {
            appId: appId || "YOUR_APP_ID",
            clientKey: selectedApp?.clientKey ?? "YOUR_CLIENT_KEY",
            userGuid: EXAMPLE_WEB_USER_GUID,
            platform: "web",
            contactEmail: EXAMPLE_CONTACT_EMAIL,
            locale: "en-US",
            timezone: "UTC",
          }
        : {
            appId: appId || "YOUR_APP_ID",
            clientKey: selectedApp?.clientKey ?? "YOUR_CLIENT_KEY",
            userGuid: EXAMPLE_USER_GUID,
            platform: "ios",
            appVersion: "1.0.0",
            locale: "en-US",
            timezone: "UTC",
          },
    [appId, integrationKind, selectedApp?.clientKey],
  );

  const registerCurl = `curl -X POST ${baseUrl}/api/v1/installations/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(registerBody)}'`;

  const syncUrl = `${baseUrl}/api/v1/sync?after=0`;
  const syncCurl = `curl "${syncUrl}" \\
  -H "Authorization: Bearer ${EXAMPLE_TOKEN}"`;

  const answerBody = {
    questionId: EXAMPLE_QUESTION_ID,
    answer: 5,
    clientRequestId: EXAMPLE_REQUEST_ID,
  };

  const answerCurl = `curl -X POST ${baseUrl}/api/v1/answers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${EXAMPLE_TOKEN}" \\
  -d '${JSON.stringify(answerBody)}'`;

  const feedbackBody = {
    subject: "Need help",
    message: "I cannot complete checkout on iOS.",
    clientRequestId: EXAMPLE_REQUEST_ID,
  };

  const feedbackCurl = `curl -X POST ${baseUrl}/api/v1/conversations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${EXAMPLE_TOKEN}" \\
  -d '${JSON.stringify(feedbackBody)}'`;

  const registerResponse = {
    installationId: "660e8400-e29b-41d4-a716-446655440001",
    token: "base64url-installation-token-save-this",
  };

  const syncResponse = {
    questions: [
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "How satisfied are you?",
        description: null,
        answerType: "rating",
        options: null,
        required: false,
      },
    ],
    replies: [
      {
        id: "550e8400-e29b-41d4-a716-446655440020",
        sequence: 12346,
        conversationId: "550e8400-e29b-41d4-a716-446655440030",
        senderType: "admin",
        body: "Thanks for your feedback!",
        createdAt: "2026-08-07T12:00:00.000Z",
      },
    ],
    nextCursor: "12346",
    serverTime: "2026-08-07T12:05:00.000Z",
    hasMore: false,
  };

  const answerResponse = {
    answerId: "770e8400-e29b-41d4-a716-446655440003",
    conversationId: "880e8400-e29b-41d4-a716-446655440004",
  };

  const feedbackResponse = {
    conversationId: "880e8400-e29b-41d4-a716-446655440005",
    messageId: "990e8400-e29b-41d4-a716-446655440006",
  };

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => void loadApps()} />;

  if (apps.length === 0) {
    return (
      <EmptyState
        title="No apps yet"
        description="Create an app first to see integration instructions with your app ID."
        action={
          <Link href="/apps/new" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Create an app
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          Step-by-step guide for integrating a mobile app or website with the Feedback Hub API. All
          client endpoints live under <code className="text-xs">/api/v1</code>. Browser embeds use
          the same routes; call register from your site origin so CORS applies.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">Select app</label>
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose an app" />
            </SelectTrigger>
            <SelectContent>
              {apps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">Integration type</label>
          <Select
            value={integrationKind}
            onValueChange={(value) => setIntegrationKind(value as "mobile" | "web")}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Mobile app (iOS / Android)</SelectItem>
              <SelectItem value="web">Website (browser / embed)</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-gray-500">
            {integrationKind === "web"
              ? "Use platform web and optional contactEmail so admins can see who submitted feedback."
              : "Use platform ios or android. Store the installation token in secure device storage."}
          </p>
        </div>
        {selectedApp ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">App ID</dt>
              <dd className="font-mono text-xs text-gray-900">{selectedApp.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Client key</dt>
              <dd className="mt-1">
                <CopyableText value={selectedApp.clientKey} />
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1. Register installation (get token)</h2>
        <p className="text-sm text-gray-600">
          {integrationKind === "web"
            ? "Call when a visitor opens your feedback widget or form. Use a stable userGuid (session or logged-in user id). Include contactEmail when you collect the visitor's email — it appears in Answers and Inbox."
            : "Call on first launch with your app ID, client key, and a stable userGuid generated and stored by the app. Store the returned installation token securely (Keychain / Keystore)."}
        </p>
        <ApiRequestBlock
          method="POST"
          url={`${baseUrl}/api/v1/installations/register`}
          headers={[{ name: "Content-Type", value: "application/json" }]}
          body={registerBody}
          response={registerResponse}
          curl={registerCurl}
        />
        <p className="text-xs text-gray-500">
          Save <code className="text-xs">token</code> immediately — it is only returned once per
          registration.
          {integrationKind === "web"
            ? " For websites, store it in sessionStorage or memory for the visit; re-register when it expires."
            : null}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2. Sync (get questions &amp; replies)</h2>
        <p className="text-sm text-gray-600">
          Poll when the app opens or resumes. Use the installation token from step 1. Start with{" "}
          <code className="text-xs">after=0</code> on first sync; then use{" "}
          <code className="text-xs">nextCursor</code> from the previous response.
        </p>
        <ApiRequestBlock
          method="GET"
          url={syncUrl}
          headers={[{ name: "Authorization", value: `Bearer ${EXAMPLE_TOKEN}` }]}
          response={syncResponse}
          curl={syncCurl}
        />
        <p className="text-xs text-gray-500">
          Use <code className="text-xs">questions[].id</code> for submitting answers. Persist{" "}
          <code className="text-xs">nextCursor</code> for the next sync call.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3. Submit an answer</h2>
        <p className="text-sm text-gray-600">
          Send a <code className="text-xs">questionId</code> from sync (remote question). Include a
          new UUID <code className="text-xs">clientRequestId</code> per request for safe retries.
        </p>
        <ApiRequestBlock
          method="POST"
          url={`${baseUrl}/api/v1/answers`}
          headers={[
            { name: "Content-Type", value: "application/json" },
            { name: "Authorization", value: `Bearer ${EXAMPLE_TOKEN}` },
          ]}
          body={answerBody}
          response={answerResponse}
          curl={answerCurl}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">4. Submit general feedback</h2>
        <p className="text-sm text-gray-600">
          Optional — opens a conversation admins can reply to in the Inbox.
        </p>
        <ApiRequestBlock
          method="POST"
          url={`${baseUrl}/api/v1/conversations`}
          headers={[
            { name: "Content-Type", value: "application/json" },
            { name: "Authorization", value: `Bearer ${EXAMPLE_TOKEN}` },
          ]}
          body={feedbackBody}
          response={feedbackResponse}
          curl={feedbackCurl}
        />
      </section>

      <p className="text-xs text-gray-500">
        See <code className="text-xs">docs/openapi.yaml</code> and{" "}
        <code className="text-xs">docs/mobile-integration-guide.md</code> in the repository for
        acknowledge, and retry behaviour.
      </p>
    </div>
  );
}
