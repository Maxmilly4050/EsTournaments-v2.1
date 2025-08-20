-- Add 15 New Users and Join Them to Ragnar Tournament
-- This script creates 15 additional sample users and adds them to the Ragnar tournament

-- First, update the Ragnar tournament to accommodate more participants (increase from 16 to 31)
UPDATE public.tournaments
SET max_participants = 31, current_participants = 31
WHERE id = 'ragnar00-0000-0000-0000-000000000001';

-- Create 15 new sample user profiles with unique usernames and full names
INSERT INTO public.profiles (id, username, full_name, created_at) VALUES
('11111111-2222-3333-4444-555555555555', 'FrostGuardian', 'Elena Volkov', NOW()),
('22222222-3333-4444-5555-666666666666', 'NeonHunter', 'Marcus Chen', NOW()),
('33333333-4444-5555-6666-777777777777', 'SolarFlare', 'Isabella Santos', NOW()),
('44444444-5555-6666-7777-888888888888', 'CrimsonEdge', 'Dmitri Petrov', NOW()),
('55555555-6666-7777-8888-999999999999', 'AquaStorm', 'Zara Al-Rashid', NOW()),
('66666666-7777-8888-9999-aaaaaaaaaaaa', 'GhostRider', 'Kai Nakamura', NOW()),
('77777777-8888-9999-aaaa-bbbbbbbbbbbb', 'LightningBolt', 'Aria Johansson', NOW()),
('88888888-9999-aaaa-bbbb-cccccccccccc', 'SteelTitan', 'Rafael García', NOW()),
('99999999-aaaa-bbbb-cccc-dddddddddddd', 'ShadowPhoenix', 'Luna Rossi', NOW()),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'CosmicWave', 'Alexei Volkov', NOW()),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'InfernoBlaze', 'Priya Sharma', NOW()),
('cccccccc-dddd-eeee-ffff-000000000000', 'IceBreaker', 'Thor Anderson', NOW()),
('dddddddd-eeee-ffff-0000-111111111111', 'WindWalker', 'Sakura Tanaka', NOW()),
('eeeeeeee-ffff-0000-1111-222222222222', 'VoidStrike', 'Omar Hassan', NOW()),
('ffffffff-0000-1111-2222-333333333333', 'NovaBlast', 'Celia Morrison', NOW());

-- Add all 15 new users as participants to the Ragnar tournament
INSERT INTO public.tournament_participants (tournament_id, user_id, joined_at) VALUES
('ragnar00-0000-0000-0000-000000000001', '11111111-2222-3333-4444-555555555555', NOW()),
('ragnar00-0000-0000-0000-000000000001', '22222222-3333-4444-5555-666666666666', NOW()),
('ragnar00-0000-0000-0000-000000000001', '33333333-4444-5555-6666-777777777777', NOW()),
('ragnar00-0000-0000-0000-000000000001', '44444444-5555-6666-7777-888888888888', NOW()),
('ragnar00-0000-0000-0000-000000000001', '55555555-6666-7777-8888-999999999999', NOW()),
('ragnar00-0000-0000-0000-000000000001', '66666666-7777-8888-9999-aaaaaaaaaaaa', NOW()),
('ragnar00-0000-0000-0000-000000000001', '77777777-8888-9999-aaaa-bbbbbbbbbbbb', NOW()),
('ragnar00-0000-0000-0000-000000000001', '88888888-9999-aaaa-bbbb-cccccccccccc', NOW()),
('ragnar00-0000-0000-0000-000000000001', '99999999-aaaa-bbbb-cccc-dddddddddddd', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'cccccccc-dddd-eeee-ffff-000000000000', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'dddddddd-eeee-ffff-0000-111111111111', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'eeeeeeee-ffff-0000-1111-222222222222', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'ffffffff-0000-1111-2222-333333333333', NOW());

-- Verify the updates
SELECT 'Tournament Info' as info_type, name, current_participants, max_participants
FROM public.tournaments
WHERE id = 'ragnar00-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Participant Count' as info_type, 'Total Participants' as name, COUNT(*)::INTEGER as current_participants, 31 as max_participants
FROM public.tournament_participants
WHERE tournament_id = 'ragnar00-0000-0000-0000-000000000001';

-- Show all participants in the tournament
SELECT p.username, p.full_name, tp.joined_at
FROM public.tournament_participants tp
JOIN public.profiles p ON tp.user_id = p.id
WHERE tp.tournament_id = 'ragnar00-0000-0000-0000-000000000001'
ORDER BY tp.joined_at;
