import { Bot, Context, InlineKeyboard, webhookCallback } from "https://esm.sh/grammy@1.21.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "billo-bbz-secret";
const MINI_APP_URL = Deno.env.get("MINI_APP_URL") || "https://billobattlezone.lovable.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const bot = new Bot(BOT_TOKEN);

// ============================================================
// HELPERS
// ============================================================

async function getOrCreateProfile(telegramUser: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}) {
  const telegramId = String(telegramUser.id);
  const displayName =
    [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") ||
    telegramUser.username ||
    "Player";

  // Try find by telegram_id column
  const { data: existing } = await supabase
    .from("profiles")
    .select("*, wallets(*), daily_streaks(*)")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (existing) {
    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const streak = existing.daily_streaks;
    if (streak && streak.last_login_date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      let newStreak = streak.last_login_date === yesterdayStr ? (streak.current_streak || 0) + 1 : 1;
      await supabase.from("daily_streaks").update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak || 0),
        last_login_date: today,
      }).eq("profile_id", existing.id);

      if (newStreak === 7) {
        const wallet = existing.wallets;
        if (wallet) {
          await supabase.from("wallets").update({
            credits: (wallet.credits || 0) + 100,
            total_earned: (wallet.total_earned || 0) + 100,
          }).eq("id", wallet.id);
          await supabase.from("transactions").insert({
            profile_id: existing.id, type: "credit_earn", amount: 100,
            description: "7-Day Streak Bonus 🔥",
          });
        }
      }
    }

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("*, wallets(*), daily_streaks(*)")
      .eq("id", existing.id)
      .single();
    return { profile: refreshed, isNew: false };
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      firebase_uid: `tg_${telegramId}`, // prefix so it won't conflict
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

  // Welcome bonus
  if (newProfile.wallets) {
    await supabase.from("wallets").update({
      credits: 10, total_earned: 10,
    }).eq("id", newProfile.wallets.id);
    await supabase.from("transactions").insert({
      profile_id: newProfile.id, type: "credit_earn", amount: 10,
      description: "Welcome Bonus 🎁",
    });
  }

  // Init streak
  await supabase.from("daily_streaks").update({
    current_streak: 1,
    last_login_date: new Date().toISOString().split("T")[0],
  }).eq("profile_id", newProfile.id);

  const { data: final } = await supabase
    .from("profiles")
    .select("*, wallets(*), daily_streaks(*)")
    .eq("id", newProfile.id)
    .single();

  return { profile: final, isNew: true };
}

async function claimDailyBonus(profileId: string): Promise<{ success: boolean; credits?: number; error?: string }> {
  const today = new Date().toISOString().split("T")[0];

  // Find daily login task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .ilike("title", "%daily%login%")
    .eq("is_active", true)
    .maybeSingle();

  if (!task) return { success: false, error: "Daily task not found" };

  // Check already claimed today
  const { data: userTask } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("profile_id", profileId)
    .eq("task_id", task.id)
    .maybeSingle();

  if (userTask?.last_claimed_at) {
    const lastDate = new Date(userTask.last_claimed_at).toISOString().split("T")[0];
    if (lastDate === today) return { success: false, error: "Already claimed today ✅" };
  }

  // Check daily cap
  const { data: todayClaims } = await supabase
    .from("task_claims")
    .select("credits_earned")
    .eq("profile_id", profileId)
    .gte("claimed_at", `${today}T00:00:00Z`);
  const totalToday = (todayClaims || []).reduce((s, c) => s + (c.credits_earned || 0), 0);
  if (totalToday >= 200) return { success: false, error: "Daily limit reached (200 credits)" };

  const creditsToAward = Math.min(task.reward_credits, 200 - totalToday);

  const { data: wallet } = await supabase.from("wallets").select("*").eq("profile_id", profileId).single();
  if (!wallet) return { success: false, error: "Wallet not found" };

  await supabase.from("wallets").update({
    credits: (wallet.credits || 0) + creditsToAward,
    total_earned: (wallet.total_earned || 0) + creditsToAward,
  }).eq("id", wallet.id);

  await supabase.from("task_claims").insert({
    profile_id: profileId, task_id: task.id, credits_earned: creditsToAward, ip_address: "0.0.0.0",
  });

  if (userTask) {
    await supabase.from("user_tasks").update({
      is_completed: true, is_claimed: true, last_claimed_at: new Date().toISOString(),
    }).eq("id", userTask.id);
  } else {
    await supabase.from("user_tasks").insert({
      profile_id: profileId, task_id: task.id,
      is_completed: true, is_claimed: true, last_claimed_at: new Date().toISOString(),
    });
  }

  await supabase.from("transactions").insert({
    profile_id: profileId, type: "credit_earn", amount: creditsToAward,
    balance_before: wallet.credits, balance_after: (wallet.credits || 0) + creditsToAward,
    description: "Daily Login Bonus via Telegram",
  });

  return { success: true, credits: creditsToAward };
}

