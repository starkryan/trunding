-- Create withdrawal_details table
CREATE TABLE IF NOT EXISTS withdrawal_details (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_withdrawal_details_user_id ON withdrawal_details(user_id);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_withdrawal_details_email ON withdrawal_details(email);

-- Create index for faster lookups by upi_id
CREATE INDEX IF NOT EXISTS idx_withdrawal_details_upi_id ON withdrawal_details(upi_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_withdrawal_details_updated_at 
    BEFORE UPDATE ON withdrawal_details 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to ensure one active withdrawal detail per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_withdrawal_detail_per_user 
    ON withdrawal_details(user_id) 
    WHERE is_active = TRUE;
