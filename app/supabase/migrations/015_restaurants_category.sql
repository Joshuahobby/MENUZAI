-- Migration 015: Add category and terms_accepted_at to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS category varchar(50),
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