function formatBalance(credits: number, cash: number): string {
  return `💎 *Credits:* ${Math.floor(credits)} (Play Only)\n💵 *Cash:* ৳${Number(cash).toFixed(2)} (Withdrawable)`;
}

function mainKeyboard(profileId?: string) {
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

// ============================================================
// COMMANDS
// ============================================================

bot.command("start", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile, isNew } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;

    const welcomeText = isNew
      ? `🏭 *Welcome to Credit Factory!*\n\n` +
        `হ্যালো ${telegramUser.first_name}! আপনি সফলভাবে রেজিস্টার হয়েছেন।\n\n` +
        `🎁 *Welcome Bonus:* +10 Credits পেয়েছেন!\n\n` +
        `${formatBalance(wallet?.credits || 10, wallet?.cash || 0)}\n\n` +
        `প্রতিদিন missions complete করুন, credits earn করুন এবং tournaments জিতে real cash prize নিন! 🏆`
      : `🏭 *Credit Factory তে স্বাগতম!*\n\n` +
        `হ্যালো আবার, ${telegramUser.first_name}! 👋\n\n` +
        `${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard(),
    });
  } catch (err) {
    console.error("Start error:", err);
    await ctx.reply("❌ কিছু একটা সমস্যা হয়েছে। পরে আবার try করুন।");
  }
});

bot.command("balance", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;
    const streak = profile?.daily_streaks;

    await ctx.reply(
      `💼 *আপনার Wallet*\n\n` +
        `${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}\n\n` +
        `🔥 *Current Streak:* ${streak?.current_streak || 0} Days\n` +
        `📊 *Total Earned:* ${Math.floor(wallet?.total_earned || 0)} Credits`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
  } catch {
    await ctx.reply("❌ Balance load করতে সমস্যা হয়েছে।");
  }
});

bot.command("daily", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    if (!profile) return;

    const result = await claimDailyBonus(profile.id);

    if (result.success) {
      await ctx.reply(
        `🎁 *Daily Bonus Claimed!*\n\n` +
          `✅ +${result.credits} Credits পেয়েছেন!\n\n` +
          `কাল আবার আসুন আরও credits নিতে 🔥`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard() }
      );
    } else {
      await ctx.reply(`ℹ️ ${result.error}\n\nআরও credits earn করতে tasks দেখুন!`, {
        parse_mode: "Markdown",
        reply_markup: mainKeyboard(),
      });
    }
  } catch {
    await ctx.reply("❌ Daily bonus claim করতে সমস্যা হয়েছে।");
  }
});

bot.command("tasks", async (ctx) => {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  if (!tasks || tasks.length === 0) {
    await ctx.reply("কোনো task নেই এখন।");
    return;
  }

  const taskList = tasks
    .map((t) => `${t.icon || "🎯"} *${t.title}* — +${t.reward_credits} Credits`)
    .join("\n");

  await ctx.reply(
    `📋 *Available Tasks*\n\n${taskList}\n\n` +
      `সব tasks complete করতে Full App খুলুন 👇`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("🎯 Claim Daily Bonus", "claim_daily")
        .row()
        .webApp("🎮 All Tasks করুন", `${MINI_APP_URL}/dashboard/tasks`),
    }
  );
});

bot.command("tournaments", async (ctx) => {
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("starts_at", { ascending: true })
    .limit(5);

  if (!tournaments || tournaments.length === 0) {
    await ctx.reply("🏆 এখন কোনো tournament নেই। শীঘ্রই আসছে!", {
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const list = tournaments
    .map((t) => {
      const status = t.status === "live" ? "🔴 LIVE" : "⏰ Upcoming";
      return `${status} *${t.title}*\n🎮 ${t.game_type} | Entry: ${t.entry_fee} ${t.entry_fee_type} | Prize: ৳${t.prize_pool}`;
    })
    .join("\n\n");

  await ctx.reply(
    `🏆 *Current Tournaments*\n\n${list}\n\nJoin করতে Full App খুলুন!`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp("🏆 Tournaments খুলুন", `${MINI_APP_URL}/dashboard/tournaments`),
    }
  );
});

bot.command("profile", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;
    const streak = profile?.daily_streaks;

    await ctx.reply(
      `👤 *আপনার Profile*\n\n` +
        `🆔 Username: ${profile?.username || "N/A"}\n` +
        `🔗 Referral Code: \`${profile?.referral_code || "N/A"}\`\n\n` +
        `💼 *Wallet*\n${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}\n\n` +
        `🔥 Streak: ${streak?.current_streak || 0} Days\n` +
        `📊 Total Earned: ${Math.floor(wallet?.total_earned || 0)} Credits\n\n` +
        `বন্ধুদের invite করুন এবং প্রতিজনের জন্য *50 Credits* পান! 🎁`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
  } catch {
    await ctx.reply("❌ Profile load করতে সমস্যা হয়েছে।");
  }
});

