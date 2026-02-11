import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firebaseUid, action, data } = await req.json();

    if (!firebaseUid || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate firebaseUid
    if (typeof firebaseUid !== "string" || firebaseUid.length > 128 || !/^[a-zA-Z0-9]+$/.test(firebaseUid)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role server-side
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_banned")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.is_banned) {
      return new Response(
        JSON.stringify({ error: "Account suspended" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", profile.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (action) {
      case "approve_deposit": {
        const { depositId } = data;
        if (!depositId || typeof depositId !== "string") {
          return new Response(JSON.stringify({ error: "Invalid deposit ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: deposit } = await supabase
          .from("deposits")
          .select("*, profiles(*)")
          .eq("id", depositId)
          .eq("status", "pending")
          .single();

        if (!deposit) {
          return new Response(JSON.stringify({ error: "Deposit not found or already processed" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: wallet } = await supabase
          .from("wallets").select("*").eq("profile_id", deposit.profile_id).single();

        if (!wallet) {
          return new Response(JSON.stringify({ error: "Wallet not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await supabase.from("wallets").update({
          cash: (wallet.cash || 0) + deposit.amount,
        }).eq("id", wallet.id);

        await supabase.from("deposits").update({
          status: "approved", reviewed_by: profile.id, reviewed_at: new Date().toISOString(),
        }).eq("id", depositId);

        await supabase.from("transactions").insert({
          profile_id: deposit.profile_id, type: "cash_deposit", amount: deposit.amount,
          balance_before: wallet.cash, balance_after: (wallet.cash || 0) + deposit.amount,
          description: `Deposit via ${deposit.payment_method}`, reference_id: depositId,
        });

        // Referral deposit bonus
        const { data: referral } = await supabase
          .from("referrals").select("*")
          .eq("referred_id", deposit.profile_id).eq("deposit_bonus_credited", false).maybeSingle();

        if (referral) {
          const { data: referrerWallet } = await supabase
            .from("wallets").select("*").eq("profile_id", referral.referrer_id).single();

          if (referrerWallet) {
            await supabase.from("wallets").update({
              credits: (referrerWallet.credits || 0) + 100,
              total_earned: (referrerWallet.total_earned || 0) + 100,
            }).eq("id", referrerWallet.id);

            await supabase.from("transactions").insert({
              profile_id: referral.referrer_id, type: "referral_bonus", amount: 100,
              description: "Referral first deposit bonus",
            });

            const commission = deposit.amount * 0.05;
            await supabase.from("referrals").update({
              deposit_bonus_credited: true,
              total_commission: (referral.total_commission || 0) + commission,
            }).eq("id", referral.id);
          }
        }

        result = { success: true, message: "Deposit approved" };
        break;
      }

      case "reject_deposit": {
        const { depositId, note } = data;
        await supabase.from("deposits").update({
          status: "rejected", admin_note: note || "Rejected",
          reviewed_by: profile.id, reviewed_at: new Date().toISOString(),
        }).eq("id", depositId);
        result = { success: true, message: "Deposit rejected" };
        break;
      }

      case "approve_withdrawal": {
        const { withdrawalId } = data;
        const { data: withdrawal } = await supabase
          .from("withdrawals").select("*").eq("id", withdrawalId).eq("status", "pending").single();

        if (!withdrawal) {
          return new Response(JSON.stringify({ error: "Withdrawal not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await supabase.from("withdrawals").update({
          status: "completed", processed_by: profile.id, processed_at: new Date().toISOString(),
        }).eq("id", withdrawalId);

        result = { success: true, message: "Withdrawal completed" };
        break;
      }

      case "reject_withdrawal": {
        const { withdrawalId, note } = data;
        const { data: withdrawal } = await supabase
          .from("withdrawals").select("*").eq("id", withdrawalId).single();

        if (!withdrawal) {
          return new Response(JSON.stringify({ error: "Withdrawal not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Refund cash
        const { data: wallet } = await supabase
          .from("wallets").select("*").eq("profile_id", withdrawal.profile_id).single();

        if (wallet) {
          await supabase.from("wallets").update({
            cash: (wallet.cash || 0) + withdrawal.amount,
          }).eq("id", wallet.id);
        }

        await supabase.from("withdrawals").update({
          status: "rejected", admin_note: note || "Rejected",
          processed_by: profile.id, processed_at: new Date().toISOString(),
        }).eq("id", withdrawalId);

        result = { success: true, message: "Withdrawal rejected, funds returned" };
        break;
      }

      case "update_payment_settings": {
        const { method, accountNumber, accountName, minDeposit, minWithdrawal } = data;
        if (!method || !accountNumber) {
          return new Response(JSON.stringify({ error: "Missing payment settings" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await supabase.from("payment_settings").update({
          account_number: accountNumber, account_name: accountName,
          min_deposit: minDeposit, min_withdrawal: minWithdrawal,
        }).eq("payment_method", method);

        result = { success: true, message: "Payment settings updated" };
        break;
      }

      case "ban_user": {
        const { targetProfileId, banned } = data;
        if (!targetProfileId) {
          return new Response(JSON.stringify({ error: "Missing target profile" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("profiles").update({ is_banned: banned ?? true }).eq("id", targetProfileId);
        result = { success: true, message: banned ? "User banned" : "User unbanned" };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
