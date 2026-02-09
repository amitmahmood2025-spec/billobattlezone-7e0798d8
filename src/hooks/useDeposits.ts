import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentSetting {
  id: string;
  payment_method: "bkash" | "nagad" | "rocket" | "binance";
  account_number: string;
  account_name: string | null;
  is_active: boolean;
  min_deposit: number;
  min_withdrawal: number;
}

export interface Deposit {
  id: string;
  profile_id: string;
  amount: number;
  payment_method: "bkash" | "nagad" | "rocket" | "binance";
  transaction_id: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

export const useDeposits = (profileId: string | undefined) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("is_active", true);

      setPaymentSettings((settings || []) as PaymentSetting[]);

      if (profileId) {
        const { data: depositsData } = await supabase
          .from("deposits")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(20);

        setDeposits((depositsData || []) as Deposit[]);
      }
    } catch (err) {
      console.error("Error fetching deposit data:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createDeposit = async (
    method: "bkash" | "nagad" | "rocket" | "binance",
    amount: number,
    transactionId: string
  ) => {
    if (!profileId) return;

    const setting = paymentSettings.find((s) => s.payment_method === method);
    if (setting && amount < setting.min_deposit) {
      toast.error(`Minimum deposit is ৳${setting.min_deposit}`);
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("deposits").insert({
        profile_id: profileId,
        amount,
        payment_method: method,
        transaction_id: transactionId,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Deposit request submitted!", {
        description: "Your request is pending admin approval.",
      });

      await fetchData();
    } catch (err) {
      console.error("Error creating deposit:", err);
      toast.error("Failed to submit deposit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getSettingByMethod = (method: string) => {
    return paymentSettings.find((s) => s.payment_method === method);
  };

  return {
    paymentSettings,
    deposits,
    loading,
    submitting,
    createDeposit,
    getSettingByMethod,
    refreshDeposits: fetchData,
  };
};
