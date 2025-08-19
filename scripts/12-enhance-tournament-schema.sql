-- Enhance tournaments table with comprehensive fields
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_type TEXT DEFAULT 'single_elimination' CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'custom')),
ADD COLUMN IF NOT EXISTS entry_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_fee_currency TEXT DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS prize_structure JSONB,
ADD COLUMN IF NOT EXISTS match_rules JSONB,
ADD COLUMN IF NOT EXISTS result_submission_method TEXT DEFAULT 'screenshot' CHECK (result_submission_method IN ('screenshot', 'api', 'manual')),
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS match_schedule JSONB,
ADD COLUMN IF NOT EXISTS platform_device TEXT,
ADD COLUMN IF NOT EXISTS streaming_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS streaming_link TEXT,
ADD COLUMN IF NOT EXISTS host_contact_email TEXT,
ADD COLUMN IF NOT EXISTS host_contact_chat TEXT,
ADD COLUMN IF NOT EXISTS dispute_resolution_rules TEXT,
ADD COLUMN IF NOT EXISTS geographical_restrictions JSONB,
ADD COLUMN IF NOT EXISTS participant_requirements JSONB,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS bracket_size INTEGER,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;

-- Update existing tournaments to have proper values
UPDATE public.tournaments SET 
  tournament_type = 'single_elimination',
  entry_fee_amount = 0,
  entry_fee_currency = 'TZS',
  is_free = true,
  bracket_size = max_participants,
  result_submission_method = 'screenshot',
  platform_device = 'Mixed',
  visibility = 'public'
WHERE tournament_type IS NULL;
