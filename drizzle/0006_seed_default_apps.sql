-- Wallez (mobile) + Shahkings web — appId/clientKey match shipped client config.
--> statement-breakpoint
DO $$
DECLARE
  admin_id text;
BEGIN
  SELECT id INTO admin_id
  FROM "user"
  WHERE role = 'superadmin' AND disabled_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE '0006_seed_default_apps: no superadmin — run pnpm bootstrap:superadmin then pnpm db:seed-apps';
    RETURN;
  END IF;

  INSERT INTO apps (id, name, slug, client_key, status, created_by, created_at, updated_at)
  VALUES (
    '969ee292-fcfe-41fa-bc04-02dcc2fc02ac',
    'Wallez',
    'wallez',
    'fh_hp9L8O9Un8TOMNwKy5j9mx0hHqf4E9fz',
    'active',
    admin_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    client_key = EXCLUDED.client_key,
    status = 'active',
    updated_at = now();

  INSERT INTO app_members (app_id, user_id, app_role, created_by, created_at)
  VALUES ('969ee292-fcfe-41fa-bc04-02dcc2fc02ac', admin_id, 'admin', admin_id, now())
  ON CONFLICT (app_id, user_id) DO NOTHING;

  INSERT INTO apps (id, name, slug, client_key, status, created_by, created_at, updated_at)
  VALUES (
    '6808e530-eaed-4ca5-8212-e4a5c8965dc6',
    'Shahkings - Web',
    'shahkings-web',
    'fh_fO-y749oy_cbbH_SaEj0Vj72gxqFmFte',
    'active',
    admin_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    client_key = EXCLUDED.client_key,
    status = 'active',
    updated_at = now();

  INSERT INTO app_members (app_id, user_id, app_role, created_by, created_at)
  VALUES ('6808e530-eaed-4ca5-8212-e4a5c8965dc6', admin_id, 'admin', admin_id, now())
  ON CONFLICT (app_id, user_id) DO NOTHING;
END $$;
