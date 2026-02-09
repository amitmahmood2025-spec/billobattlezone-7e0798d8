
-- =============================================
-- BILLO BATTLE ZONE - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Profiles table (linked to Firebase UID)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Wallets table (dual balance: credits + cash)
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (credits >= 0),
  cash DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cash >= 0),
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 6. Tasks definition table
CREATE TYPE public.task_type AS ENUM ('daily', 'achievement', 'special');
CREATE TYPE public.reset_type AS ENUM ('daily', 'weekly', 'never');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_credits INTEGER NOT NULL DEFAULT 0,
  task_type task_type NOT NULL DEFAULT 'daily',
  reset_type reset_type NOT NULL DEFAULT 'daily',
  max_claims_per_period INTEGER DEFAULT 1,
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 7. User tasks (progress tracking)
CREATE TABLE public.user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  last_claimed_at TIMESTAMPTZ,
  claims_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, task_id)
);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- 8. Task claims audit log
CREATE TABLE public.task_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  credits_earned INTEGER NOT NULL,
  ip_address INET,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_claims ENABLE ROW LEVEL SECURITY;

-- 9. Transactions ledger
CREATE TYPE public.transaction_type AS ENUM (
  'credit_earn', 'cash_deposit', 'cash_withdraw', 
  'match_entry_credit', 'match_entry_cash', 'prize_won',
  'referral_bonus', 'spin_win', 'quiz_win'
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 10. Daily streaks
CREATE TABLE public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- 11. Referrals tracking
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_credited BOOLEAN DEFAULT false,
  deposit_bonus_credited BOOLEAN DEFAULT false,
  total_commission DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 12. Spin history
CREATE TABLE public.spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_won INTEGER NOT NULL,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;

-- 13. Deposits
CREATE TYPE public.payment_method AS ENUM ('bkash', 'nagad', 'rocket', 'binance');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL,
  transaction_id TEXT NOT NULL,
  status deposit_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- 14. Withdrawals
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL,
  account_number TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 15. Tournaments
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');
CREATE TYPE public.entry_fee_type AS ENUM ('credits', 'cash', 'both');

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  game_type TEXT NOT NULL,
  description TEXT,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  entry_fee_type entry_fee_type NOT NULL DEFAULT 'credits',
  prize_pool DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status tournament_status NOT NULL DEFAULT 'upcoming',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- 16. Tournament entries
CREATE TABLE public.tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fee_paid DECIMAL(12,2) NOT NULL,
  fee_type entry_fee_type NOT NULL,
  placement INTEGER,
  prize_won DECIMAL(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, profile_id)
);

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

-- 17. Payment settings (admin configurable)
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method payment_method UNIQUE NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  min_deposit DECIMAL(12,2) DEFAULT 50,
  min_withdrawal DECIMAL(12,2) DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- User roles: Only admins can manage, users can read their own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(user_id, 'admin'));

-- Profiles: Users can read all, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update profiles" ON public.profiles
  FOR UPDATE USING (true);

-- Wallets: Users can view own, service role manages
CREATE POLICY "Anyone can view wallets" ON public.wallets
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage wallets" ON public.wallets
  FOR ALL USING (true);

-- Tasks: Everyone can view active tasks
CREATE POLICY "Anyone can view tasks" ON public.tasks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages tasks" ON public.tasks
  FOR ALL USING (true);

-- User tasks: Users can view/manage own
CREATE POLICY "Anyone can view user_tasks" ON public.user_tasks
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage user_tasks" ON public.user_tasks
  FOR ALL USING (true);

-- Task claims: Users can view own
CREATE POLICY "Anyone can view task_claims" ON public.task_claims
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert task_claims" ON public.task_claims
  FOR INSERT WITH CHECK (true);

-- Transactions: Users can view own
CREATE POLICY "Anyone can view transactions" ON public.transactions
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Daily streaks: Users can view/manage own
CREATE POLICY "Anyone can view daily_streaks" ON public.daily_streaks
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage daily_streaks" ON public.daily_streaks
  FOR ALL USING (true);

-- Referrals: Users can view own
CREATE POLICY "Anyone can view referrals" ON public.referrals
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL USING (true);

-- Spin history: Users can view own
CREATE POLICY "Anyone can view spin_history" ON public.spin_history
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert spin_history" ON public.spin_history
  FOR INSERT WITH CHECK (true);

-- Deposits: Users can view own, create own
CREATE POLICY "Anyone can view deposits" ON public.deposits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create deposits" ON public.deposits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update deposits" ON public.deposits
  FOR UPDATE USING (true);

-- Withdrawals: Users can view own, create own
CREATE POLICY "Anyone can view withdrawals" ON public.withdrawals
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update withdrawals" ON public.withdrawals
  FOR UPDATE USING (true);

-- Tournaments: Everyone can view
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Service role manages tournaments" ON public.tournaments
  FOR ALL USING (true);

-- Tournament entries: Users can view, service role manages
CREATE POLICY "Anyone can view tournament_entries" ON public.tournament_entries
  FOR SELECT USING (true);

CREATE POLICY "Service role manages tournament_entries" ON public.tournament_entries
  FOR ALL USING (true);

-- Payment settings: Everyone can view active
CREATE POLICY "Anyone can view payment_settings" ON public.payment_settings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages payment_settings" ON public.payment_settings
  FOR ALL USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_daily_streaks_updated_at BEFORE UPDATE ON public.daily_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_profile_referral_code BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Auto-create wallet when profile is created
CREATE OR REPLACE FUNCTION public.create_wallet_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (profile_id) VALUES (NEW.id);
  INSERT INTO public.daily_streaks (profile_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_wallet_on_profile AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_profile();

-- =============================================
-- SEED DEFAULT TASKS
-- =============================================

INSERT INTO public.tasks (title, description, reward_credits, task_type, reset_type, icon, sort_order) VALUES
  ('Daily Login', 'Log in daily to earn bonus credits', 5, 'daily', 'daily', '🎁', 1),
  ('Share on Social', 'Share the platform on social media', 10, 'daily', 'daily', '📱', 2),
  ('Spin the Wheel', 'Try your luck with the daily spin', 0, 'daily', 'daily', '🎡', 3),
  ('Gaming Quiz', 'Answer gaming trivia correctly', 20, 'daily', 'daily', '🧠', 4),
  ('Watch Ad', 'Watch a short advertisement', 15, 'daily', 'daily', '📺', 5),
  ('Complete Profile', 'Fill in all your profile details', 50, 'achievement', 'never', '✨', 10),
  ('First Tournament', 'Join your first tournament', 25, 'achievement', 'never', '🏆', 11),
  ('7-Day Streak', 'Log in for 7 consecutive days', 100, 'achievement', 'never', '🔥', 12);

-- Seed default payment settings
INSERT INTO public.payment_settings (payment_method, account_number, account_name, min_deposit, min_withdrawal) VALUES
  ('bkash', '01XXXXXXXXX', 'Billo BBZ', 50, 100),
  ('nagad', '01XXXXXXXXX', 'Billo BBZ', 50, 100),
  ('rocket', '01XXXXXXXXX', 'Billo BBZ', 50, 100),
  ('binance', 'TRC20_WALLET_ADDRESS', 'Billo BBZ USDT', 10, 20);
