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

    const { data: profile } = await supabase
      .from("profiles").select("id, is_banned").eq("firebase_uid", firebaseUid).single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (profile.is_banned) {
      return new Response(JSON.stringify({ error: "Account suspended" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: adminRole } = await supabase
      .from("user_roles").select("*").eq("user_id", profile.id).eq("role", "admin").single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result;

    switch (action) {
      // ========== ADMIN MANAGEMENT ==========
      case "add_admin": {
        const { emailOrUsername } = data;
        if (!emailOrUsername) {
          return new Response(JSON.stringify({ error: "Email or username required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: targetProfile } = await supabase
          .from("profiles").select("id")
          .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
          .single();

        if (!targetProfile) {
          return new Response(JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await supabase.from("user_roles").upsert(
          { user_id: targetProfile.id, role: "admin" },
          { onConflict: "user_id,role" }
        );
        result = { success: true, message: "Admin added" };
        break;
      }

      case "remove_admin": {
        const { targetUserId } = data;
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (targetUserId === profile.id) {
          return new Response(JSON.stringify({ error: "Cannot remove yourself" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "admin");
        result = { success: true, message: "Admin removed" };
        break;
      }

      // ========== TASK MANAGEMENT ==========
      case "create_task": {
        const { title, description, reward_credits, task_type, reset_type, max_claims_per_period, cooldown_hours, icon, sort_order } = data;
        if (!title) {
          return new Response(JSON.stringify({ error: "Title required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("tasks").insert({
          title, description: description || null,
          reward_credits: reward_credits || 10, task_type: task_type || "daily",
          reset_type: reset_type || "daily",
          max_claims_per_period: max_claims_per_period || 1,
          cooldown_hours: cooldown_hours || 24,
          icon: icon || "🎯", sort_order: sort_order || 0, is_active: true,
        });
        result = { success: true, message: "Task created" };
        break;
      }

      case "update_task": {
        const { taskId, updates } = data;
        if (!taskId || !updates) {
          return new Response(JSON.stringify({ error: "Task ID and updates required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const allowedTaskFields = ["title", "description", "reward_credits", "task_type", "reset_type", "max_claims_per_period", "cooldown_hours", "icon", "sort_order", "is_active"];
        const sanitizedTask: Record<string, unknown> = {};
        for (const key of allowedTaskFields) {
          if (key in updates) sanitizedTask[key] = updates[key];
        }
        await supabase.from("tasks").update(sanitizedTask).eq("id", taskId);
        result = { success: true, message: "Task updated" };
        break;
      }

      case "delete_task": {
        const { taskId } = data;
        if (!taskId) {
          return new Response(JSON.stringify({ error: "Task ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("user_tasks").delete().eq("task_id", taskId);
        await supabase.from("task_claims").delete().eq("task_id", taskId);
        await supabase.from("tasks").delete().eq("id", taskId);
        result = { success: true, message: "Task deleted" };
        break;
      }

      // ========== DEPOSIT/WITHDRAWAL ==========
      case "approve_deposit": {
        const { depositId } = data;
        if (!depositId || typeof depositId !== "string") {
          return new Response(JSON.stringify({ error: "Invalid deposit ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: deposit } = await supabase
          .from("deposits").select("*, profiles(*)").eq("id", depositId).eq("status", "pending").single();

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

      // ========== TOURNAMENT MANAGEMENT ==========
      case "create_tournament": {
        const { title, game_type, description, entry_fee, entry_fee_type, prize_pool, max_participants, starts_at, ends_at, rules, room_id, room_password } = data;
        if (!title || !game_type || !starts_at) {
          return new Response(JSON.stringify({ error: "Title, game type and start time required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: newTournament, error: createErr } = await supabase.from("tournaments").insert({
          title, game_type, description: description || null,
          entry_fee: entry_fee || 0, entry_fee_type: entry_fee_type || "credits",
          prize_pool: prize_pool || 0, max_participants: max_participants || null,
          starts_at, ends_at: ends_at || null, rules: rules || null,
          room_id: room_id || null, room_password: room_password || null,
          status: "upcoming",
        }).select().single();
        if (createErr) throw createErr;
        result = { success: true, message: "Tournament created", tournament: newTournament };
        break;
      }

      case "update_tournament": {
        const { tournamentId, updates } = data;
        if (!tournamentId || !updates) {
          return new Response(JSON.stringify({ error: "Tournament ID and updates required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const allowedFields = ["title", "game_type", "description", "entry_fee", "entry_fee_type", "prize_pool", "max_participants", "starts_at", "ends_at", "rules", "status", "room_id", "room_password"];
        const sanitized: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (key in updates) sanitized[key] = updates[key];
        }
        await supabase.from("tournaments").update(sanitized).eq("id", tournamentId);
        result = { success: true, message: "Tournament updated" };
        break;
      }

      case "delete_tournament": {
        const { tournamentId } = data;
        if (!tournamentId) {
          return new Response(JSON.stringify({ error: "Tournament ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("tournament_entries").delete().eq("tournament_id", tournamentId);
        await supabase.from("tournaments").delete().eq("id", tournamentId);
        result = { success: true, message: "Tournament deleted" };
        break;
      }

      case "get_tournament_entries": {
        const { tournamentId } = data;
        if (!tournamentId) {
          return new Response(JSON.stringify({ error: "Tournament ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: entries } = await supabase
          .from("tournament_entries")
          .select("*, profiles(username, email)")
          .eq("tournament_id", tournamentId)
          .order("joined_at", { ascending: true });
        result = { success: true, entries: entries || [] };
        break;
      }

      case "update_placement": {
        const { entryId, placement, prizeWon } = data;
        if (!entryId) {
          return new Response(JSON.stringify({ error: "Entry ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("tournament_entries").update({
          placement: placement || null, prize_won: prizeWon || 0,
        }).eq("id", entryId);

        if (prizeWon && prizeWon > 0) {
          const { data: entry } = await supabase.from("tournament_entries").select("*, tournaments(title)").eq("id", entryId).single();
          if (entry) {
            const { data: wallet } = await supabase.from("wallets").select("*").eq("profile_id", entry.profile_id).single();
            if (wallet) {
              await supabase.from("wallets").update({ cash: (wallet.cash || 0) + prizeWon }).eq("id", wallet.id);
              await supabase.from("transactions").insert({
                profile_id: entry.profile_id, type: "prize_won", amount: prizeWon,
                balance_before: wallet.cash, balance_after: (wallet.cash || 0) + prizeWon,
                description: `Tournament prize: ${entry.tournaments?.title || "Unknown"}`,
                reference_id: entry.tournament_id,
              });
            }
          }
        }
        result = { success: true, message: "Placement updated" };
        break;
      }

      // ========== TOURNAMENT ROOM INFO (for joined players) ==========
      case "get_room_info": {
        // This is a non-admin action, but we handle it here for simplicity
        // Actually we need a separate approach. Let's skip admin check for this.
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
