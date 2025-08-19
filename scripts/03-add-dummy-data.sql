-- Insert dummy profiles (these will be created automatically when users sign up)
-- For now, we'll create some sample tournaments and matches

-- Insert sample tournaments
INSERT INTO public.tournaments (id, name, description, game, max_participants, current_participants, status, tournament_type, start_date, prize_pool, entry_fee, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Epic League of Legends Championship', 'Join the ultimate LoL tournament with the best players from around the world. Compete for glory and amazing prizes!', 'League of Legends', 16, 12, 'upcoming', 'single_elimination', '2025-08-20 18:00:00+00', '$1,000', 'Free', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Valorant Masters Cup', 'Tactical FPS tournament featuring the most skilled Valorant players. Show your aim and strategy!', 'Valorant', 32, 28, 'ongoing', 'double_elimination', '2025-08-15 20:00:00+00', '$2,500', '$10', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'CS2 Pro Circuit', 'Counter-Strike 2 professional tournament with intense matches and high-level gameplay.', 'Counter-Strike 2', 16, 16, 'ongoing', 'single_elimination', '2025-08-12 19:00:00+00', '$5,000', '$25', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Rocket League Boost Cup', 'Fast-paced car soccer action! Join the most exciting Rocket League tournament of the season.', 'Rocket League', 8, 6, 'upcoming', 'round_robin', '2025-08-25 16:00:00+00', '$500', 'Free', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Street Fighter 6 World Championship', 'The ultimate fighting game tournament. Prove you are the best fighter in the world!', 'Street Fighter 6', 64, 45, 'upcoming', 'double_elimination', '2025-09-01 14:00:00+00', '$10,000', '$50', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Tekken 8 Iron Fist Tournament', 'Classic fighting game action with the latest Tekken installment. May the best fighter win!', 'Tekken 8', 32, 24, 'upcoming', 'single_elimination', '2025-08-30 17:00:00+00', '$1,500', '$15', NOW());

-- Insert sample matches for the ongoing CS2 tournament (tournament 3)
INSERT INTO public.matches (id, tournament_id, round, match_number, status, created_at) VALUES
-- Round 1 (8 matches)
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 1, 1, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 1, 2, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 1, 3, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 1, 4, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 1, 5, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 1, 6, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 1, 7, 'completed', NOW()),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 1, 8, 'completed', NOW()),
-- Round 2 (4 matches)
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 2, 1, 'ongoing', NOW()),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 2, 2, 'pending', NOW()),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 2, 3, 'pending', NOW()),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 2, 4, 'pending', NOW()),
-- Round 3 (2 matches - Semi-finals)
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 3, 1, 'pending', NOW()),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 3, 2, 'pending', NOW()),
-- Round 4 (1 match - Final)
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 4, 1, 'pending', NOW());
