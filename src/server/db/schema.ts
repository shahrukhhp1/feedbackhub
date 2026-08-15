import {
  bigint,
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Application tables ───────────────────────────────────────────────────────

export const apps = pgTable(
  "apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    clientKey: varchar("client_key", { length: 120 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const appMembers = pgTable(
  "app_members",
  {
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    appRole: varchar("app_role", { length: 20 }).notNull(),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.userId], name: "app_members_app_id_user_id_pk" }),
    index("app_members_user_id_idx").on(table.userId),
  ],
);

export const installations = pgTable(
  "installations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id),
    userGuid: varchar("user_guid", { length: 128 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    platform: varchar("platform", { length: 20 }),
    appVersion: varchar("app_version", { length: 40 }),
    locale: varchar("locale", { length: 20 }),
    timezone: varchar("timezone", { length: 80 }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("installations_app_user_guid_unique").on(table.appId, table.userGuid),
    unique("installations_token_hash_unique").on(table.tokenHash),
    index("installations_app_user_guid_idx").on(table.appId, table.userGuid),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    answerType: varchar("answer_type", { length: 30 }).notNull(),
    options: jsonb("options"),
    required: boolean("required").notNull().default(false),
    allowMultipleAnswers: boolean("allow_multiple_answers").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("questions_app_status_schedule_idx").on(
      table.appId,
      table.status,
      table.startsAt,
      table.endsAt,
    ),
  ],
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => installations.id),
    questionId: uuid("question_id").references(() => questions.id),
    externalQuestionKey: varchar("external_question_key", { length: 120 }),
    questionTextSnapshot: text("question_text_snapshot").notNull(),
    answerType: varchar("answer_type", { length: 30 }).notNull(),
    answer: jsonb("answer").notNull(),
    clientRequestId: uuid("client_request_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("answers_installation_client_request_unique").on(
      table.installationId,
      table.clientRequestId,
    ),
    index("answers_app_created_idx").on(table.appId, table.createdAt),
    index("answers_question_created_idx").on(table.questionId, table.createdAt),
    check(
      "answers_question_source_check",
      sql`(${table.questionId} IS NOT NULL) OR (${table.externalQuestionKey} IS NOT NULL)`,
    ),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => installations.id),
    answerId: uuid("answer_id").references(() => answers.id),
    sourceType: varchar("source_type", { length: 30 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversations_app_status_last_msg_idx").on(
      table.appId,
      table.status,
      table.lastMessageAt,
    ),
    index("conversations_installation_last_msg_idx").on(
      table.installationId,
      table.lastMessageAt,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequence: bigint("sequence", { mode: "number" }).generatedAlwaysAsIdentity().unique(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    senderType: varchar("sender_type", { length: 30 }).notNull(),
    adminUserId: text("admin_user_id").references(() => user.id),
    body: text("body").notNull(),
    clientRequestId: uuid("client_request_id"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_conversation_sequence_idx").on(table.conversationId, table.sequence),
    index("messages_sequence_idx").on(table.sequence),
    uniqueIndex("messages_conversation_client_request_unique")
      .on(table.conversationId, table.clientRequestId)
      .where(sql`${table.clientRequestId} IS NOT NULL`),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);
