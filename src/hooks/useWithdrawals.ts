import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Withdrawal {
  id: string;
  profile_id: string;
  amount: number;
  payment_method: "bkash" | "nagad" | "rocket" | "binance";
  account_number: string;
  status: "pending" | "processing" | "completed" | "rejected";
  admin_note: string | null;
  created_at: string;
}

export const useWithdrawals = (
  profileId: string | undefined,
  cashBalance: number = 0
) => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);

      setWithdrawals((data || []) as Withdrawal[]);
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const createWithdrawal = async (
    method: "bkash" | "nagad" | "rocket" | "binance",
    amount: number,
    accountNumber: string,
    minWithdrawal: number = 100
  ) => {
    if (!profileId) return;

    if (amount < minWithdrawal) {
      toast.error(`Minimum withdrawal is ৳${minWithdrawal}`);
      return;
    }

    if (amount > cashBalance) {
      toast.error("Insufficient cash balance");
      return;
    }

    try {
      setSubmitting(true);

      // Deduct from wallet first
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (!wallet || (wallet as { cash: number }).cash < amount) {
        toast.error("Insufficient balance");
        return;
      }

      await supabase
        .from("wallets")
        .update({ cash: (wallet as { cash: number }).cash - amount })
        .eq("profile_id", profileId);

      // Create withdrawal request
      const { error } = await supabase.from("withdrawals").insert({
        profile_id: profileId,
        amount,
        payment_method: method,
        account_number: accountNumber,
        status: "pending",
      });

      if (error) throw error;

      // Record transaction
      await supabase.from("transactions").insert({
        profile_id: profileId,
        type: "cash_withdraw",
        amount: -amount,
        description: `Withdrawal to ${method}: ${accountNumber}`,
      });

      toast.success("Withdrawal request submitted!", {
        description: "Processing time: 24-48 hours",
      });

      await fetchWithdrawals();
    } catch (err) {
      console.error("Error creating withdrawal:", err);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    withdrawals,
    loading,
    submitting,
    createWithdrawal,
    refreshWithdrawals: fetchWithdrawals,
  };
};
