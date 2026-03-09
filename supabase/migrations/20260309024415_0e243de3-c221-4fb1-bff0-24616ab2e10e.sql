-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.create_wallet_for_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.wallets (profile_id) VALUES (NEW.id);
  INSERT INTO public.daily_streaks (profile_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;