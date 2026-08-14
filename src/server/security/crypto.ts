import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
import { getEnv } from "@/server/env";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateClientKey(): string {
  return `fh_${randomBytes(24).toString("base64url")}`;
}

export function verifyClientKey(provided: string, stored: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyTokenHash(token: string, storedHash: string): boolean {
  const computed = hashToken(token);
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
