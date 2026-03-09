import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SEO from "@/components/SEO";
import ReferralLeaderboard from "@/components/referrals/ReferralLeaderboard";
import { useProfile } from "@/hooks/useProfile";
import { useReferrals } from "@/hooks/useReferrals";
import { Loader2, Copy, Check, Users, Gift, TrendingUp, Crown, Share2, MessageCircle, Send, ChevronRight, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ReferralsPage = () => {
  const { profile, wallet, loading: profileLoading } = useProfile();
  const { referrals, stats, loading: referralsLoading } = useReferrals(profile?.id);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "friends" | "rewards" | "leaderboard">("overview");

  const loading = profileLoading || referralsLoading;

  const referralCode = profile?.referral_code || "------";
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareWhatsApp = () => {
    const msg = `🎮 Join Billo Battle Zone and get FREE credits!\n\nUse my referral code: ${referralCode}\n\n👉 ${referralLink}\n\n✅ Get 10 credits instantly on signup!\n🎁 I get 50 credits when you join!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareTelegram = () => {
    const msg = `🎮 Join Billo Battle Zone! Use my code: ${referralCode}\n👉 ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const rewards = [
    { icon: "👤", title: "Friend Signs Up", desc: "You get 50 credits instantly", amount: "+50 CR", done: true },
    { icon: "💰", title: "Friend's First Deposit", desc: "You get 100 bonus credits", amount: "+100 CR", done: false },
    { icon: "📈", title: "Lifetime Commission", desc: "5% of all friend's deposits", amount: "5%", done: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Referrals" description="Invite friends and earn credits on Billo Battle Zone." />
      <DashboardNav />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-neon-purple/20 to-neon-pink/20" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--neon-purple)) 0%, transparent 50%)" }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground flex items-center gap-3">
                  <span className="text-3xl">{stats?.tierIcon || "🥉"}</span>
                  Refer & Earn
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Invite friends, unlock tiers, and earn unlimited credits. Every friend = more rewards!
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center glass rounded-xl px-4 py-3">
                <span className="text-xs text-muted-foreground">Your Tier</span>
                <span className="font-display font-bold text-lg" style={{ color: stats?.tierColor }}>
                  {stats?.tier || "Bronze"}
                </span>
              </div>
            </div>

            {/* Tier Progress */}
            {stats?.nextTier && (
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{stats.tier}</span>
                  <span className="text-primary font-semibold">{stats.totalReferrals}/{stats.nextTierTarget} to {stats.nextTier}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${stats.tierColor}, hsl(var(--primary)))` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: stats?.totalReferrals || 0, icon: Users, color: "text-primary" },
            { label: "Active Friends", value: stats?.activeReferrals || 0, icon: Check, color: "text-neon-green" },
            { label: "Total Earned", value: `${stats?.totalEarnings || 0} CR`, icon: TrendingUp, color: "text-neon-purple" },
            { label: "Pending", value: stats?.pendingBonuses || 0, icon: Gift, color: "text-neon-pink" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 text-center"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Referral Code & Share */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-5 sm:p-6 space-y-5"
        >
          {/* Code Display */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-medium">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/30 rounded-xl px-5 py-3.5 font-display font-bold text-xl sm:text-2xl tracking-[0.3em] text-primary text-center border border-primary/20">
                {referralCode}
              </div>
              <button
                onClick={() => handleCopy(referralCode, "Code")}
                className="glass rounded-xl p-3.5 hover:neon-glow transition-all"
              >
                {copied ? <Check className="w-5 h-5 text-neon-green" /> : <Copy className="w-5 h-5 text-primary" />}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-medium">Your Referral Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/20 rounded-lg px-4 py-2.5 text-xs text-muted-foreground truncate border border-border/30">
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy(referralLink, "Link")}
                className="text-sm text-primary font-semibold hover:underline whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div>
            <p className="text-sm text-muted-foreground mb-3 font-medium">Share With Friends</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#25D366", color: "#fff" }}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={shareTelegram}
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#0088cc", color: "#fff" }}
              >
                <Send className="w-4 h-4" /> Telegram
              </button>
              <button
                onClick={shareFacebook}
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#1877F2", color: "#fff" }}
              >
                <Share2 className="w-4 h-4" /> Facebook
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {(["overview", "leaderboard", "friends", "rewards"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all capitalize ${
                activeTab === tab
                  ? "gradient-neon text-primary-foreground shadow-neon"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? "How It Works" : tab === "leaderboard" ? "🏆 Top 10" : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* How it works steps */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> How Referrals Work
                </h3>
                {[
                  { step: "1", title: "Share Your Code", desc: "Send your unique referral code or link to friends via WhatsApp, Telegram, or any platform.", icon: "📤" },
                  { step: "2", title: "Friend Signs Up", desc: "When they register using your code, you instantly earn 50 credits!", icon: "✅" },
                  { step: "3", title: "Friend Deposits", desc: "When they make their first deposit, you earn 100 bonus credits!", icon: "💰" },
                  { step: "4", title: "Earn Forever", desc: "Get 5% commission on ALL their future deposits — lifetime!", icon: "♾️" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full gradient-neon flex items-center justify-center text-lg font-display font-bold text-primary-foreground shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground flex items-center gap-2">
                        <span>{item.icon}</span> {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tier System */}
              <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-primary" /> Referral Tiers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: "Bronze", min: "0+", icon: "🥉", color: "#cd7f32", perks: "Base rewards" },
                    { name: "Silver", min: "5+", icon: "🥈", color: "#c0c0c0", perks: "+10% bonus" },
                    { name: "Gold", min: "15+", icon: "🥇", color: "#ffd700", perks: "+25% bonus" },
                    { name: "Platinum", min: "30+", icon: "💎", color: "#00d9ff", perks: "+50% bonus" },
                    { name: "Diamond", min: "50+", icon: "👑", color: "#b9f2ff", perks: "VIP access" },
                    { name: "Legend", min: "100+", icon: "🔥", color: "#ff3d71", perks: "Max rewards" },
                  ].map((tier) => (
                    <div
                      key={tier.name}
                      className={`glass rounded-xl p-3 text-center transition-all ${
                        stats?.tier === tier.name ? "neon-glow ring-1 ring-primary/50" : ""
                      }`}
                    >
                      <span className="text-2xl">{tier.icon}</span>
                      <p className="font-display font-bold text-sm mt-1" style={{ color: tier.color }}>{tier.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tier.min} referrals</p>
                      <p className="text-[10px] text-primary mt-0.5">{tier.perks}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ReferralLeaderboard />
            </motion.div>
          )}

          {activeTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border/20">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Your Referrals ({referrals.length})
                  </h3>
                </div>

                {referrals.length === 0 ? (
                  <div className="p-10 text-center">
                    <span className="text-4xl">👥</span>
                    <p className="text-muted-foreground mt-3">No referrals yet. Share your code and start earning!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {referrals.map((ref, i) => (
                      <motion.div
                        key={ref.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-sm text-primary">
                          {ref.referred_profile?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground">
                            {ref.referred_profile?.username || ref.referred_profile?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(ref.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            {ref.bonus_credited && (
                              <span className="text-[10px] bg-neon-green/20 text-neon-green px-2 py-0.5 rounded-full">Signup ✓</span>
                            )}
                            {ref.deposit_bonus_credited && (
                              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Deposit ✓</span>
                            )}
                          </div>
                          {ref.total_commission > 0 && (
                            <p className="text-xs text-neon-green font-display font-bold mt-1">+{ref.total_commission} CR</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-primary" /> Reward Structure
                </h3>
                {rewards.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl glass mb-2 last:mb-0"
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-sm text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <span className="font-display font-bold text-primary text-sm">{r.amount}</span>
                  </motion.div>
                ))}
              </div>

              {/* Earnings Breakdown */}
              <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-neon-green" /> Your Earnings
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Signup Bonuses</span>
                    <span className="font-display font-bold text-foreground">
                      {(stats?.activeReferrals || 0) * 50} CR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Deposit Bonuses</span>
                    <span className="font-display font-bold text-foreground">
                      {referrals.filter((r) => r.deposit_bonus_credited).length * 100} CR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Commissions</span>
                    <span className="font-display font-bold text-foreground">
                      {referrals.reduce((s, r) => s + r.total_commission, 0)} CR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold text-foreground">Total Earned</span>
                    <span className="font-display font-bold text-primary text-lg">
                      {stats?.totalEarnings || 0} CR
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ReferralsPage;
