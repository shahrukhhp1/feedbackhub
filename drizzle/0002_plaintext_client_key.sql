ALTER TABLE "apps" ADD COLUMN "client_key" varchar(120);--> statement-breakpoint
UPDATE "apps" SET "client_key" = 'fh_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE "client_key" IS NULL;--> statement-breakpoint
ALTER TABLE "apps" ALTER COLUMN "client_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "apps" DROP COLUMN "client_key_hash";--> statement-breakpoint
ALTER TABLE "apps" DROP COLUMN "client_key_prefix";
