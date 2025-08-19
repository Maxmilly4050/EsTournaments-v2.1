-- Add payment system tables and TSH currency support
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL, -- Amount in TSH
    provider VARCHAR(50) NOT NULL, -- M-Pesa, Airtel Money, Mix by Yas
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
    transaction_id VARCHAR(255), -- From payment gateway
    phone_number VARCHAR(20) NOT NULL,
    gateway_response JSONB, -- Store full gateway response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can create their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Tournament organizers can view tournament payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = payments.tournament_id 
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- Add currency conversion rates table
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial TSH conversion rate (1 USD = 2500 TSH approximately)
INSERT INTO currency_rates (from_currency, to_currency, rate) 
VALUES ('USD', 'TZS', 2500.0000)
ON CONFLICT DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_player_id ON payments(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_tournament_id ON payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_currency_rates_currencies ON currency_rates(from_currency, to_currency);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
