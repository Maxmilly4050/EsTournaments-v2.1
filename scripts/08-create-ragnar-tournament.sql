-- Create Ragnar Tournament with Sample Users
-- This script creates a new tournament called "Ragnar" and populates it with sample participants

-- Insert the Ragnar tournament
INSERT INTO public.tournaments (id, name, description, game, max_participants, current_participants, status, tournament_type, start_date, end_date, prize_pool, entry_fee, created_by, created_at) VALUES
('ragnar00-0000-0000-0000-000000000001', 'Ragnar Tournament', 'Epic Viking-themed eFootball 2026 tournament featuring the best players. Battle for glory and honor in this legendary competition!', 'eFootball 2026', 16, 16, 'ongoing', 'single_elimination', '2025-08-20 20:00:00+00', '2025-08-22 22:00:00+00', '5,000 TZS', 'Free', '11111111-1111-1111-1111-111111111111', NOW());

-- Add all 16 sample users as participants to the Ragnar tournament
INSERT INTO public.tournament_participants (tournament_id, user_id, joined_at) VALUES
('ragnar00-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', NOW()),
('ragnar00-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', NOW()),
('ragnar00-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', NOW()),
('ragnar00-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', NOW()),
('ragnar00-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', NOW()),
('ragnar00-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', NOW()),
('ragnar00-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', NOW()),
('ragnar00-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', NOW()),
('ragnar00-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW()),
('ragnar00-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NOW()),
('ragnar00-0000-0000-0000-000000000001', '10101010-1010-1010-1010-101010101010', NOW());

-- Create a complete bracket structure for the Ragnar tournament (single elimination, 16 players)
-- Round 1: 8 matches (16 players -> 8 winners)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, status, created_at) VALUES
-- Match 1: ProGamer2024 vs ShadowStrike
('ragnar01-0000-0000-0000-000000000001', 'ragnar00-0000-0000-0000-000000000001', 1, 1, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'completed', NOW()),
-- Match 2: ThunderBolt vs CyberNinja
('ragnar01-0000-0000-0000-000000000002', 'ragnar00-0000-0000-0000-000000000001', 1, 2, '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'completed', NOW()),
-- Match 3: IronFist vs QuantumLeap
('ragnar01-0000-0000-0000-000000000003', 'ragnar00-0000-0000-0000-000000000001', 1, 3, '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'completed', NOW()),
-- Match 4: BlazeFury vs StormBreaker
('ragnar01-0000-0000-0000-000000000004', 'ragnar00-0000-0000-0000-000000000001', 1, 4, '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'completed', NOW()),
-- Match 5: VoidWalker vs PhoenixRise
('ragnar01-0000-0000-0000-000000000005', 'ragnar00-0000-0000-0000-000000000001', 1, 5, '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW()),
-- Match 6: DragonSlayer vs NightHawk
('ragnar01-0000-0000-0000-000000000006', 'ragnar00-0000-0000-0000-000000000001', 1, 6, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'completed', NOW()),
-- Match 7: StarCrusher vs MysticBlade
('ragnar01-0000-0000-0000-000000000007', 'ragnar00-0000-0000-0000-000000000001', 1, 7, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'completed', NOW()),
-- Match 8: TitanForce vs EclipseWing
('ragnar01-0000-0000-0000-000000000008', 'ragnar00-0000-0000-0000-000000000001', 1, 8, 'ffffffff-ffff-ffff-ffff-ffffffffffff', '10101010-1010-1010-1010-101010101010', 'completed', NOW());

-- Add winners to Round 1 matches (simulating completed matches)
UPDATE public.matches SET winner_id = '11111111-1111-1111-1111-111111111111', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000001'; -- ProGamer2024 wins
UPDATE public.matches SET winner_id = '44444444-4444-4444-4444-444444444444', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000002'; -- CyberNinja wins
UPDATE public.matches SET winner_id = '55555555-5555-5555-5555-555555555555', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000003'; -- IronFist wins
UPDATE public.matches SET winner_id = '88888888-8888-8888-8888-888888888888', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000004'; -- StormBreaker wins
UPDATE public.matches SET winner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000005'; -- PhoenixRise wins
UPDATE public.matches SET winner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000006'; -- DragonSlayer wins
UPDATE public.matches SET winner_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000007'; -- MysticBlade wins
UPDATE public.matches SET winner_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff', completed_at = NOW() WHERE id = 'ragnar01-0000-0000-0000-000000000008'; -- TitanForce wins

-- Round 2: Quarter-finals (4 matches, 8 players -> 4 winners)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, status, created_at) VALUES
-- QF1: ProGamer2024 vs CyberNinja
('ragnar02-0000-0000-0000-000000000001', 'ragnar00-0000-0000-0000-000000000001', 2, 1, '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'ongoing', NOW()),
-- QF2: IronFist vs StormBreaker
('ragnar02-0000-0000-0000-000000000002', 'ragnar00-0000-0000-0000-000000000001', 2, 2, '55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888', 'pending', NOW()),
-- QF3: PhoenixRise vs DragonSlayer
('ragnar02-0000-0000-0000-000000000003', 'ragnar00-0000-0000-0000-000000000001', 2, 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pending', NOW()),
-- QF4: MysticBlade vs TitanForce
('ragnar02-0000-0000-0000-000000000004', 'ragnar00-0000-0000-0000-000000000001', 2, 4, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'pending', NOW());

-- Round 3: Semi-finals (2 matches, 4 players -> 2 winners)
INSERT INTO public.matches (id, tournament_id, round, match_number, status, created_at) VALUES
-- SF1: TBD vs TBD
('ragnar03-0000-0000-0000-000000000001', 'ragnar00-0000-0000-0000-000000000001', 3, 1, 'pending', NOW()),
-- SF2: TBD vs TBD
('ragnar03-0000-0000-0000-000000000002', 'ragnar00-0000-0000-0000-000000000001', 3, 2, 'pending', NOW());

-- Round 4: Final (1 match, 2 players -> 1 winner)
INSERT INTO public.matches (id, tournament_id, round, match_number, status, created_at) VALUES
-- Final: TBD vs TBD
('ragnar04-0000-0000-0000-000000000001', 'ragnar00-0000-0000-0000-000000000001', 4, 1, 'pending', NOW());
