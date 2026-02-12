
-- Add room_id to tournaments (visible only to joined players)
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS room_id text DEFAULT NULL;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS room_password text DEFAULT NULL;
