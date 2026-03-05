-- 1. Tables
CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    unique_slug TEXT UNIQUE NOT NULL,
    nama_kelompok TEXT NOT NULL,
    start_at TIMESTAMPTZ, -- New field for reservation start time
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quota INT NOT NULL CHECK (quota >= 0),
    count INT DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cohort_id, date)
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL CHECK (length(access_code) = 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE allowed_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS Policies (Simple public read/write for this demo, usually would have admin auth)
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on cohorts" ON cohorts FOR SELECT USING (true);
CREATE POLICY "Allow public read on slots" ON slots FOR SELECT USING (true);
CREATE POLICY "Allow public read on reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow public read on allowed_names" ON allowed_names FOR SELECT USING (true);

-- Admin policies (assuming simple service_role or authenticated, but for now public for the demo)
CREATE POLICY "Allow all on cohorts" ON cohorts FOR ALL USING (true);
CREATE POLICY "Allow all on slots" ON slots FOR ALL USING (true);
CREATE POLICY "Allow all on reservations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all on allowed_names" ON allowed_names FOR ALL USING (true);

-- 3. RPC for Atomic Booking
CREATE OR REPLACE FUNCTION book_reservation(
    p_slot_id UUID,
    p_user_name TEXT,
    p_access_code TEXT
) RETURNS VOID AS $$
DECLARE
    v_quota INT;
    v_count INT;
BEGIN
    -- Select and lock the slot for update
    SELECT quota, count INTO v_quota, v_count FROM slots WHERE id = p_slot_id FOR UPDATE;
    
    IF v_count >= v_quota THEN
        RAISE EXCEPTION 'This slot is already full.';
    END IF;

    -- Insert reservation
    INSERT INTO reservations (slot_id, user_name, access_code)
    VALUES (p_slot_id, p_user_name, p_access_code);

    -- Update slot count
    UPDATE slots SET count = count + 1 WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

-- 4. RPC for Changing Reservation (Atomic)
CREATE OR REPLACE FUNCTION change_reservation(
    p_access_code TEXT,
    p_new_slot_id UUID
) RETURNS VOID AS $$
DECLARE
    v_old_slot_id UUID;
    v_quota INT;
    v_count INT;
BEGIN
    -- Get old slot
    SELECT slot_id INTO v_old_slot_id FROM reservations WHERE access_code = p_access_code FOR UPDATE;
    
    -- Lock new slot
    SELECT quota, count INTO v_quota, v_count FROM slots WHERE id = p_new_slot_id FOR UPDATE;
    
    IF v_count >= v_quota THEN
        RAISE EXCEPTION 'The new slot is full.';
    END IF;

    -- Update slot counts
    UPDATE slots SET count = count - 1 WHERE id = v_old_slot_id;
    UPDATE slots SET count = count + 1 WHERE id = p_new_slot_id;
    
    -- Update reservation
    UPDATE reservations SET slot_id = p_new_slot_id WHERE access_code = p_access_code;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC for Decrementing Slot Count (used when admin deletes a reservation)
CREATE OR REPLACE FUNCTION decrement_slot_count(
    p_slot_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE slots SET count = GREATEST(0, count - 1) WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql;
