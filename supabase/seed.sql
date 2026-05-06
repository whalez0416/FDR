-- Seed Data for Hyundai Pangyo (9F Gourmet Park)
-- First, get or create the Mall ID for Hyundai Pangyo
DO $$
DECLARE
    pangyo_id UUID;
BEGIN
    INSERT INTO malls (name, city, district, image_url)
    VALUES ('현대백화점 판교점', '경기', '성남시 분당구', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO pangyo_id;

    -- If the mall already existed and didn't return an ID, fetch it
    IF pangyo_id IS NULL THEN
        SELECT id INTO pangyo_id FROM malls WHERE name = '현대백화점 판교점';
    END IF;

    -- Insert 5 Restaurants for 9F
    INSERT INTO restaurants (mall_id, name, category, floor, stroller_accessible, highchair_available, nursing_room_distance, status)
    VALUES 
    (pangyo_id, 'h'_Kitchen', '양식', '9F', true, true, 30, 'OPEN'),
    (pangyo_id, '봉우리', '한식', '9F', true, true, 45, 'OPEN'),
    (pangyo_id, '게이트나인', '태국음식', '9F', true, true, 50, 'OPEN'),
    (pangyo_id, 'JS가든', '중식', '9F', false, true, 60, 'OPEN'),
    (pangyo_id, '효세이로무시', '일식', '9F', true, true, 40, 'OPEN');

END $$;
