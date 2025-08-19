-- Create automatic tournament deletion rule for 3 days after end date
-- Function to delete tournaments that ended more than 3 days ago
CREATE OR REPLACE FUNCTION cleanup_expired_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete tournament participants first (foreign key constraint)
  DELETE FROM tournament_participants 
  WHERE tournament_id IN (
    SELECT id FROM tournaments 
    WHERE end_date IS NOT NULL 
    AND end_date < NOW() - INTERVAL '3 days'
  );
  
  -- Delete matches for expired tournaments
  DELETE FROM matches 
  WHERE tournament_id IN (
    SELECT id FROM tournaments 
    WHERE end_date IS NOT NULL 
    AND end_date < NOW() - INTERVAL '3 days'
  );
  
  -- Delete the tournaments themselves
  DELETE FROM tournaments 
  WHERE end_date IS NOT NULL 
  AND end_date < NOW() - INTERVAL '3 days';
  
  -- Log the cleanup action
  RAISE NOTICE 'Tournament cleanup completed at %', NOW();
END;
$$;

-- Create a trigger function that runs daily to clean up tournaments
CREATE OR REPLACE FUNCTION schedule_tournament_cleanup()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be called by a scheduled job
  PERFORM cleanup_expired_tournaments();
  RETURN NULL;
END;
$$;

-- Enable the pg_cron extension if not already enabled
-- Note: This requires superuser privileges and may need to be run manually
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run daily at 2 AM UTC
-- Note: This requires pg_cron extension and superuser privileges
-- SELECT cron.schedule('tournament-cleanup', '0 2 * * *', 'SELECT cleanup_expired_tournaments();');

-- Alternative: Create a manual cleanup procedure that can be called via API
CREATE OR REPLACE FUNCTION manual_tournament_cleanup()
RETURNS TABLE(deleted_tournaments integer, deleted_participants integer, deleted_matches integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tournament_count integer := 0;
  participant_count integer := 0;
  match_count integer := 0;
BEGIN
  -- Count tournaments to be deleted
  SELECT COUNT(*) INTO tournament_count
  FROM tournaments 
  WHERE end_date IS NOT NULL 
  AND end_date < NOW() - INTERVAL '3 days';
  
  -- Count participants to be deleted
  SELECT COUNT(*) INTO participant_count
  FROM tournament_participants 
  WHERE tournament_id IN (
    SELECT id FROM tournaments 
    WHERE end_date IS NOT NULL 
    AND end_date < NOW() - INTERVAL '3 days'
  );
  
  -- Count matches to be deleted
  SELECT COUNT(*) INTO match_count
  FROM matches 
  WHERE tournament_id IN (
    SELECT id FROM tournaments 
    WHERE end_date IS NOT NULL 
    AND end_date < NOW() - INTERVAL '3 days'
  );
  
  -- Perform the cleanup
  PERFORM cleanup_expired_tournaments();
  
  -- Return the counts
  RETURN QUERY SELECT tournament_count, participant_count, match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_tournaments() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_tournament_cleanup() TO authenticated;

-- Create RLS policies for the cleanup functions
ALTER FUNCTION cleanup_expired_tournaments() OWNER TO postgres;
ALTER FUNCTION manual_tournament_cleanup() OWNER TO postgres;
