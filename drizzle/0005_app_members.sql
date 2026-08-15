CREATE TABLE IF NOT EXISTS "app_members" (
  "app_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "app_role" varchar(20) NOT NULL,
  "created_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "app_members_app_id_user_id_pk" PRIMARY KEY ("app_id", "user_id"),
  CONSTRAINT "app_members_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE,
  CONSTRAINT "app_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "app_members_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id")
);

CREATE INDEX IF NOT EXISTS "app_members_user_id_idx" ON "app_members" ("user_id");

INSERT INTO "app_members" ("app_id", "user_id", "app_role", "created_by", "created_at")
SELECT "id", "created_by", 'admin', "created_by", "created_at"
FROM "apps"
ON CONFLICT ("app_id", "user_id") DO NOTHING;
