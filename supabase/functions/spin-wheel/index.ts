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

// Players ALWAYS get low prizes. High values are just visual on the wheel.
const PRIZES = [
  { credits: 2, probability: 0.30, label: "2 Credits" },
  { credits: 3, probability: 0.30, label: "3 Credits" },
  { credits: 4, probability: 0.20, label: "4 Credits" },
  { credits: 5, probability: 0.15, label: "5 Credits" },
  { credits: 10, probability: 0.04, label: "10 Credits" },
  { credits: 15, probability: 0.009, label: "15 Credits" },
  { credits: 25, probability: 0.001, label: "25 Credits" },
];

function spinWheel(): typeof PRIZES[0] {
  const random = Math.random();
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) return prize;
  }
  return PRIZES[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const firebaseUid = await verifyFirebaseToken(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const today = new Date().toISOString().split("T")[0];
    const { data: todaySpin } = await supabase
      .from("spin_history")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("spin_date", today)
      .single();

    if (todaySpin) {
      return new Response(
        JSON.stringify({ error: "Already spun today. Come back tomorrow!" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prize = spinWheel();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (!wallet) {
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("wallets").update({
      credits: (wallet.credits || 0) + prize.credits,
      total_earned: (wallet.total_earned || 0) + prize.credits,
    }).eq("id", wallet.id);

    await supabase.from("spin_history").insert({
      profile_id: profile.id, credits_won: prize.credits, spin_date: today,
    });

    await supabase.from("transactions").insert({
      profile_id: profile.id, type: "spin_win", amount: prize.credits,
      balance_before: wallet.credits, balance_after: (wallet.credits || 0) + prize.credits,
      description: `Spin Wheel: ${prize.label}`,
    });

    return new Response(
      JSON.stringify({ success: true, prize, newBalance: (wallet.credits || 0) + prize.credits }),
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
