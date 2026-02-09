import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  firebase_uid: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  is_banned: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  profile_id: string;
  credits: number;
  cash: number;
  total_earned: number;
}

export interface DailyStreak {
  id: string;
  profile_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export interface ProfileData {
  profile: Profile | null;
  wallet: Wallet | null;
  streak: DailyStreak | null;
  isAdmin: boolean;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData>({
    profile: null,
    wallet: null,
    streak: null,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncProfile = useCallback(async () => {
    if (!user) {
      setData({ profile: null, wallet: null, streak: null, isAdmin: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call sync-profile edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            firebaseUser: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync profile");
      }

      const profileData = result.profile;

      // Check if user is admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("role", "admin")
        .maybeSingle();

      setData({
        profile: profileData,
        wallet: profileData.wallets,
        streak: profileData.daily_streaks,
        isAdmin: !!adminRole,
      });
    } catch (err) {
      console.error("Error syncing profile:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshWallet = useCallback(async () => {
    if (!data.profile) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("profile_id", data.profile.id)
      .single();

    if (wallet) {
      setData((prev) => ({ ...prev, wallet: wallet as Wallet }));
    }
  }, [data.profile]);

  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  return {
    ...data,
    loading,
    error,
    refreshWallet,
    syncProfile,
  };
};
