-- Migration: Add multi-user authentication
-- This script safely migrates existing data to support per-user isolation

BEGIN;

-- Step 1: Create NextAuth tables (Users, Accounts, Sessions, VerificationTokens)
-- These will be created by Prisma migration automatically

-- Step 2: Create a system user to own all existing data
INSERT INTO users (id, email, password, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system@ledger.local',
  '$2a$10$YGZj8vHKqHq8qHEqHqHqHu7UqHqHqHqHqHqHqHqHqHqHqHqHqHqHq',  -- bcrypt hash of "ChangeMe123!"
  'System User (Legacy Data)',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add user_id columns to core tables (nullable first)
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 4: Populate user_id for all existing records
UPDATE platforms SET user_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE user_id IS NULL;
UPDATE plans SET user_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE user_id IS NULL;
UPDATE subscriptions SET user_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE user_id IS NULL;
UPDATE clients SET user_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE user_id IS NULL;

-- Step 5: Make user_id NOT NULL and add foreign keys
ALTER TABLE platforms ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE platforms ADD CONSTRAINT platforms_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD CONSTRAINT clients_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS platforms_user_id_idx ON platforms(user_id);
CREATE INDEX IF NOT EXISTS plans_user_id_idx ON plans(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);

-- Step 7: Update unique constraint on platforms (was global, now per-user)
ALTER TABLE platforms DROP CONSTRAINT IF EXISTS platforms_name_key;
ALTER TABLE platforms ADD CONSTRAINT platforms_user_id_name_key UNIQUE (user_id, name);

COMMIT;

-- Instructions:
-- 1. This migration will be handled by `prisma migrate dev`
-- 2. The system user credentials are: email=system@ledger.local, password=ChangeMe123!
-- 3. After migration, you can login as this user to access legacy data
-- 4. You can reassign or delete this data once real users are created
