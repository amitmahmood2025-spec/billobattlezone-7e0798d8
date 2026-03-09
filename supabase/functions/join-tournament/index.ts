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
    const { tournamentId, payWithCredits, gameId, gameName } = await req.json();

    if (!tournamentId || !gameId || !gameName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profile
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

    // Check if already joined
    const { data: existingEntry } = await supabase
      .from("tournament_entries").select("id")
      .eq("tournament_id", tournamentId).eq("profile_id", profile.id).maybeSingle();

    if (existingEntry) {
      return new Response(JSON.stringify({ error: "Already joined this tournament" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get tournament (lock via select for atomic check)
    const { data: tournament } = await supabase
      .from("tournaments").select("*")
      .eq("id", tournamentId).eq("status", "upcoming").single();

    if (!tournament) {
      return new Response(JSON.stringify({ error: "Tournament not found or not open" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (tournament.max_participants && (tournament.current_participants || 0) >= tournament.max_participants) {
      return new Response(JSON.stringify({ error: "Tournament is full" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get wallet and check balance
    const { data: wallet } = await supabase
      .from("wallets").select("*").eq("profile_id", profile.id).single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const useCredits = payWithCredits !== false;
    const balance = useCredits ? (wallet.credits || 0) : (wallet.cash || 0);

    if (balance < tournament.entry_fee) {
      return new Response(JSON.stringify({ error: `Insufficient ${useCredits ? "credits" : "cash"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Deduct balance
    const field = useCredits ? "credits" : "cash";
    await supabase.from("wallets").update({
      [field]: balance - tournament.entry_fee,
    }).eq("id", wallet.id);

    // Create entry
    await supabase.from("tournament_entries").insert({
      tournament_id: tournamentId,
      profile_id: profile.id,
      fee_paid: tournament.entry_fee,
      fee_type: useCredits ? "credits" : "cash",
      game_id: String(gameId).slice(0, 50),
      game_name: String(gameName).slice(0, 50),
    });

    // Update participant count
    await supabase.from("tournaments").update({
      current_participants: (tournament.current_participants || 0) + 1,
    }).eq("id", tournamentId);

    // Record transaction
    await supabase.from("transactions").insert({
      profile_id: profile.id,
      type: useCredits ? "match_entry_credit" : "match_entry_cash",
      amount: -tournament.entry_fee,
      balance_before: balance,
      balance_after: balance - tournament.entry_fee,
      description: `Tournament entry: ${tournament.title}`,
      reference_id: tournamentId,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Joined tournament!" }),
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
