-- Migration: Add New Site ticket type and file upload support
-- Run this in Supabase SQL Editor if tables already exist
-- This only adds new columns and updates constraints

-- ============================================
-- UPDATE TICKET TYPE CONSTRAINT
-- ============================================
-- Drop existing constraint if it exists (may have different name)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint 
  WHERE conrelid = 'tickets'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%ticket_type%';
  
  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE tickets DROP CONSTRAINT ' || constraint_name;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, continue
    NULL;
END $$;

-- Add updated constraint with New Site option
ALTER TABLE tickets ADD CONSTRAINT tickets_ticket_type_check 
  CHECK (ticket_type IN ('Hardware', 'Software', 'New Site'));

-- ============================================
-- ADD NEW COLUMNS FOR NEW SITE TICKETS
-- ============================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS site_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS installers TEXT[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS site_files JSONB DEFAULT '[]';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS target_date DATE;

-- ============================================
-- ADD ATTACHMENTS COLUMN FOR REGULAR TICKETS
-- ============================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
-- IMPORTANT: First create the 'tickets' bucket in Supabase Dashboard → Storage
-- These will drop and recreate the policies (safe to run multiple times):

-- Allow authenticated users to upload ticket files
DROP POLICY IF EXISTS "Users can upload ticket files" ON storage.objects;
CREATE POLICY "Users can upload ticket files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tickets');

-- Allow authenticated users to read ticket files  
DROP POLICY IF EXISTS "Users can read ticket files" ON storage.objects;
CREATE POLICY "Users can read ticket files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tickets');
