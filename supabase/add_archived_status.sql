-- Migration: Add 'archived' as a valid student status
-- Run this in the Supabase SQL Editor.

-- 1. Drop the existing check constraint on profiles.status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Re-add with 'archived' included
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));
