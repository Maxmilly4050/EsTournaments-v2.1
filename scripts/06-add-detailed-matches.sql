-- Clear existing matches and add detailed match data for CS2 tournament
DELETE FROM public.matches WHERE tournament_id = '550e8400-e29b-41d4-a716-446655440003';

-- CS2 Pro Circuit - Complete bracket with players and results
-- Round 1 matches (8 matches, all completed)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, winner_id, status, completed_at, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 1, 1, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 1, 2, '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 1, 3, '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 1, 4, '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 1, 5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 1, 6, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 1, 7, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 1, 8, '10101010-1010-1010-1010-101010101010', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days');

-- Round 2 matches (4 matches, 2 completed, 2 ongoing)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, winner_id, status, completed_at, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 2, 1, '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 2, 2, '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 2, 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'ongoing', NULL, NOW() - INTERVAL '2 days'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 2, 4, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', NULL, 'pending', NULL, NOW() - INTERVAL '2 days');

-- Round 3 matches (2 matches - Semi-finals, both pending)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, winner_id, status, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 3, 1, '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', NULL, 'pending', NOW() - INTERVAL '2 days'),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 3, 2, NULL, NULL, NULL, 'pending', NOW() - INTERVAL '2 days');

-- Round 4 match (1 match - Final, pending)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, winner_id, status, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 4, 1, NULL, NULL, NULL, 'pending', NOW() - INTERVAL '2 days');

-- Add some matches for Valorant tournament (ongoing)
INSERT INTO public.matches (id, tournament_id, round, match_number, player1_id, player2_id, winner_id, status, completed_at, created_at) VALUES
-- Round 1 matches for Valorant (some completed)
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 1, 1, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 1, 2, '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 1, 3, '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 1, 4, '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', NULL, 'ongoing', NULL, NOW() - INTERVAL '4 days');
