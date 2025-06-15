/*
  # Add company details fields

  1. New Columns
    - `description` (text) - Company description/about text
    - `established_in` (integer) - Year the company was established
    - `location` (text) - Company location/address

  2. Changes
    - Add three new columns to the `companies` table
    - All columns are nullable to allow gradual data population
    - No default values to distinguish between empty and unset data
*/

-- Add description column for company about text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE companies ADD COLUMN description text;
  END IF;
END $$;

-- Add established_in column for establishment year
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'established_in'
  ) THEN
    ALTER TABLE companies ADD COLUMN established_in integer;
  END IF;
END $$;

-- Add location column for company address/location
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'location'
  ) THEN
    ALTER TABLE companies ADD COLUMN location text;
  END IF;
END $$;