import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralEntry {
  id: string;
  referred_id: string;
  bonus_credited: boolean;
  deposit_bonus_credited: boolean;
  total_commission: number;
  created_at: string;
  referred_profile: {
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingBonuses: number;
  tier: string;
  tierColor: string;
  tierIcon: string;
  nextTier: string | null;
  nextTierTarget: number;
  progress: number;
}

const TIERS = [
  { name: "Bronze", min: 0, color: "#cd7f32", icon: "🥉" },
  { name: "Silver", min: 5, color: "#c0c0c0", icon: "🥈" },
  { name: "Gold", min: 15, color: "#ffd700", icon: "🥇" },
  { name: "Platinum", min: 30, color: "#00d9ff", icon: "💎" },
  { name: "Diamond", min: 50, color: "#b9f2ff", icon: "👑" },
  { name: "Legend", min: 100, color: "#ff3d71", icon: "🔥" },
];

function getTierInfo(totalReferrals: number) {
  let current = TIERS[0];
  let next: typeof TIERS[0] | null = TIERS[1];

  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalReferrals >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] || null;
      break;
    }
  }

  const progress = next
    ? ((totalReferrals - current.min) / (next.min - current.min)) * 100
    : 100;

  return {
    tier: current.name,
    tierColor: current.color,
    tierIcon: current.icon,
    nextTier: next?.name || null,
    nextTierTarget: next?.min || current.min,
    progress: Math.min(progress, 100),
  };
}

export const useReferrals = (profileId: string | undefined) => {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch referrals with referred profile info
      const { data: referralData } = await supabase
        .from("referrals")
        .select("*, referred_id")
        .eq("referrer_id", profileId)
        .order("created_at", { ascending: false });

      const entries: ReferralEntry[] = [];

      if (referralData) {
        // Fetch profiles for each referred user
        const referredIds = referralData.map((r) => r.referred_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url, created_at")
          .in("id", referredIds.length > 0 ? referredIds : ["none"]);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        for (const r of referralData) {
          entries.push({
            id: r.id,
            referred_id: r.referred_id,
            bonus_credited: r.bonus_credited || false,
            deposit_bonus_credited: r.deposit_bonus_credited || false,
            total_commission: r.total_commission || 0,
            created_at: r.created_at,
            referred_profile: profileMap.get(r.referred_id) || null,
          });
        }
      }

      // Compute earnings from transactions
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("profile_id", profileId)
        .eq("type", "referral_bonus");

      const totalEarnings = txns?.reduce((s, t) => s + Number(t.amount), 0) || 0;
      const totalRefs = entries.length;
      const activeRefs = entries.filter((e) => e.bonus_credited).length;
      const pendingBonuses = entries.filter((e) => !e.bonus_credited).length;

      const tierInfo = getTierInfo(totalRefs);

      setReferrals(entries);
      setStats({
        totalReferrals: totalRefs,
        activeReferrals: activeRefs,
        totalEarnings,
        pendingBonuses,
        ...tierInfo,
      });
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, stats, loading, refresh: fetchReferrals };
};
