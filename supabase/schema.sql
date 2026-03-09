-- 1. Tables
CREATE TABLE public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    unique_slug TEXT UNIQUE NOT NULL,
    nama_kelompok TEXT, -- Nullable in DB
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE, -- Nullable in DB
    date DATE NOT NULL,
    quota INT NOT NULL CHECK (quota >= 0),
    count INT DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cohort_id, date)
);

CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES public.slots(id) ON DELETE CASCADE, -- Nullable in DB
    user_name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL CHECK (length(access_code) = 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.allowed_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE, -- Nullable in DB
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on cohorts" ON public.cohorts FOR SELECT USING (true);
CREATE POLICY "Allow public read on slots" ON public.slots FOR SELECT USING (true);
CREATE POLICY "Allow public read on reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Allow public read on allowed_names" ON public.allowed_names FOR SELECT USING (true);

CREATE POLICY "Allow all on cohorts" ON public.cohorts FOR ALL USING (true);
CREATE POLICY "Allow all on slots" ON public.slots FOR ALL USING (true);
CREATE POLICY "Allow all on reservations" ON public.reservations FOR ALL USING (true);
CREATE POLICY "Allow all on allowed_names" ON public.allowed_names FOR ALL USING (true);

-- 3. RPC for Atomic Booking
CREATE OR REPLACE FUNCTION public.book_reservation(
    p_slot_id UUID,
    p_user_name TEXT,
    p_access_code TEXT
) RETURNS VOID AS $$
DECLARE
    v_quota INT;
    v_count INT;
BEGIN
    -- Select and lock the slot for update
    SELECT quota, count INTO v_quota, v_count FROM public.slots WHERE id = p_slot_id FOR UPDATE;
    
    IF v_count >= v_quota THEN
        RAISE EXCEPTION 'This slot is already full.';
    END IF;

    -- Insert reservation
    INSERT INTO public.reservations (slot_id, user_name, access_code)
    VALUES (p_slot_id, p_user_name, p_access_code);

    -- Update slot count
    UPDATE public.slots SET count = count + 1 WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

-- 4. RPC for Changing Reservation (Atomic)
CREATE OR REPLACE FUNCTION public.change_reservation(
    p_access_code TEXT,
    p_new_slot_id UUID
) RETURNS VOID AS $$
DECLARE
    v_old_slot_id UUID;
    v_quota INT;
    v_count INT;
BEGIN
    -- Get old slot
    SELECT slot_id INTO v_old_slot_id FROM public.reservations WHERE access_code = p_access_code FOR UPDATE;
    
    -- Lock new slot
    SELECT quota, count INTO v_quota, v_count FROM public.slots WHERE id = p_new_slot_id FOR UPDATE;
    
    IF v_count >= v_quota THEN
        RAISE EXCEPTION 'The new slot is full.';
    END IF;

    -- Update slot counts
    UPDATE public.slots SET count = count - 1 WHERE id = v_old_slot_id;
    UPDATE public.slots SET count = count + 1 WHERE id = p_new_slot_id;
    
    -- Update reservation
    UPDATE public.reservations SET slot_id = p_new_slot_id WHERE access_code = p_access_code;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC for Decrementing Slot Count
CREATE OR REPLACE FUNCTION public.decrement_slot_count(
    p_slot_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.slots SET count = GREATEST(0, count - 1) WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Utility Functions (found in DB)
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_code_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.tracking_code IS NULL OR NEW.tracking_code = '' THEN
    NEW.tracking_code := generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$function$;
