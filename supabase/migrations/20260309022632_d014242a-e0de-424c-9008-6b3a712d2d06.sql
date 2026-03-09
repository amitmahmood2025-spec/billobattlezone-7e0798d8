
-- Create role_permissions table for granular permission management
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone can view permissions
CREATE POLICY "Anyone can view role_permissions" ON public.role_permissions
FOR SELECT USING (true);

-- Service role manages permissions
CREATE POLICY "Service role manages role_permissions" ON public.role_permissions
FOR ALL USING (true);
