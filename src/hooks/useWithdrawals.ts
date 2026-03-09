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

      const { getAuthHeaders } = await import("@/lib/authHeaders");
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-withdrawal`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ paymentMethod: method, amount, accountNumber }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed");

      toast.success("Withdrawal request submitted!", {
        description: "Processing time: 24-48 hours",
      });

      await fetchWithdrawals();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit withdrawal request";
      toast.error(msg);
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
