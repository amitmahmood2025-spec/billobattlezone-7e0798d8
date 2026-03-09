import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { importX509, jwtVerify } from "https://esm.sh/jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIREBASE_PROJECT_ID = "billobattlehub";
let cachedCerts: Record<string, string> | null = null;
let certExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certExpiry) return cachedCerts;
  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  cachedCerts = await res.json();
  const maxAge = res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1];
  certExpiry = Date.now() + (maxAge ? parseInt(maxAge) * 1000 : 3600000);
  return cachedCerts!;
}

async function verifyFirebaseToken(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("No token");
  const token = authHeader.substring(7);
  const [headerB64] = token.split(".");
  const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")));
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error("Invalid key ID");
  const key = await importX509(cert, "RS256");
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  if (!payload.sub) throw new Error("No subject");
  return payload.sub;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const firebaseUid = await verifyFirebaseToken(req);
    const { action, data } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const { data: userRoles } = await supabase
      .from("user_roles").select("*").eq("user_id", profile.id).in("role", ["admin", "moderator"]);

    const isAdmin = (userRoles || []).some((r: any) => r.role === "admin");
    const isModerator = (userRoles || []).some((r: any) => r.role === "moderator");

    if (!isAdmin && !isModerator) {
      return new Response(JSON.stringify({ error: "Admin/Moderator access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check moderator permissions for non-admin users
    const checkModPermission = async (permission: string) => {
      if (isAdmin) return true;
      const { data: perm } = await supabase
        .from("role_permissions").select("id")
        .eq("user_id", profile.id).eq("permission", permission).maybeSingle();
      return !!perm;
    };

    // Actions that require admin-only
    const adminOnlyActions = ["add_admin", "remove_admin", "add_moderator", "remove_moderator", "toggle_permission", "ban_user"];
    if (!isAdmin && adminOnlyActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Permission mapping for moderator actions
    const actionPermissionMap: Record<string, string> = {
      approve_deposit: "manage_deposits", reject_deposit: "manage_deposits",
      approve_withdrawal: "manage_withdrawals", reject_withdrawal: "manage_withdrawals",
      create_tournament: "manage_tournaments", update_tournament: "manage_tournaments", delete_tournament: "manage_tournaments",
      get_tournament_entries: "manage_tournaments", update_placement: "manage_tournaments",
      create_task: "manage_tasks", update_task: "manage_tasks", delete_task: "manage_tasks",
      update_payment_settings: "manage_settings",
    };

    if (!isAdmin && actionPermissionMap[action]) {
      const hasPermission = await checkModPermission(actionPermissionMap[action]);
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: `Permission denied: ${actionPermissionMap[action]}` }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    let result;

    switch (action) {
      // ========== ADMIN MANAGEMENT ==========
      case "add_admin": {
        const { emailOrUsername } = data;
        if (!emailOrUsername || typeof emailOrUsername !== "string") {
          return new Response(JSON.stringify({ error: "Email or username required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Sanitize input to prevent SQL injection via .or()
        const sanitizedAdmin = emailOrUsername.trim().slice(0, 255);
        if (!/^[a-zA-Z0-9@._\-+]+$/.test(sanitizedAdmin)) {
          return new Response(JSON.stringify({ error: "Invalid email/username format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Use separate queries instead of .or() to prevent injection
        let targetProfile;
        const { data: byEmail } = await supabase
          .from("profiles").select("id").eq("email", sanitizedAdmin).maybeSingle();
        if (byEmail) {
          targetProfile = byEmail;
        } else {
          const { data: byUsername } = await supabase
            .from("profiles").select("id").eq("username", sanitizedAdmin).maybeSingle();
          targetProfile = byUsername;
        }

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

      // ========== MODERATOR MANAGEMENT ==========
      case "add_moderator": {
        const { emailOrUsername } = data;
        if (!emailOrUsername || typeof emailOrUsername !== "string") {
          return new Response(JSON.stringify({ error: "Email or username required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const sanitizedMod = emailOrUsername.trim().slice(0, 255);
        if (!/^[a-zA-Z0-9@._\-+]+$/.test(sanitizedMod)) {
          return new Response(JSON.stringify({ error: "Invalid email/username format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        let modProfile;
        const { data: modByEmail } = await supabase
          .from("profiles").select("id").eq("email", sanitizedMod).maybeSingle();
        if (modByEmail) {
          modProfile = modByEmail;
        } else {
          const { data: modByUsername } = await supabase
            .from("profiles").select("id").eq("username", sanitizedMod).maybeSingle();
          modProfile = modByUsername;
        }
        if (!modProfile) {
          return new Response(JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("user_roles").upsert(
          { user_id: modProfile.id, role: "moderator" },
          { onConflict: "user_id,role" }
        );
        result = { success: true, message: "Moderator added" };
        break;
      }

      case "remove_moderator": {
        const { targetUserId } = data;
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Remove role and all permissions
        await supabase.from("role_permissions").delete().eq("user_id", targetUserId);
        await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "moderator");
        result = { success: true, message: "Moderator removed" };
        break;
      }

      case "toggle_permission": {
        const { targetUserId, permission, enabled } = data;
        if (!targetUserId || !permission) {
          return new Response(JSON.stringify({ error: "Missing fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (enabled) {
          await supabase.from("role_permissions").upsert(
            { user_id: targetUserId, permission, granted_by: profile.id },
            { onConflict: "user_id,permission" }
          );
        } else {
          await supabase.from("role_permissions").delete()
            .eq("user_id", targetUserId).eq("permission", permission);
        }
        result = { success: true, message: `Permission ${enabled ? "granted" : "revoked"}` };
        break;
      }

      // ========== TASK MANAGEMENT ==========
      case "create_task": {
        const { title, description, reward_credits, task_type, reset_type, max_claims_per_period, cooldown_hours, icon, sort_order, task_url, verification_seconds } = data;
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
          task_url: task_url || null, verification_seconds: verification_seconds || 0,
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
        const allowedTaskFields = ["title", "description", "reward_credits", "task_type", "reset_type", "max_claims_per_period", "cooldown_hours", "icon", "sort_order", "is_active", "task_url", "verification_seconds"];
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
        const { title, game_type, mode, description, entry_fee, entry_fee_type, prize_pool, max_participants, starts_at, ends_at, rules, room_id, room_password, match_type, map, perspective, per_kill, tournament_no } = data;
        if (!title || !game_type || !starts_at) {
          return new Response(JSON.stringify({ error: "Title, game type and start time required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: newTournament, error: createErr } = await supabase.from("tournaments").insert({
          title, game_type, mode: mode || null, description: description || null,
          entry_fee: entry_fee || 0, entry_fee_type: entry_fee_type || "credits",
          prize_pool: prize_pool || 0, max_participants: max_participants || null,
          starts_at, ends_at: ends_at || null, rules: rules || null,
          room_id: room_id || null, room_password: room_password || null,
          live_url: data.live_url || null,
          match_type: match_type || null, map: map || null, perspective: perspective || null,
          per_kill: per_kill || 0, tournament_no: tournament_no || null,
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
        const allowedFields = ["title", "game_type", "mode", "description", "entry_fee", "entry_fee_type", "prize_pool", "max_participants", "starts_at", "ends_at", "rules", "status", "room_id", "room_password", "match_type", "map", "perspective", "per_kill", "tournament_no", "live_url"];
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
        result = { success: true, entries: (entries || []).map((e: any) => ({
          ...e,
          game_id: e.game_id || null,
          game_name: e.game_name || null,
          kills: e.kills || 0,
        })) };
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
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "No token" || msg === "Invalid key ID" || msg === "No subject" ? 401 : 500;
    if (status === 500) console.error("Error:", error);
    return new Response(JSON.stringify({ error: status === 401 ? "Unauthorized" : "Internal server error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
