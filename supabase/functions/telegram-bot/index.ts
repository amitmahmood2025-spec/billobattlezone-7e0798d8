import { Bot, InlineKeyboard, webhookCallback } from "https://esm.sh/grammy@1.21.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ENVIRONMENT VARIABLES
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "billo-bbz-secret";
const MINI_APP_URL = Deno.env.get("MINI_APP_URL") || "https://billobattlezone.lovable.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const bot = new Bot(BOT_TOKEN);

// HELPERS
async function getOrCreateProfile(telegramUser: { id: number; first_name: string; last_name?: string; username?: string; }) {
  const telegramId = String(telegramUser.id);
  const displayName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") || telegramUser.username || "Player";

  const { data: existing } = await supabase
    .from("profiles")
    .select("*, wallets(*), daily_streaks(*)")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (existing) return { profile: existing, isNew: false };

  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      firebase_uid: `tg_${telegramId}`,
      telegram_id: telegramId,
      username: telegramUser.username || displayName,
      email: null,
    })
    .select("*, wallets(*), daily_streaks(*)")
    .single();

  if (error || !newProfile) {
    console.error("Profile create error:", error);
    throw new Error("Failed to create profile");
  }

  if (newProfile.wallets) {
    await supabase
      .from("wallets")
      .update({
        credits: 10,
        total_earned: 10,
      })
      .eq("id", newProfile.wallets.id);

    await supabase.from("transactions").insert({
      profile_id: newProfile.id,
      type: "credit_earn",
      amount: 10,
      description: "Welcome Bonus 🎁",
    });
  }

  return { profile: newProfile, isNew: true };
}

async function claimDailyBonus(profileId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .ilike("title", "%daily%login%")
    .eq("is_active", true)
    .maybeSingle();

  if (!task) return { success: false, error: "Daily task not found" };

  const { data: userTask } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("profile_id", profileId)
    .eq("task_id", task.id)
    .maybeSingle();

  if (userTask?.last_claimed_at) {
    const lastDate = new Date(userTask.last_claimed_at).toISOString().split("T")[0];
    if (lastDate === today) {
      return { success: false, error: "Already claimed today ✅" };
    }
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (!wallet) return { success: false, error: "Wallet not found" };

  await supabase
    .from("wallets")
    .update({
      credits: wallet.credits + task.reward_credits,
      total_earned: wallet.total_earned + task.reward_credits,
    })
    .eq("id", wallet.id);

  await supabase.from("transactions").insert({
    profile_id: profileId,
    type: "credit_earn",
    amount: task.reward_credits,
    description: "Daily Login Bonus",
  });

  return { success: true, credits: task.reward_credits };
}

function formatBalance(credits: number, cash: number) {
  return `💎 *Credits:* ${Math.floor(credits)}\n💵 *Cash:* ৳${Number(cash).toFixed(2)}`;
}

function mainKeyboard() {
  return new InlineKeyboard()
    .text("🎯 Daily Tasks", "tasks")
    .text("🎡 Spin Wheel", "spin")
    .row()
    .text("🏆 Tournaments", "tournaments")
    .text("💰 Deposit", "deposit")
    .row()
    .text("💸 Withdraw", "withdraw")
    .text("👤 Profile", "profile")
    .row()
    .webApp("🎮 Open Full App", MINI_APP_URL);
}

// COMMANDS
bot.command("start", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile, isNew } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;

    const welcomeText = isNew
      ? `🏭 *Welcome to Credit Factory!*\n\n🎁 +10 Credits Welcome Bonus!\n\n${formatBalance(wallet?.credits || 10, wallet?.cash || 0)}`
      : `🏭 *Welcome Back!*\n\n${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard(),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Error occurred.");
  }
});

bot.command("balance", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { profile } = await getOrCreateProfile(telegramUser);
  const wallet = profile?.wallets;

  await ctx.reply(`💼 *Wallet*\n\n${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}`, {
    parse_mode: "Markdown",
    reply_markup: mainKeyboard(),
  });
});

bot.command("daily", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { profile } = await getOrCreateProfile(telegramUser);

  const result = await claimDailyBonus(profile.id);

  if (result.success) {
    await ctx.reply(`🎁 +${result.credits} Credits claimed!`, {
      reply_markup: mainKeyboard(),
    });
  } else {
    await ctx.reply(result.error);
  }
});

// CALLBACKS
bot.callbackQuery("tasks", async (ctx) => {
  await ctx.answerCallbackQuery();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .limit(6);

  const list = (tasks || []).map((t) => `${t.icon || "🎯"} ${t.title} +${t.reward_credits}`).join("\n");

  await ctx.editMessageText(`📋 Tasks\n\n${list}`, {
    reply_markup: new InlineKeyboard()
      .text("🎁 Claim Daily Bonus", "claim_daily")
      .row()
      .text("🔙 Back", "back_main"),
  });
});

bot.callbackQuery("claim_daily", async (ctx) => {
  await ctx.answerCallbackQuery();

  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { profile } = await getOrCreateProfile(telegramUser);

  const result = await claimDailyBonus(profile.id);

  if (result.success) {
    await ctx.editMessageText(`✅ +${result.credits} Credits received!`);
  } else {
    await ctx.editMessageText(result.error);
  }
});

bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();

  await ctx.editMessageText("🏭 Credit Factory", {
    reply_markup: mainKeyboard(),
  });
});

// SERVER ENTRY POINT
const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return new Response("OK");
  }

  if (req.method === "POST") {
    const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");

    if (secret !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    return handleUpdate(req);
  }

  return new Response("Credit Factory Bot Running 🏭");
});
