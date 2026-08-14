import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_BASE_URL: z.string().url("APP_BASE_URL must be a valid URL"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  SUPERADMIN_INITIAL_PASSWORD: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Environment validation failed:\n${messages.join("\n")}`);
  }
  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
