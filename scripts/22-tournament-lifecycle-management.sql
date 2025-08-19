-- Tournament Lifecycle Management System
-- Automatically manages tournament status transitions and cleanup

-- Function to update tournament status based on current time
CREATE OR REPLACE FUNCTION update_tournament_status()
RETURNS void AS $$
BEGIN
  -- Update tournaments to 'ongoing' when start_date is reached
  UPDATE tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE status = 'upcoming' 
    AND start_date <= NOW();

  -- Update tournaments to 'finished' when end_date is reached
  UPDATE tournaments 
  SET status = 'finished', updated_at = NOW()
  WHERE status IN ('upcoming', 'ongoing') 
    AND end_date <= NOW();

  -- Log the updates
  RAISE NOTICE 'Tournament status updated at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old finished tournaments (remove after 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_tournaments()
RETURNS void AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Delete tournaments that have been finished for more than 24 hours
  WITH deleted_tournaments AS (
    DELETE FROM tournaments 
    WHERE status = 'finished' 
      AND updated_at <= NOW() - INTERVAL '24 hours'
    RETURNING id, title
  )
  SELECT COUNT(*) INTO cleanup_count FROM deleted_tournaments;

  -- Log the cleanup
  RAISE NOTICE 'Cleaned up % finished tournaments older than 24 hours at %', cleanup_count, NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to run complete tournament lifecycle management
CREATE OR REPLACE FUNCTION manage_tournament_lifecycle()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  updated_count INTEGER;
  cleaned_count INTEGER;
BEGIN
  -- Update tournament statuses
  PERFORM update_tournament_status();
  
  -- Get count of tournaments updated to finished
  SELECT COUNT(*) INTO updated_count
  FROM tournaments 
  WHERE status = 'finished' 
    AND updated_at >= NOW() - INTERVAL '1 minute';
  
  -- Clean up old tournaments
  PERFORM cleanup_old_tournaments();
  
  -- Get count of tournaments that would be cleaned (for reporting)
  SELECT COUNT(*) INTO cleaned_count
  FROM tournaments 
  WHERE status = 'finished' 
    AND updated_at <= NOW() - INTERVAL '24 hours';
  
  -- Return summary
  result := jsonb_build_object(
    'timestamp', NOW(),
    'tournaments_updated', updated_count,
    'tournaments_cleaned', cleaned_count,
    'status', 'success'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update tournament status on SELECT queries
-- This ensures status is always current when tournaments are viewed
CREATE OR REPLACE FUNCTION auto_update_tournament_status_trigger()
RETURNS trigger AS $$
BEGIN
  -- Only run the update if it's been more than 5 minutes since last update
  IF NOT EXISTS (
    SELECT 1 FROM tournaments 
    WHERE updated_at > NOW() - INTERVAL '5 minutes'
    LIMIT 1
  ) THEN
    PERFORM update_tournament_status();
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_tournament_status() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_tournaments() TO authenticated;
GRANT EXECUTE ON FUNCTION manage_tournament_lifecycle() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_update_tournament_status_trigger() TO authenticated;