bot.command("refer", async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    const referralCode = profile?.referral_code;
    const referralLink = `https://t.me/${ctx.me.username}?start=ref_${referralCode}`;

    await ctx.reply(
      `👥 *Referral Program*\n\n` +
        `আপনার Referral Code: \`${referralCode}\`\n\n` +
        `🔗 Share করুন:\n${referralLink}\n\n` +
        `💰 *Rewards:*\n` +
        `• প্রতি signup → *+50 Credits*\n` +
        `• বন্ধু deposit করলে → *+100 Credits*\n` +
        `• বন্ধুর প্রতি deposit এর *5%* commission আজীবন!`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().switchInline(
          "📤 বন্ধুদের Share করুন",
          `Billo Battle Zone-এ join করুন! Free credits earn করুন 🎮 ${referralLink}`
        ),
      }
    );
  } catch {
    await ctx.reply("❌ Referral info load করতে সমস্যা হয়েছে।");
  }
});

bot.command("deposit", async (ctx) => {
  const { data: settings } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("is_active", true);

  const methods = (settings || [])
    .map((s) => `• *${s.payment_method.toUpperCase()}:* \`${s.account_number}\` (Min: ৳${s.min_deposit})`)
    .join("\n");

  await ctx.reply(
    `💰 *Deposit করুন*\n\nPay করুন নিচের যেকোনো method-এ:\n\n${methods}\n\n` +
      `💡 TrxID সহ Full App-এ submit করুন।`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp(
        "💰 Deposit করুন",
        `${MINI_APP_URL}/dashboard/deposit`
      ),
    }
  );
});

bot.command("withdraw", async (ctx) => {
  await ctx.reply(
    `💸 *Withdrawal করুন*\n\n` +
      `✅ শুধুমাত্র *Cash balance* withdraw করা যাবে\n` +
      `❌ Credits withdraw করা যাবে না\n` +
      `⏱ Processing time: 24-48 hours\n\n` +
      `Full App-এ গিয়ে withdrawal request করুন।`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp(
        "💸 Withdraw করুন",
        `${MINI_APP_URL}/dashboard/withdraw`
      ),
    }
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `🤖 *Credit Factory Bot*\n\n` +
      `📋 *Commands:*\n` +
      `/start — শুরু করুন\n` +
      `/balance — Wallet দেখুন\n` +
      `/daily — Daily bonus নিন\n` +
      `/tasks — Available tasks\n` +
      `/tournaments — Tournaments দেখুন\n` +
      `/profile — Profile দেখুন\n` +
      `/refer — Referral link নিন\n` +
      `/deposit — Deposit করুন\n` +
      `/withdraw — Withdraw করুন\n` +
      `/help — এই message\n\n` +
      `🎮 Full features পেতে Web App খুলুন!`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp("🎮 Full App খুলুন", MINI_APP_URL),
    }
  );
});

// ============================================================
// CALLBACK QUERY HANDLERS
// ============================================================

bot.callbackQuery("tasks", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(6);

  const list = (tasks || []).map((t) => `${t.icon || "🎯"} *${t.title}* +${t.reward_credits}`).join("\n");
  await ctx.editMessageText(`📋 *Tasks*\n\n${list}`, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text("🎁 Claim Daily Bonus", "claim_daily")
      .row()
      .webApp("📱 সব Tasks", `${MINI_APP_URL}/dashboard/tasks`)
      .row()
      .text("🔙 Back", "back_main"),
  });
});

