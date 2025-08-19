-- Create notifications table for tournament management system
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_reminder', 'deadline_warning', 'result_notification', 'admin_decision', 'tournament_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tournament_id ON public.notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_match_id ON public.notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to insert notifications
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Allow service role to manage all notifications
CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');
