
ALTER TABLE public.tournament_entries 
ADD COLUMN IF NOT EXISTS game_id text,
ADD COLUMN IF NOT EXISTS game_name text,
ADD COLUMN IF NOT EXISTS kills integer DEFAULT 0;
