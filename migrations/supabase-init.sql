-- Migration script to create all tables in Supabase
-- Generated from Prisma schema for Grow Easy platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums (removed as they already exist or will be created by Supabase)
-- CREATE TYPE agency_role AS ENUM ('AGENCY_ADMIN', 'AGENCY_MEMBER');
-- CREATE TYPE subaccount_role AS ENUM ('SUBACCOUNT_ADMIN', 'SUBACCOUNT_USER');
-- CREATE TYPE review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create users table (NextAuth compatible)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    password VARCHAR(255),
    phone VARCHAR(50),
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSONB,
    email_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table (NextAuth)
CREATE TABLE IF NOT EXISTS Account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

-- Create sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS Session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create verification tokens table (NextAuth)
CREATE TABLE IF NOT EXISTS VerificationToken (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(identifier, token)
);

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    logo TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agency settings table
CREATE TABLE IF NOT EXISTS agency_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID UNIQUE NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    theme JSONB,
    email_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user agency memberships table
CREATE TABLE IF NOT EXISTS user_agency_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role agency_role DEFAULT 'AGENCY_MEMBER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agency_id)
);

-- Create subaccounts table
-- Each subaccount represents a business and is associated with an agency.
CREATE TABLE IF NOT EXISTS subaccounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    logo TEXT,
    website TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, slug)
);

-- Create subaccount settings table
CREATE TABLE IF NOT EXISTS subaccount_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subaccount_id UUID UNIQUE NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    google_review_link TEXT,
    review_threshold INTEGER DEFAULT 4,
    thank_you_message TEXT,
    theme JSONB,
    email_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subaccount users table
-- Links users to specific subaccounts with defined roles (admin or standard user)
CREATE TABLE IF NOT EXISTS subaccount_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    role subaccount_role DEFAULT 'SUBACCOUNT_USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subaccount_id)
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    subject VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    status review_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_subaccounts_agency_id ON subaccounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_subaccounts_slug ON subaccounts(agency_id, slug);
CREATE INDEX IF NOT EXISTS idx_reviews_subaccount_id ON reviews(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_agency_memberships_user_id ON user_agency_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agency_memberships_agency_id ON user_agency_memberships(agency_id);
CREATE INDEX IF NOT EXISTS idx_subaccount_users_user_id ON subaccount_users(user_id);
CREATE INDEX IF NOT EXISTS idx_subaccount_users_subaccount_id ON subaccount_users(subaccount_id);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_settings_updated_at BEFORE UPDATE ON agency_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_agency_memberships_updated_at BEFORE UPDATE ON user_agency_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subaccounts_updated_at BEFORE UPDATE ON subaccounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subaccount_settings_updated_at BEFORE UPDATE ON subaccount_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subaccount_users_updated_at BEFORE UPDATE ON subaccount_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for testing
-- Default Agency: All new subaccounts will be associated with this agency if not explicitly specified.
INSERT INTO agencies (id, name, slug, status, logo, website) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Agency', 'demo-agency', 'active', 'https://images.pexels.com/photos/3184454/pexels-photo-3184454.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1', 'https://demo-agency.com')
ON CONFLICT (slug) DO NOTHING;

-- Default Agency Admin User
-- Password for 'admin@groweasy.com' is 'adminpassword' (bcrypt hash)
INSERT INTO users (id, email, name, password, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@groweasy.com', 'Agency Admin', '$2b$10$N80zMq88yyYJhMi2YxsyY.fo/p9/Yvue1BlZCQIa3jxTY/oH0huZu', NOW())
ON CONFLICT (email) DO NOTHING;

-- Link default agency admin user to the default agency
INSERT INTO user_agency_memberships (user_id, agency_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'AGENCY_ADMIN')
ON CONFLICT (user_id, agency_id) DO NOTHING;

INSERT INTO subaccounts (agency_id, name, slug, status, logo, website, contact_email, contact_phone) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Bella Vista Restaurant', 'bella-vista-restaurant', 'active', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1', 'https://bellavista.com', 'info@bellavista.com', '+1-555-BELLA'),
('550e8400-e29b-41d4-a716-446655440000', 'Luxury Salon & Spa', 'luxury-salon-spa', 'active', 'https://images.pexels.com/photos/3993212/pexels-photo-3993212.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1', 'https://luxurysalonspa.com', 'info@luxurysalonspa.com', '+1-555-SPA')
ON CONFLICT (agency_id, slug) DO NOTHING;

-- Note: subaccount_settings will be inserted after subaccounts are created with proper UUIDs
-- This will be handled by the application or a separate seed script