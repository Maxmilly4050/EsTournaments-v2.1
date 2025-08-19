-- Complete Tournament Platform Database Setup
-- Run this script in your Supabase SQL Editor to create all tables and sample data

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 16,
  current_participants INTEGER DEFAULT 0,
  prize_pool TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  image_url TEXT,
  organizer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Create matches table for bracket system
CREATE TABLE IF NOT EXISTS public.matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tournament organizers can update their tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() = organizer_id);

-- Create RLS policies for tournament participants
CREATE POLICY "Tournament participants are viewable by everyone" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join tournaments" ON public.tournament_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave tournaments they joined" ON public.tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for matches
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Tournament organizers can manage matches" ON public.matches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE tournaments.id = matches.tournament_id 
    AND tournaments.organizer_id = auth.uid()
  )
);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants - 1 
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for participant count
DROP TRIGGER IF EXISTS tournament_participant_count_trigger ON public.tournament_participants;
CREATE TRIGGER tournament_participant_count_trigger
  AFTER INSERT OR DELETE ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_tournament_participant_count();

-- Insert sample tournaments
INSERT INTO public.tournaments (title, game, description, max_participants, current_participants, prize_pool, start_date, end_date, status, image_url) VALUES
('Street Fighter 6 Championship', 'Street Fighter 6', 'Ultimate fighting tournament featuring the best SF6 players', 16, 8, '$5,000', NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days', 'upcoming', '/fighting-game-tournament.png'),
('Valorant Masters Cup', 'Valorant', 'Tactical FPS tournament with professional teams', 16, 12, '$10,000', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'ongoing', '/valorant-agents.png'),
('League of Legends Worlds', 'League of Legends', 'The biggest MOBA tournament of the year', 16, 16, '$25,000', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 'completed', '/summoners-rift-battle.png'),
('CS2 Major Tournament', 'Counter-Strike 2', 'Premier Counter-Strike competition', 16, 6, '$15,000', NOW() + INTERVAL '14 days', NOW() + INTERVAL '21 days', 'upcoming', '/counter-strike-2-scene.png'),
('Rocket League Championship', 'Rocket League', 'High-octane car soccer tournament', 8, 4, '$3,000', NOW() + INTERVAL '3 days', NOW() + INTERVAL '10 days', 'upcoming', '/stylized-car-soccer.png'),
('Tekken 8 King of Iron Fist', 'Tekken 8', 'Fighting game tournament for Tekken masters', 16, 10, '$7,500', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'ongoing', '/abstract-geometric-shapes.png');

-- Success message
SELECT 'Database setup completed successfully! All tables, functions, and sample data have been created.' as status;
