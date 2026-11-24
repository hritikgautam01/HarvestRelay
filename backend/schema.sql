-- ============================================================================
-- Surplus Food Redistribution Matcher for Local Eateries
-- PostgreSQL with PostGIS Schema (SDG 12: Responsible Consumption & Production)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table (Vendors, NGOs/Volunteers, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('VENDOR', 'RECIPIENT', 'ADMIN')),
    org_name VARCHAR(255),
    org_type VARCHAR(64),
    phone VARCHAR(64),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to keep PostGIS geometry updated
CREATE OR REPLACE FUNCTION update_user_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_geom ON users;
CREATE TRIGGER trg_user_geom
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_user_geom();

-- 2. Surplus Listings Table
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(64) PRIMARY KEY,
    vendor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL CHECK (category IN ('BAKERY', 'COOKED_MEALS', 'PRODUCE', 'DAIRY', 'PACKAGED')),
    quantity DOUBLE PRECISION NOT NULL,
    unit VARCHAR(32) NOT NULL,
    portion_estimate INTEGER NOT NULL,
    dietary_flags JSONB DEFAULT '[]'::jsonb,
    safe_temperature VARCHAR(32) DEFAULT 'ROOM' CHECK (safe_temperature IN ('ROOM', 'REFRIGERATED', 'HEATED')),
    packaging_type VARCHAR(64) DEFAULT 'SEALED_CONTAINERS',
    allergen_info TEXT,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'CLAIMED', 'COLLECTED', 'EXPIRED', 'CANCELLED')),
    handover_pin VARCHAR(10),
    notes TEXT,
    food_safety_acknowledged BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_listing_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listing_geom ON listings;
CREATE TRIGGER trg_listing_geom
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_listing_geom();

CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_deadline ON listings (pickup_deadline);

-- 3. Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(64) PRIMARY KEY,
    listing_id VARCHAR(64) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'PENDING_PICKUP' CHECK (status IN ('PENDING_PICKUP', 'COMPLETED', 'CANCELLED')),
    claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_time TIMESTAMP WITH TIME ZONE,
    recipient_notes TEXT,
    volunteer_name VARCHAR(255),
    volunteer_phone VARCHAR(64),
    declaration_accepted BOOLEAN DEFAULT TRUE,
    handover_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_listing ON claims (listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_recipient ON claims (recipient_id);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64),
    listing_id VARCHAR(64),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Real-Time Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

