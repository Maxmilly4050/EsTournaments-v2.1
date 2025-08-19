-- Database functions for profile management
-- These functions handle complex operations like cooldown checks and edit logging

-- Function to check if user can change gamer tag (30-day cooldown)
CREATE OR REPLACE FUNCTION can_change_gamer_tag(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has never changed gamer tag or if 30 days have passed
    RETURN (
        SELECT CASE 
            WHEN last_gamer_tag_change IS NULL THEN true
            WHEN last_gamer_tag_change < NOW() - INTERVAL '30 days' THEN true
            ELSE false
        END
        FROM profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log profile edits
CREATE OR REPLACE FUNCTION log_profile_edit(
    p_user_id UUID,
    p_field_name TEXT,
    p_old_value TEXT,
    p_new_value TEXT,
    p_edited_by UUID DEFAULT NULL,
    p_edit_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO profile_edit_history (
        user_id, 
        field_name, 
        old_value, 
        new_value, 
        edited_by, 
        edit_reason
    ) VALUES (
        p_user_id, 
        p_field_name, 
        p_old_value, 
        p_new_value, 
        p_edited_by, 
        p_edit_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update gamer tag with cooldown check
CREATE OR REPLACE FUNCTION update_gamer_tag(
    p_user_id UUID,
    p_new_gamer_tag TEXT
)
RETURNS JSONB AS $$
DECLARE
    old_gamer_tag TEXT;
    can_change BOOLEAN;
BEGIN
    -- Check if user can change gamer tag
    SELECT can_change_gamer_tag(p_user_id) INTO can_change;
    
    IF NOT can_change THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You can only change your gamer tag once every 30 days'
        );
    END IF;
    
    -- Get current gamer tag
    SELECT gamer_tag INTO old_gamer_tag FROM profiles WHERE id = p_user_id;
    
    -- Update gamer tag and timestamp
    UPDATE profiles 
    SET gamer_tag = p_new_gamer_tag,
        last_gamer_tag_change = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the change
    PERFORM log_profile_edit(
        p_user_id,
        'gamer_tag',
        old_gamer_tag,
        p_new_gamer_tag
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Gamer tag updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user statistics for global ranking
CREATE OR REPLACE FUNCTION calculate_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tournaments_participated', COUNT(DISTINCT tp.tournament_id),
        'tournaments_won', COUNT(DISTINCT CASE WHEN t.organizer_id != p_user_id AND EXISTS(
            SELECT 1 FROM matches m 
            WHERE m.tournament_id = t.id 
            AND m.winner_id = p_user_id 
            AND m.round = (SELECT MAX(round) FROM matches WHERE tournament_id = t.id)
        ) THEN t.id END),
        'matches_won', COUNT(CASE WHEN m.winner_id = p_user_id THEN 1 END),
        'matches_played', COUNT(m.id),
        'win_rate', CASE 
            WHEN COUNT(m.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN m.winner_id = p_user_id THEN 1 END) * 100.0) / COUNT(m.id), 2)
            ELSE 0 
        END
    ) INTO stats
    FROM tournament_participants tp
    LEFT JOIN tournaments t ON tp.tournament_id = t.id
    LEFT JOIN matches m ON (m.player1_id = p_user_id OR m.player2_id = p_user_id) 
        AND m.tournament_id = tp.tournament_id
    WHERE tp.user_id = p_user_id;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
