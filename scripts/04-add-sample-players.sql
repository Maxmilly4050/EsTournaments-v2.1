-- Create sample user profiles (simulating registered users)
-- Note: In a real scenario, these would be created through the auth.users table
-- For demo purposes, we'll create profiles directly

INSERT INTO public.profiles (id, username, full_name, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'ProGamer2024', 'Alex Chen', NOW()),
('22222222-2222-2222-2222-222222222222', 'ShadowStrike', 'Maria Rodriguez', NOW()),
('33333333-3333-3333-3333-333333333333', 'ThunderBolt', 'James Wilson', NOW()),
('44444444-4444-4444-4444-444444444444', 'CyberNinja', 'Sarah Kim', NOW()),
('55555555-5555-5555-5555-555555555555', 'IronFist', 'Michael Brown', NOW()),
('66666666-6666-6666-6666-666666666666', 'QuantumLeap', 'Emily Davis', NOW()),
('77777777-7777-7777-7777-777777777777', 'BlazeFury', 'David Martinez', NOW()),
('88888888-8888-8888-8888-888888888888', 'StormBreaker', 'Lisa Anderson', NOW()),
('99999999-9999-9999-9999-999999999999', 'VoidWalker', 'Ryan Thompson', NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PhoenixRise', 'Jessica Lee', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DragonSlayer', 'Kevin Park', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'NightHawk', 'Amanda White', NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'StarCrusher', 'Chris Johnson', NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'MysticBlade', 'Nicole Garcia', NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'TitanForce', 'Brandon Miller', NOW()),
('10101010-1010-1010-1010-101010101010', 'EclipseWing', 'Samantha Taylor', NOW());

-- Update tournaments to have proper creators
UPDATE public.tournaments SET created_by = '11111111-1111-1111-1111-111111111111' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE public.tournaments SET created_by = '22222222-2222-2222-2222-222222222222' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE public.tournaments SET created_by = '33333333-3333-3333-3333-333333333333' WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE public.tournaments SET created_by = '44444444-4444-4444-4444-444444444444' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE public.tournaments SET created_by = '55555555-5555-5555-5555-555555555555' WHERE id = '550e8400-e29b-41d4-a716-446655440005';
UPDATE public.tournaments SET created_by = '66666666-6666-6666-6666-666666666666' WHERE id = '550e8400-e29b-41d4-a716-446655440006';
