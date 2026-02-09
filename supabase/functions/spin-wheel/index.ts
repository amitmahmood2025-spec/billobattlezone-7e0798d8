import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Spin wheel prizes with probabilities
const PRIZES = [
  { credits: 5, probability: 0.35, label: "5 Credits" },
  { credits: 10, probability: 0.25, label: "10 Credits" },
  { credits: 15, probability: 0.15, label: "15 Credits" },
  { credits: 25, probability: 0.12, label: "25 Credits" },
  { credits: 50, probability: 0.08, label: "50 Credits" },
  { credits: 75, probability: 0.04, label: "75 Credits" },
  { credits: 100, probability: 0.01, label: "100 Credits" },
];

function spinWheel(): typeof PRIZES[0] {
  const random = Math.random();
  let cumulative = 0;
  
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }
  
  return PRIZES[0]; // Default to smallest prize
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firebaseUid } = await req.json();

    if (!firebaseUid) {
      return new Response(
        JSON.stringify({ error: "Firebase UID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profile
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

    // Check if already spun today
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

    // Spin the wheel
    const prize = spinWheel();

    // Get wallet
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

    // Update wallet
    await supabase
      .from("wallets")
      .update({
        credits: (wallet.credits || 0) + prize.credits,
        total_earned: (wallet.total_earned || 0) + prize.credits,
      })
      .eq("id", wallet.id);

    // Record spin
    await supabase.from("spin_history").insert({
      profile_id: profile.id,
      credits_won: prize.credits,
      spin_date: today,
    });

    // Record transaction
    await supabase.from("transactions").insert({
      profile_id: profile.id,
      type: "spin_win",
      amount: prize.credits,
      balance_before: wallet.credits,
      balance_after: (wallet.credits || 0) + prize.credits,
      description: `Spin Wheel: ${prize.label}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        prize: prize,
        newBalance: (wallet.credits || 0) + prize.credits,
      }),
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
