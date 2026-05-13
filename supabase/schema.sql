-- Supabase SQL Schema for Mall-Gourmet & Kids

-- 1. Malls Table
CREATE TABLE malls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL, -- e.g., 'Seoul', 'Gyeonggi'
    district TEXT,      -- e.g., 'Gangnam-gu', 'Hanam-si'
    address TEXT,
    image_url TEXT,
    source_url TEXT,    -- Added for auto-sync cron
    nursery_room_info TEXT, -- Added for parents' convenience (repurposed to district later, but keep in schema for now if desired)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_mall_name UNIQUE (name)
);

-- 2. Restaurants Table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id UUID REFERENCES malls(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,      -- e.g., 'Korean', 'Italian', 'Cafe'
    floor TEXT NOT NULL, -- e.g., 'B1', '1F', '5F'
    image_url TEXT,
    
    -- Parenthood Filters
    stroller_accessible BOOLEAN DEFAULT FALSE,
    highchair_available BOOLEAN DEFAULT FALSE,
    nursing_room_distance INTEGER, -- Distance in meters to the nearest nursing room
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Linked to Supabase Auth
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    content TEXT,
    kid_friendly_score INTEGER CHECK (kid_friendly_score >= 1 AND kid_friendly_score <= 5),
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Read Access Policies (Public)
CREATE POLICY "Public Read Malls" ON malls FOR SELECT USING (true);
CREATE POLICY "Public Read Restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);

-- Write Access Policies (Authenticated Users)
CREATE POLICY "Auth Users Write Reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Schema Updates (Migration)
ALTER TABLE restaurants ADD COLUMN status TEXT DEFAULT 'OPEN'; -- 'OPEN' or 'CLOSED'
ALTER TABLE restaurants ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for performance on sync
CREATE INDEX idx_restaurants_mall_name ON restaurants(mall_id, name);

-- Unique constraint for upsert
ALTER TABLE restaurants ADD CONSTRAINT unique_mall_restaurant UNIQUE (mall_id, name);
