-- Row Level Security policies for profile management tables
-- Ensures users can only access their own data unless they're admins

-- Enable RLS on new tables
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Email verifications policies
CREATE POLICY "Users can view their own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email verifications" ON email_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email verifications" ON email_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Phone verifications policies
CREATE POLICY "Users can view their own phone verifications" ON phone_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone verifications" ON phone_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone verifications" ON phone_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Profile edit history policies (read-only for users)
CREATE POLICY "Users can view their own edit history" ON profile_edit_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert edit history" ON profile_edit_history
    FOR INSERT WITH CHECK (true); -- Allow system to log all edits

-- Payment history policies (read-only for users)
CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage payment history" ON payment_history
    FOR ALL WITH CHECK (true); -- Allow system to manage payments

-- Admin policies (users with can_host_tournaments = true are considered admins)
CREATE POLICY "Admins can view all email verifications" ON email_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND can_host_tournaments = true
        )
    );

CREATE POLICY "Admins can view all phone verifications" ON phone_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND can_host_tournaments = true
        )
    );

CREATE POLICY "Admins can view all edit history" ON profile_edit_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND can_host_tournaments = true
        )
    );

CREATE POLICY "Admins can view all payment history" ON payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND can_host_tournaments = true
        )
    );