bot.callbackQuery("claim_daily", async (ctx) => {
  await ctx.answerCallbackQuery("Processing...");
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    if (!profile) return;

    const result = await claimDailyBonus(profile.id);
    const wallet = profile?.wallets;

    if (result.success) {
      await ctx.editMessageText(
        `✅ *Daily Bonus Claimed!*\n\n+${result.credits} Credits পেয়েছেন!\n\nকাল আবার আসুন 🔥`,
        { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🏠 Home", "back_main") }
      );
    } else {
      await ctx.editMessageText(
        `ℹ️ ${result.error}`,
        { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 Back", "back_main") }
      );
    }
  } catch {
    await ctx.answerCallbackQuery("❌ Error occurred");
  }
});

bot.callbackQuery("spin", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🎡 *Spin the Wheel*\n\nপ্রতিদিন 1টি free spin!\n\n5 থেকে 100 Credits পর্যন্ত জেতার সুযোগ।\n\nFull App-এ spin করুন 👇`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp("🎡 Spin করুন", `${MINI_APP_URL}/dashboard/tasks`)
        .row()
        .text("🔙 Back", "back_main"),
    }
  );
});

bot.callbackQuery("tournaments", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("starts_at")
    .limit(4);

  if (!tournaments?.length) {
    await ctx.editMessageText("🏆 এখন কোনো tournament নেই।", {
      reply_markup: new InlineKeyboard().text("🔙 Back", "back_main"),
    });
    return;
  }

  const list = tournaments.map((t) => {
    const s = t.status === "live" ? "🔴" : "⏰";
    return `${s} *${t.title}*\n   ${t.game_type} | ৳${t.prize_pool} Prize`;
  }).join("\n\n");

  await ctx.editMessageText(`🏆 *Tournaments*\n\n${list}`, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .webApp("🏆 Join Tournaments", `${MINI_APP_URL}/dashboard/tournaments`)
      .row()
      .text("🔙 Back", "back_main"),
  });
});

bot.callbackQuery("deposit", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💰 *Deposit করুন*\n\nbKash, Nagad, Rocket বা Binance দিয়ে deposit করুন।\n\nFull App-এ TrxID submit করুন।`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp("💰 Deposit Page", `${MINI_APP_URL}/dashboard/deposit`)
        .row()
        .text("🔙 Back", "back_main"),
    }
  );
});

bot.callbackQuery("withdraw", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💸 *Withdraw করুন*\n\nCash balance withdraw করুন বিভিন্ন payment method-এ।\n\nProcessing: 24-48 hours`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp("💸 Withdraw Page", `${MINI_APP_URL}/dashboard/withdraw`)
        .row()
        .text("🔙 Back", "back_main"),
    }
  );
});

bot.callbackQuery("profile", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;
    const streak = profile?.daily_streaks;

    await ctx.editMessageText(
      `👤 *Profile*\n\n` +
        `Username: ${profile?.username || "N/A"}\n` +
        `Referral: \`${profile?.referral_code || "N/A"}\`\n\n` +
        `${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}\n` +
        `🔥 Streak: ${streak?.current_streak || 0} Days`,
      {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .webApp("👤 Full Profile", `${MINI_APP_URL}/dashboard`)
          .row()
          .text("🔙 Back", "back_main"),
      }
    );
  } catch {
    await ctx.answerCallbackQuery("❌ Error");
  }
});

bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  try {
    const { profile } = await getOrCreateProfile(telegramUser);
    const wallet = profile?.wallets;

    await ctx.editMessageText(
      `🏭 *Credit Factory*\n\n` +
        `হ্যালো ${telegramUser.first_name}! 👋\n\n` +
        `${formatBalance(wallet?.credits || 0, wallet?.cash || 0)}\n\n` +
        `কী করতে চান?`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
  } catch {
    await ctx.answerCallbackQuery("❌ Error");
  }
});

// ============================================================
// INLINE QUERIES (share referral)
// ============================================================
bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query;
  await ctx.answerInlineQuery([
    {
      type: "article",
      id: "invite",
      title: "🏭 Credit Factory তে Join করুন",
      description: "Free credits earn করুন এবং tournaments জিতুন!",
      input_message_content: {
        message_text:
          `🏭 *Credit Factory*\n\n` +
          `Free credits earn করুন daily tasks দিয়ে!\n` +
          `Real tournaments join করুন এবং cash prize জিতুন! 💰\n\n` +
          `${query || MINI_APP_URL}`,
        parse_mode: "Markdown",
      },
    },
  ]);
});

// ============================================================
// SERVER - Webhook mode for production
// ============================================================
const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Health check
  if (url.pathname.endsWith("/health")) {
    return new Response(JSON.stringify({ status: "ok", bot: "Credit Factory Bot" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Setup webhook endpoint
  if (url.pathname.endsWith("/setup") && req.method === "GET") {
    const webhookUrl = `${Deno.env.get("BOT_WEBHOOK_URL")}/webhook`;
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${WEBHOOK_SECRET}`
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  // Telegram webhook
  if (url.pathname.endsWith("/webhook")) {
    const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    return handleUpdate(req);
  }

  return new Response("Credit Factory Telegram Bot is running! 🏭", { status: 200 });
});
