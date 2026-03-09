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
    const { paymentMethod, amount, transactionId } = await req.json();

    // Validate inputs
    if (!paymentMethod || !amount || !transactionId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const validMethods = ["bkash", "nagad", "rocket", "binance"];
    if (!validMethods.includes(paymentMethod)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const txId = String(transactionId).slice(0, 100).trim();
    if (!txId || !/^[a-zA-Z0-9]+$/.test(txId)) {
      return new Response(JSON.stringify({ error: "Invalid transaction ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Check min deposit
    const { data: settings } = await supabase
      .from("payment_settings").select("min_deposit")
      .eq("payment_method", paymentMethod).eq("is_active", true).maybeSingle();

    const minDeposit = settings?.min_deposit || 50;
    if (amountNum < minDeposit) {
      return new Response(JSON.stringify({ error: `Minimum deposit is ৳${minDeposit}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for duplicate transaction ID
    const { data: existing } = await supabase
      .from("deposits").select("id").eq("transaction_id", txId).maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "This transaction ID has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create deposit
    const { error: insertErr } = await supabase.from("deposits").insert({
      profile_id: profile.id,
      amount: amountNum,
      payment_method: paymentMethod,
      transaction_id: txId,
      status: "pending",
    });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ success: true, message: "Deposit request submitted" }),
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
