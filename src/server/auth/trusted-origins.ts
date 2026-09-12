import "server-only";

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function alternateWwwOrigin(origin: string): string | null {
  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost")) {
      return null;
    }

    if (parsed.hostname.startsWith("www.")) {
      const alt = new URL(parsed);
      alt.hostname = parsed.hostname.slice(4);
      return alt.origin;
    }

    const alt = new URL(parsed);
    alt.hostname = `www.${parsed.hostname}`;
    return alt.origin;
  } catch {
    return null;
  }
}

export function buildAuthTrustedOrigins(
  appBaseUrl: string,
  extraOriginsCsv?: string,
): string[] {
  const origins = new Set<string>();
  const base = normalizeOrigin(appBaseUrl);
  origins.add(base);

  const alternate = alternateWwwOrigin(base);
  if (alternate) {
    origins.add(alternate);
  }

  if (extraOriginsCsv) {
    for (const part of extraOriginsCsv.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      origins.add(normalizeOrigin(trimmed));
    }
  }

  return [...origins];
}
