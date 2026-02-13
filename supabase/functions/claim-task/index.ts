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
    const body = await req.json();
    const { firebaseUid, taskId, taskStepId, isStepClaim } = body;

    if (!firebaseUid || (!taskId && !taskStepId)) {
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

    // Check daily credit cap (200 credits max)
    const today = new Date().toISOString().split("T")[0];
    const { data: todayClaims } = await supabase
      .from("task_claims").select("credits_earned")
      .eq("profile_id", profile.id).gte("claimed_at", `${today}T00:00:00Z`);

    const totalEarnedToday = (todayClaims || []).reduce((sum, c) => sum + (c.credits_earned || 0), 0);

    if (totalEarnedToday >= 200) {
      return new Response(JSON.stringify({ error: "Daily credit limit reached (200 credits)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit: 10 claims per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClaims } = await supabase
      .from("task_claims").select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id).gte("claimed_at", oneHourAgo);

    if ((recentClaims || 0) >= 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== STEP CLAIM ==========
    if (isStepClaim && taskStepId) {
      if (typeof taskStepId !== "string" || !/^[0-9a-f-]{36}$/.test(taskStepId)) {
        return new Response(JSON.stringify({ error: "Invalid step ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: step } = await supabase
        .from("task_steps").select("*").eq("id", taskStepId).single();

      if (!step) {
        return new Response(JSON.stringify({ error: "Step not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check if already completed
      const { data: existing } = await supabase
        .from("user_task_steps").select("id")
        .eq("profile_id", profile.id).eq("task_step_id", taskStepId).maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Step already claimed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const creditsToAward = Math.min(step.reward_credits, 200 - totalEarnedToday);

      // Get wallet
      const { data: wallet } = await supabase
        .from("wallets").select("*").eq("profile_id", profile.id).single();

      if (!wallet) {
        return new Response(JSON.stringify({ error: "Wallet not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("wallets").update({
        credits: (wallet.credits || 0) + creditsToAward,
        total_earned: (wallet.total_earned || 0) + creditsToAward,
      }).eq("id", wallet.id);

      await supabase.from("user_task_steps").insert({
        profile_id: profile.id, task_step_id: taskStepId, credits_earned: creditsToAward,
      });

      const clientIp = req.headers.get("x-forwarded-for") || "unknown";
      await supabase.from("task_claims").insert({
        profile_id: profile.id, task_id: step.task_id, credits_earned: creditsToAward, ip_address: clientIp,
      });

      await supabase.from("transactions").insert({
        profile_id: profile.id, type: "credit_earn", amount: creditsToAward,
        balance_before: wallet.credits, balance_after: (wallet.credits || 0) + creditsToAward,
        description: `Step: ${step.title}`, reference_id: step.task_id,
      });

      return new Response(
        JSON.stringify({ success: true, creditsEarned: creditsToAward, newBalance: (wallet.credits || 0) + creditsToAward }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== REGULAR TASK CLAIM ==========
    if (!taskId || typeof taskId !== "string" || !/^[0-9a-f-]{36}$/.test(taskId)) {
      return new Response(JSON.stringify({ error: "Invalid task ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: task } = await supabase
      .from("tasks").select("*").eq("id", taskId).eq("is_active", true).single();

    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let { data: userTask } = await supabase
      .from("user_tasks").select("*").eq("profile_id", profile.id).eq("task_id", taskId).single();

    if (!userTask) {
      const { data: newUserTask } = await supabase
        .from("user_tasks").insert({ profile_id: profile.id, task_id: taskId, progress: 0, is_completed: false, is_claimed: false })
        .select().single();
      userTask = newUserTask;
    }

    if (userTask?.is_claimed && task.reset_type === "never") {
      return new Response(JSON.stringify({ error: "Task already claimed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (userTask?.last_claimed_at && task.reset_type === "daily") {
      const lastClaimed = new Date(userTask.last_claimed_at).toISOString().split("T")[0];
      if (lastClaimed === today) {
        return new Response(JSON.stringify({ error: "Task already claimed today" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { data: wallet } = await supabase
      .from("wallets").select("*").eq("profile_id", profile.id).single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const creditsToAward = Math.min(task.reward_credits, 200 - totalEarnedToday);

    await supabase.from("wallets").update({
      credits: (wallet.credits || 0) + creditsToAward,
      total_earned: (wallet.total_earned || 0) + creditsToAward,
    }).eq("id", wallet.id);

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("task_claims").insert({
      profile_id: profile.id, task_id: taskId, credits_earned: creditsToAward, ip_address: clientIp,
    });

    await supabase.from("user_tasks").update({
      is_completed: true, is_claimed: true, last_claimed_at: new Date().toISOString(),
    }).eq("id", userTask!.id);

    await supabase.from("transactions").insert({
      profile_id: profile.id, type: "credit_earn", amount: creditsToAward,
      balance_before: wallet.credits, balance_after: (wallet.credits || 0) + creditsToAward,
      description: `Task: ${task.title}`, reference_id: taskId,
    });

    return new Response(
      JSON.stringify({ success: true, creditsEarned: creditsToAward, newBalance: (wallet.credits || 0) + creditsToAward }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
