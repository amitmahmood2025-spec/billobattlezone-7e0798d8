-- =============================================
-- SECURITY FIX: Lock down all mutation policies
-- Service role (edge functions) bypasses RLS automatically
-- These deny anon key mutations on sensitive tables
-- =============================================

-- WALLETS
DROP POLICY IF EXISTS "Service role can manage wallets" ON public.wallets;
CREATE POLICY "Deny anon wallet insert" ON public.wallets FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon wallet update" ON public.wallets FOR UPDATE USING (false);
CREATE POLICY "Deny anon wallet delete" ON public.wallets FOR DELETE USING (false);

-- DAILY_STREAKS
DROP POLICY IF EXISTS "Service role can manage daily_streaks" ON public.daily_streaks;
CREATE POLICY "Deny anon streak insert" ON public.daily_streaks FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon streak update" ON public.daily_streaks FOR UPDATE USING (false);
CREATE POLICY "Deny anon streak delete" ON public.daily_streaks FOR DELETE USING (false);

-- REFERRALS
DROP POLICY IF EXISTS "Service role can manage referrals" ON public.referrals;
CREATE POLICY "Deny anon referral insert" ON public.referrals FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon referral update" ON public.referrals FOR UPDATE USING (false);
CREATE POLICY "Deny anon referral delete" ON public.referrals FOR DELETE USING (false);

-- TASKS
DROP POLICY IF EXISTS "Service role manages tasks" ON public.tasks;
CREATE POLICY "Deny anon task insert" ON public.tasks FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon task update" ON public.tasks FOR UPDATE USING (false);
CREATE POLICY "Deny anon task delete" ON public.tasks FOR DELETE USING (false);

-- USER_TASKS
DROP POLICY IF EXISTS "Service role can manage user_tasks" ON public.user_tasks;
CREATE POLICY "Deny anon user_task insert" ON public.user_tasks FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon user_task update" ON public.user_tasks FOR UPDATE USING (false);
CREATE POLICY "Deny anon user_task delete" ON public.user_tasks FOR DELETE USING (false);

-- USER_TASK_STEPS
DROP POLICY IF EXISTS "Service role manages user_task_steps" ON public.user_task_steps;
CREATE POLICY "Deny anon user_task_step insert" ON public.user_task_steps FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon user_task_step update" ON public.user_task_steps FOR UPDATE USING (false);
CREATE POLICY "Deny anon user_task_step delete" ON public.user_task_steps FOR DELETE USING (false);

-- TASK_STEPS
DROP POLICY IF EXISTS "Service role manages task_steps" ON public.task_steps;
CREATE POLICY "Deny anon task_step insert" ON public.task_steps FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon task_step update" ON public.task_steps FOR UPDATE USING (false);
CREATE POLICY "Deny anon task_step delete" ON public.task_steps FOR DELETE USING (false);

-- TOURNAMENT_ENTRIES
DROP POLICY IF EXISTS "Service role manages tournament_entries" ON public.tournament_entries;
CREATE POLICY "Deny anon entry insert" ON public.tournament_entries FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon entry update" ON public.tournament_entries FOR UPDATE USING (false);
CREATE POLICY "Deny anon entry delete" ON public.tournament_entries FOR DELETE USING (false);

-- TOURNAMENTS
DROP POLICY IF EXISTS "Service role manages tournaments" ON public.tournaments;
CREATE POLICY "Deny anon tournament insert" ON public.tournaments FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon tournament update" ON public.tournaments FOR UPDATE USING (false);
CREATE POLICY "Deny anon tournament delete" ON public.tournaments FOR DELETE USING (false);

-- PAYMENT_SETTINGS
DROP POLICY IF EXISTS "Service role manages payment_settings" ON public.payment_settings;
CREATE POLICY "Deny anon settings insert" ON public.payment_settings FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon settings update" ON public.payment_settings FOR UPDATE USING (false);
CREATE POLICY "Deny anon settings delete" ON public.payment_settings FOR DELETE USING (false);

-- ROLE_PERMISSIONS
DROP POLICY IF EXISTS "Service role manages role_permissions" ON public.role_permissions;
CREATE POLICY "Deny anon perm insert" ON public.role_permissions FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon perm update" ON public.role_permissions FOR UPDATE USING (false);
CREATE POLICY "Deny anon perm delete" ON public.role_permissions FOR DELETE USING (false);

-- DEPOSITS
DROP POLICY IF EXISTS "Anyone can create deposits" ON public.deposits;
CREATE POLICY "Deny anon deposit insert" ON public.deposits FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "Service role can update deposits" ON public.deposits;
CREATE POLICY "Deny anon deposit update" ON public.deposits FOR UPDATE USING (false);

-- WITHDRAWALS
DROP POLICY IF EXISTS "Anyone can create withdrawals" ON public.withdrawals;
CREATE POLICY "Deny anon withdrawal insert" ON public.withdrawals FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "Service role can update withdrawals" ON public.withdrawals;
CREATE POLICY "Deny anon withdrawal update" ON public.withdrawals FOR UPDATE USING (false);

-- SPIN_HISTORY
DROP POLICY IF EXISTS "Service role can insert spin_history" ON public.spin_history;
CREATE POLICY "Deny anon spin insert" ON public.spin_history FOR INSERT WITH CHECK (false);

-- TASK_CLAIMS
DROP POLICY IF EXISTS "Service role can insert task_claims" ON public.task_claims;
CREATE POLICY "Deny anon claim insert" ON public.task_claims FOR INSERT WITH CHECK (false);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;
CREATE POLICY "Deny anon transaction insert" ON public.transactions FOR INSERT WITH CHECK (false);

-- PROFILES
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
CREATE POLICY "Deny anon profile insert" ON public.profiles FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon profile update" ON public.profiles FOR UPDATE USING (false);