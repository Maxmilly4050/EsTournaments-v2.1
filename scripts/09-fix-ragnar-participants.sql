-- Fix Ragnar Tournament Participant Count
-- This script manually updates the current_participants count for the Ragnar tournament
-- to reflect the actual number of participants (16)

-- Update the Ragnar tournament to show correct participant count
UPDATE public.tournaments
SET current_participants = 16
WHERE id = 'ragnar00-0000-0000-0000-000000000001';

-- Verify the update worked
SELECT name, current_participants, max_participants
FROM public.tournaments
WHERE id = 'ragnar00-0000-0000-0000-000000000001';

-- Also verify all participants are properly recorded
SELECT COUNT(*) as actual_participants
FROM public.tournament_participants
WHERE tournament_id = 'ragnar00-0000-0000-0000-000000000001';
