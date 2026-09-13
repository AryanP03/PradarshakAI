-- Migration v10: Add job_business_other column to users table
-- Supports custom user-specified livelihood/trade when "Other" is selected in registration or profile

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS job_business_other TEXT;

COMMIT;
