-- Add telegram_id column to profiles for Telegram bot linking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE;

-- Create index for fast telegram lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;