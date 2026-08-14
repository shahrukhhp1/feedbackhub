import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { defaultRoles, adminAc, userAc } from "better-auth/plugins/admin/access";
import { getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import { getEnv } from "@/server/env";
import { normalizeEmail } from "@/server/security/crypto";

const env = getEnv();

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  secret: env.AUTH_SECRET,
  baseURL: env.APP_BASE_URL,
  trustedOrigins: [env.APP_BASE_URL],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 6,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "admin",
        input: false,
        returned: true,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
        returned: true,
      },
      disabledAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            email: normalizeEmail(user.email),
          },
        }),
      },
      update: {
        before: async (user) => {
          if (typeof user.email !== "string") return;
          return {
            data: {
              ...user,
              email: normalizeEmail(user.email),
            },
          };
        },
      },
    },
  },
  plugins: [
    admin({
      roles: {
        ...defaultRoles,
        superadmin: adminAc,
        viewer: userAc,
      },
      defaultRole: "admin",
      adminRoles: ["superadmin", "admin"],
    }),
    nextCookies(),
    {
      id: "email-normalization",
      hooks: {
        before: [
          {
            matcher(ctx) {
              return (
                ctx.path === "/sign-in/email" ||
                ctx.path === "/sign-up/email" ||
                ctx.path === "/admin/create-user" ||
                ctx.path === "/forget-password" ||
                ctx.path === "/reset-password"
              );
            },
            handler: createAuthMiddleware(async (ctx) => {
              if (typeof ctx.body?.email === "string") {
                ctx.body.email = normalizeEmail(ctx.body.email);
              }
            }),
          },
        ],
      },
    },
  ],
  advanced: {
    useSecureCookies: env.COOKIE_SECURE,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
