-- Setup Supabase Storage buckets for file uploads
-- Create storage bucket for tournament images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tournament-images', 'tournament-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for group avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tournament images
CREATE POLICY "Tournament images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'tournament-images');

CREATE POLICY "Authenticated users can upload tournament images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'tournament-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tournament images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'tournament-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for group avatars
CREATE POLICY "Group avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Group members can upload group avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'group-avatars' AND auth.role() = 'authenticated');
