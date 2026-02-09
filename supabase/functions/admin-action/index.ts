import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        
        // Get deposit
        const { data: deposit } = await supabase
          .from("deposits")
          .select("*, profiles(*)")
          .eq("id", depositId)
          .eq("status", "pending")
          .single();

        if (!deposit) {
          return new Response(
            JSON.stringify({ error: "Deposit not found or already processed" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("profile_id", deposit.profile_id)
          .single();

        if (!wallet) {
          return new Response(
            JSON.stringify({ error: "Wallet not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update wallet cash balance
        await supabase
          .from("wallets")
          .update({
            cash: (wallet.cash || 0) + deposit.amount,
          })
          .eq("id", wallet.id);

        // Update deposit status
        await supabase
          .from("deposits")
          .update({
            status: "approved",
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", depositId);

        // Record transaction
        await supabase.from("transactions").insert({
          profile_id: deposit.profile_id,
          type: "cash_deposit",
          amount: deposit.amount,
          balance_before: wallet.cash,
          balance_after: (wallet.cash || 0) + deposit.amount,
          description: `Deposit via ${deposit.payment_method}`,
          reference_id: depositId,
        });

        // Check for referral deposit bonus
        const { data: referral } = await supabase
          .from("referrals")
          .select("*, referrer:referrer_id(id)")
          .eq("referred_id", deposit.profile_id)
          .eq("deposit_bonus_credited", false)
          .single();

        if (referral) {
          // Award 100 credits to referrer for first deposit
          const { data: referrerWallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("profile_id", referral.referrer_id)
            .single();

          if (referrerWallet) {
            await supabase
              .from("wallets")
              .update({
                credits: (referrerWallet.credits || 0) + 100,
                total_earned: (referrerWallet.total_earned || 0) + 100,
              })
              .eq("id", referrerWallet.id);

            await supabase.from("transactions").insert({
              profile_id: referral.referrer_id,
              type: "referral_bonus",
              amount: 100,
              description: "Referral first deposit bonus",
            });
          }

          // 5% commission
          const commission = deposit.amount * 0.05;
          await supabase
            .from("referrals")
            .update({
              deposit_bonus_credited: true,
              total_commission: (referral.total_commission || 0) + commission,
            })
            .eq("id", referral.id);

          // Award commission as credits
          if (referrerWallet) {
            await supabase
              .from("wallets")
              .update({
                credits: (referrerWallet.credits || 0) + commission,
                total_earned: (referrerWallet.total_earned || 0) + commission,
              })
              .eq("id", referrerWallet.id);

            await supabase.from("transactions").insert({
              profile_id: referral.referrer_id,
              type: "referral_bonus",
              amount: commission,
              description: `5% referral commission`,
            });
          }
        }

        result = { success: true, message: "Deposit approved" };
        break;
      }

      case "reject_deposit": {
        const { depositId, note } = data;

        await supabase
          .from("deposits")
          .update({
            status: "rejected",
            admin_note: note,
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", depositId);

        result = { success: true, message: "Deposit rejected" };
        break;
      }

      case "approve_withdrawal": {
        const { withdrawalId } = data;

        const { data: withdrawal } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawalId)
          .eq("status", "pending")
          .single();

        if (!withdrawal) {
          return new Response(
            JSON.stringify({ error: "Withdrawal not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("withdrawals")
          .update({
            status: "completed",
            processed_by: profile.id,
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawalId);

        result = { success: true, message: "Withdrawal completed" };
        break;
      }

      case "reject_withdrawal": {
        const { withdrawalId, note } = data;

        const { data: withdrawal } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawalId)
          .single();

        if (!withdrawal) {
          return new Response(
            JSON.stringify({ error: "Withdrawal not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Refund cash to wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("profile_id", withdrawal.profile_id)
          .single();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              cash: (wallet.cash || 0) + withdrawal.amount,
            })
            .eq("id", wallet.id);
        }

        await supabase
          .from("withdrawals")
          .update({
            status: "rejected",
            admin_note: note,
            processed_by: profile.id,
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawalId);

        result = { success: true, message: "Withdrawal rejected, funds returned" };
        break;
      }

      case "update_payment_settings": {
        const { method, accountNumber, accountName, minDeposit, minWithdrawal } = data;

        await supabase
          .from("payment_settings")
          .update({
            account_number: accountNumber,
            account_name: accountName,
            min_deposit: minDeposit,
            min_withdrawal: minWithdrawal,
          })
          .eq("payment_method", method);

        result = { success: true, message: "Payment settings updated" };
        break;
      }

      case "make_admin": {
        const { targetProfileId } = data;

        await supabase.from("user_roles").upsert({
          user_id: targetProfileId,
          role: "admin",
        });

        result = { success: true, message: "User promoted to admin" };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
