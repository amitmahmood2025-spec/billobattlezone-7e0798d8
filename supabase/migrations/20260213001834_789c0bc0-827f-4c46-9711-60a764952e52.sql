
-- Add link verification fields to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_url text DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS verification_seconds integer DEFAULT 0;

-- Create task_steps table for multi-step special tasks
CREATE TABLE public.task_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  step_url text,
  verification_seconds integer DEFAULT 10,
  reward_credits integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task_steps" ON public.task_steps FOR SELECT USING (true);
CREATE POLICY "Service role manages task_steps" ON public.task_steps FOR ALL USING (true);

CREATE INDEX idx_task_steps_task_id ON public.task_steps(task_id);

-- Track which steps a user has completed
CREATE TABLE public.user_task_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  task_step_id uuid NOT NULL REFERENCES public.task_steps(id) ON DELETE CASCADE,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  credits_earned integer NOT NULL DEFAULT 0,
  UNIQUE(profile_id, task_step_id)
);

ALTER TABLE public.user_task_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user_task_steps" ON public.user_task_steps FOR SELECT USING (true);
CREATE POLICY "Service role manages user_task_steps" ON public.user_task_steps FOR ALL USING (true);
