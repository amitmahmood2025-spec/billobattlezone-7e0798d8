import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firebaseUser, referralCode } = await req.json() as {
      firebaseUser: FirebaseUser;
      referralCode?: string;
    };

    if (!firebaseUser?.uid) {
      return new Response(
        JSON.stringify({ error: "Firebase user data required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UID format
    if (typeof firebaseUser.uid !== "string" || firebaseUser.uid.length > 128 || !/^[a-zA-Z0-9]+$/.test(firebaseUser.uid)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*, wallets(*), daily_streaks(*)")
      .eq("firebase_uid", firebaseUser.uid)
      .single();

    if (existingProfile) {
      // Check if banned
      if (existingProfile.is_banned) {
        return new Response(
          JSON.stringify({ error: "Account suspended" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update streak on login
      const today = new Date().toISOString().split("T")[0];
      const streak = existingProfile.daily_streaks;

      if (streak && streak.last_login_date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = 1;
        if (streak.last_login_date === yesterdayStr) {
          newStreak = (streak.current_streak || 0) + 1;
        }

        await supabase.from("daily_streaks").update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak || 0),
          last_login_date: today,
        }).eq("profile_id", existingProfile.id);

        // 7-day streak bonus
        if (newStreak === 7) {
          const wallet = existingProfile.wallets;
          if (wallet) {
            await supabase.from("wallets").update({
              credits: (wallet.credits || 0) + 100,
              total_earned: (wallet.total_earned || 0) + 100,
            }).eq("id", wallet.id);

            await supabase.from("transactions").insert({
              profile_id: existingProfile.id, type: "credit_earn", amount: 100,
              description: "7-Day Streak Bonus",
            });
          }
        }
      }

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*, wallets(*), daily_streaks(*)")
        .eq("id", existingProfile.id)
        .single();

      return new Response(
        JSON.stringify({ profile: updatedProfile, isNew: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new profile
    let referrerId = null;
    if (referralCode && typeof referralCode === "string" && referralCode.length <= 20) {
      const { data: referrer } = await supabase
        .from("profiles").select("id")
        .eq("referral_code", referralCode.toUpperCase()).single();
      if (referrer) referrerId = referrer.id;
    }

    const sanitizedEmail = firebaseUser.email?.slice(0, 255) || null;
    const sanitizedName = firebaseUser.displayName?.slice(0, 100) || null;

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        firebase_uid: firebaseUser.uid,
        email: sanitizedEmail,
        username: sanitizedName,
        referred_by: referrerId,
      })
      .select("*, wallets(*), daily_streaks(*)")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Init streak
    await supabase.from("daily_streaks").update({
      current_streak: 1, last_login_date: new Date().toISOString().split("T")[0],
    }).eq("profile_id", newProfile.id);

    // Referral handling
    if (referrerId && newProfile) {
      await supabase.from("referrals").insert({
        referrer_id: referrerId, referred_id: newProfile.id,
      });

      const { data: referrerWallet } = await supabase
        .from("wallets").select("*").eq("profile_id", referrerId).single();

      if (referrerWallet) {
        await supabase.from("wallets").update({
          credits: (referrerWallet.credits || 0) + 50,
          total_earned: (referrerWallet.total_earned || 0) + 50,
        }).eq("id", referrerWallet.id);

        await supabase.from("transactions").insert({
          profile_id: referrerId, type: "referral_bonus", amount: 50,
          description: `Referral: ${sanitizedName || sanitizedEmail}`,
        });

        await supabase.from("referrals").update({ bonus_credited: true })
          .eq("referrer_id", referrerId).eq("referred_id", newProfile.id);
      }
    }

    // Welcome bonus
    if (newProfile?.wallets) {
      await supabase.from("wallets").update({
        credits: 10, total_earned: 10,
      }).eq("id", newProfile.wallets.id);

      await supabase.from("transactions").insert({
        profile_id: newProfile.id, type: "credit_earn", amount: 10,
        description: "Welcome Bonus",
      });
    }

    const { data: finalProfile } = await supabase
      .from("profiles")
      .select("*, wallets(*), daily_streaks(*)")
      .eq("id", newProfile.id)
      .single();

    return new Response(
      JSON.stringify({ profile: finalProfile, isNew: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
