-- Insert sample data for testing
-- Note: This assumes you have some test users in auth.users
-- You can modify the UUIDs to match your actual test users

-- Sample tournaments (using placeholder UUIDs - replace with actual user IDs)
INSERT INTO tournaments (
    title, description, game, organizer_id, max_participants, 
    entry_fee_amount, entry_fee_currency, prize_pool, status
) VALUES 
(
    'eFootball 2026 Championship', 
    'The ultimate eFootball tournament featuring the best players from around the world.',
    'efootball-2026',
    '00000000-0000-0000-0000-000000000001',
    32,
    5000,
    'TZS',
    '50,000 TZS',
    'upcoming'
),
(
    'FC Mobile Masters Cup',
    'Mobile football gaming at its finest with competitive leagues.',
    'fc-mobile',
    '00000000-0000-0000-0000-000000000002', 
    16,
    2500,
    'TZS',
    '25,000 TZS',
    'upcoming'
),
(
    'Free eFootball Tournament',
    'Open tournament for all skill levels - no entry fee required.',
    'efootball-2026',
    '00000000-0000-0000-0000-000000000001',
    64,
    0,
    'TZS',
    NULL,
    'upcoming'
);

-- Note: Replace the placeholder UUIDs above with actual user IDs from your auth.users table
-- You can get user IDs by running: SELECT id FROM auth.users LIMIT 5;
