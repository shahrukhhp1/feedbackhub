"use client";

import { CodeSnippet } from "@/components/integration/code-snippet";

type Header = {
  name: string;
  value: string;
};

export function ApiRequestBlock({
  method,
  url,
  headers,
  body,
  response,
  statusCode = 200,
  curl,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  headers: Header[];
  body?: Record<string, unknown>;
  response: Record<string, unknown>;
  statusCode?: number;
  curl: string;
}) {
  const bodyJson = body ? JSON.stringify(body, null, 2) : null;
  const responseJson = JSON.stringify(response, null, 2);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-900">
          Request
        </p>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Method
            </p>
            <p className="font-mono text-sm font-semibold text-gray-900">{method}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">URL</p>
            <p className="break-all font-mono text-xs text-gray-900">{url}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Headers
            </p>
            {headers.length === 0 ? (
              <p className="text-xs text-gray-500">None</p>
            ) : (
              <ul className="space-y-1">
                {headers.map((header) => (
                  <li key={header.name} className="font-mono text-xs text-gray-900">
                    <span className="text-gray-500">{header.name}:</span> {header.value}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {bodyJson ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Request body
              </p>
              <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-800">
                {bodyJson}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 text-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-900">
          Expected response
        </p>
        <p className="mb-2 font-mono text-xs text-gray-600">HTTP {statusCode}</p>
        <pre className="overflow-x-auto rounded-md bg-white p-3 font-mono text-xs text-gray-800">
          {responseJson}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Or use cURL</p>
        <CodeSnippet code={curl} />
      </div>
    </div>
  );
}
