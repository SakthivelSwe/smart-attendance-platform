-- Fix: Add 'MANAGER' to the users role check constraint
-- The old constraint only allowed: ADMIN, USER, TEAM_LEAD (missing MANAGER and possibly VIEWER)
-- Run this against your PostgreSQL / Supabase database once.

-- Step 1: Drop the old check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Re-add the constraint with all valid UserRole enum values
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'MANAGER', 'TEAM_LEAD', 'USER'));
