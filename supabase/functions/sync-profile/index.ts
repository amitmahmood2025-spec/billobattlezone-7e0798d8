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
    // Verify Firebase JWT token
    const verifiedUid = await verifyFirebaseToken(req);

    const { firebaseUser, referralCode } = await req.json() as {
      firebaseUser: FirebaseUser;
      referralCode?: string;
    };

    // Use verified UID, ignore client-provided UID
    const uid = verifiedUid;
    const email = firebaseUser?.email;
    const displayName = firebaseUser?.displayName;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*, wallets(*), daily_streaks(*)")
      .eq("firebase_uid", uid)
      .single();

    if (existingProfile) {
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

    const sanitizedEmail = email?.slice(0, 255) || null;
    const sanitizedName = displayName?.slice(0, 100) || null;

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        firebase_uid: uid,
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
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "No token" || msg === "Invalid key ID" || msg === "No subject" ? 401 : 500;
    if (status === 500) console.error("Error:", error);
    return new Response(JSON.stringify({ error: status === 401 ? "Unauthorized" : "Internal server error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
