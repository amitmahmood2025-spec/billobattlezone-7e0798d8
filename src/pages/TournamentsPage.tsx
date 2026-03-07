import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTournaments, Tournament } from "@/hooks/useTournaments";
import DashboardNav from "@/components/dashboard/DashboardNav";
import JoinTournamentModal from "@/components/tournaments/JoinTournamentModal";
import RulesPopup from "@/components/tournaments/RulesPopup";
import { getGameImage } from "@/lib/gameImages";
import {
  Trophy, Clock, Loader2, Coins, Banknote, CheckCircle, Lock, Eye, ArrowLeft, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

import freefireBanner from "@/assets/games/freefire-banner.jpg";
import freefireAction from "@/assets/games/freefire-action.jpg";
import freefireThumb from "@/assets/games/freefire-thumb.jpg";
import pubgBanner from "@/assets/games/pubg-banner.jpg";
import pubgAction from "@/assets/games/pubg-action.jpg";
import pubgThumb from "@/assets/games/pubg-thumb.jpg";
import ludoBanner from "@/assets/games/ludo-banner.jpg";
import ludoAction from "@/assets/games/ludo-action.jpg";
import ludoThumb from "@/assets/games/ludo-thumb.jpg";

const GAME_SECTIONS = [
  {
    label: "FREE FIRE",
    game_type: "Free Fire",
    modes: [
      { label: "BR Match",    mode: "BR Match",    img: freefireBanner },
      { label: "Clash Squad", mode: "Clash Squad", img: freefireAction },
      { label: "Lone Wolf",   mode: "Lone Wolf",   img: freefireThumb },
      { label: "CS 1v1",      mode: "CS 1v1",      img: freefireAction },
      { label: "CS 1v2",      mode: "CS 1v2",      img: freefireThumb },
      { label: "CS 1v3",      mode: "CS 1v3",      img: freefireBanner },
      { label: "CS 1v4",      mode: "CS 1v4",      img: freefireAction },
    ],
  },
  {
    label: "PUBG MOBILE",
    game_type: "PUBG",
    modes: [
      { label: "BR Match",    mode: "BR Match",    img: pubgBanner },
      { label: "Arena TDM",   mode: "Arena TDM",   img: pubgAction },
      { label: "1v1",         mode: "1v1",         img: pubgThumb },
      { label: "2v2",         mode: "2v2",         img: pubgAction },
    ],
  },
  {
    label: "LUDO",
    game_type: "Ludo",
    modes: [
      { label: "Classic 1v1", mode: "Classic 1v1", img: ludoBanner },
      { label: "Classic 2v2", mode: "Classic 2v2", img: ludoAction },
      { label: "Quick 1v1",   mode: "Quick 1v1",   img: ludoThumb },
    ],
  },
];

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Started"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

const TournamentCard = ({
  tournament, index, joining, hasJoined, onJoin, onViewRoom, roomLoading, wallet, onRules, onLiveStream, onNavigate,
}: {
  tournament: Tournament;
  index: number;
  joining: string | null;
  hasJoined: (id: string) => boolean;
  onJoin: (t: Tournament, useCredits: boolean) => void;
  onViewRoom: (id: string) => void;
  roomLoading: boolean;
  wallet: any;
  onRules: (t: Tournament) => void;
  onLiveStream: (t: Tournament) => void;
  onNavigate: (id: string) => void;
}) => {
  const countdown = useCountdown(tournament.starts_at);
  const joined = hasJoined(tournament.id);
  const isJoining = joining === tournament.id;
  const gameImage = getGameImage(tournament.game_type);

  const maxSpots = tournament.max_participants || 48;
  const filled = tournament.current_participants || 0;
  const spotsLeft = maxSpots - filled;
  const fillPct = Math.min((filled / maxSpots) * 100, 100);

  const canPayWithCredits = tournament.entry_fee_type !== "cash" && (wallet?.credits || 0) >= tournament.entry_fee;
  const canPayWithCash = tournament.entry_fee_type !== "credits" && (wallet?.cash || 0) >= tournament.entry_fee;

  const perKill = tournament.per_kill ?? 0;
  const matchType = tournament.match_type ?? "Solo";
  const map = tournament.map ?? "—";
  const perspective = tournament.perspective ?? "TPP";
  const tournamentNo = tournament.tournament_no ?? String(index + 1).padStart(5, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden border border-neon-blue/20 bg-background/80 backdrop-blur-xl shadow-[0_0_30px_-10px_hsl(var(--neon-blue)/0.15)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 relative cursor-pointer" onClick={() => onNavigate(tournament.id)}>
        <img
          src={gameImage.thumb}
          alt={tournament.game_type}
          className="w-12 h-12 rounded-xl object-cover border border-neon-blue/30 shadow-[0_0_10px_hsl(var(--neon-blue)/0.2)]"
        />
        <div className="flex-1 pr-16">
          <p className="font-display font-bold text-foreground text-base leading-tight hover:text-primary transition-colors">{tournament.title}</p>
          <p className="text-xs text-primary font-medium mt-0.5">
            {format(new Date(tournament.starts_at), "yyyy-MM-dd hh:mm aa")}
          </p>
        </div>
        <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-md shadow-[0_0_10px_hsl(var(--primary)/0.3)]">
          #{tournamentNo}
        </span>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2">
        {[
          { label: "WIN PRIZE", value: `${tournament.entry_fee_type === "cash" ? "৳" : ""}${tournament.prize_pool}` },
          { label: "PER KILL",  value: String(perKill) },
          { label: "ENTRY FEE", value: `${tournament.entry_fee_type === "cash" ? "৳" : ""}${tournament.entry_fee}${tournament.entry_fee_type === "credits" ? " Cr" : ""}` },
        ].map((item) => (
          <div key={item.label} className="glass rounded-xl py-3 text-center border border-neon-blue/10">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">{item.label}</p>
            <p className="font-display font-bold text-foreground text-base">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Match Meta */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3 text-center">
        {[matchType, map, perspective].map((v) => (
          <p key={v} className="text-xs text-muted-foreground font-medium glass rounded-lg py-1.5">{v}</p>
        ))}
      </div>

      {/* Spots Progress */}
      <div className="px-4 pb-3">
        <div className="w-full bg-muted/30 rounded-full h-1.5 mb-2 overflow-hidden">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-primary to-neon-blue"
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {spotsLeft > 0 ? `Only ${spotsLeft} spots left` : "Full"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filled}/{maxSpots}</span>
            {joined ? (
              <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                <CheckCircle className="w-3 h-3" /> Joined
              </span>
            ) : (
              <div className="flex gap-2">
                {tournament.entry_fee_type !== "cash" && (
                  <button
                    onClick={() => onJoin(tournament, true)}
                    disabled={isJoining || !canPayWithCredits}
                    className="bg-primary hover:bg-primary/80 disabled:opacity-40 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                  >
                    {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : "JOIN NOW"}
                  </button>
                )}
                {tournament.entry_fee_type !== "credits" && (
                  <button
                    onClick={() => onJoin(tournament, false)}
                    disabled={isJoining || !canPayWithCash}
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : `PAY ৳${tournament.entry_fee}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Details, Rules & Prize Pool */}
      <div className="grid grid-cols-3 border-t border-neon-blue/10">
        <button
          onClick={() => joined && onViewRoom(tournament.id)}
          disabled={roomLoading || !joined}
          className="flex items-center justify-center gap-1.5 py-3 text-xs text-neon-blue hover:bg-neon-blue/5 disabled:opacity-40 transition border-r border-neon-blue/10"
        >
          {roomLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          Room
        </button>
        <button
          onClick={() => onRules(tournament)}
          className="flex items-center justify-center gap-1.5 py-3 text-xs text-primary hover:bg-primary/5 transition border-r border-neon-blue/10"
        >
          <Shield className="w-3.5 h-3.5" /> Rules
        </button>
        <button className="flex items-center justify-center gap-1.5 py-3 text-xs text-accent hover:bg-accent/5 transition">
          <Trophy className="w-3.5 h-3.5" /> Prizes
        </button>
      </div>

      {/* Countdown / Live Banner */}
      <div
        onClick={() => {
          if (tournament.status === "live" && tournament.live_url) {
            onLiveStream(tournament);
          }
        }}
        className={`flex items-center justify-center gap-2 py-2.5 ${
          tournament.status === "live"
            ? "bg-gradient-to-r from-neon-blue/90 to-primary/90 cursor-pointer relative overflow-hidden"
            : "bg-gradient-to-r from-primary/90 to-neon-blue/90"
        }`}
      >
        {tournament.status === "live" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            <div className="absolute inset-0 border border-neon-blue/50 animate-pulse rounded-b-2xl" />
          </>
        )}
        <Clock className={`w-4 h-4 ${tournament.status === "live" ? "text-white" : "text-primary-foreground"}`} />
        <span className={`font-bold text-sm tracking-wider ${tournament.status === "live" ? "text-white" : "text-primary-foreground"}`}>
          {tournament.status === "live" ? "🔴 LIVE NOW — TAP TO WATCH" : `STARTS IN ${countdown}`}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TournamentsPage = () => {
  const { user } = useAuth();
  const { profile, wallet, refreshWallet } = useProfile();
  const { tournaments, loading, joining, joinTournament, hasJoined } = useTournaments(
    profile?.id, wallet?.credits || 0, wallet?.cash || 0
  );
  const [roomInfo, setRoomInfo] = useState<{
    room_id: string | null; room_password: string | null; message?: string;
  } | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [selected, setSelected] = useState<{ game_type: string; mode: string; label: string } | null>(null);
  const [liveStream, setLiveStream] = useState<Tournament | null>(null);
  // Join modal state
  const [joinModal, setJoinModal] = useState<{
    tournament: Tournament; useCredits: boolean;
  } | null>(null);

  // Rules popup state
  const [rulesPopup, setRulesPopup] = useState<Tournament | null>(null);

  const handleJoinClick = (tournament: Tournament, useCredits: boolean) => {
    setJoinModal({ tournament, useCredits });
  };

  const handleJoinConfirm = async (gameId: string, gameName: string) => {
    if (!joinModal) return;
    await joinTournament(joinModal.tournament, joinModal.useCredits, gameId, gameName);
    await refreshWallet();
    setJoinModal(null);
  };

  const viewRoomInfo = async (tournamentId: string) => {
    if (!user) return;
    setRoomLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-room-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ firebaseUid: user.uid, tournamentId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoomInfo(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get room info");
    } finally {
      setRoomLoading(false);
    }
  };

  const modeCount = (game_type: string, mode: string) =>
    tournaments.filter(
      (t) =>
        t.game_type?.toLowerCase() === game_type.toLowerCase() &&
        t.mode?.toLowerCase() === mode.toLowerCase()
    ).length;

  const filteredTournaments = selected
    ? tournaments.filter(
        (t) =>
          t.game_type?.toLowerCase() === selected.game_type.toLowerCase() &&
          t.mode?.toLowerCase() === selected.mode.toLowerCase()
      )
    : [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Tournaments" description="Join Free Fire, PUBG & Ludo tournaments on Billo Battle Zone." />
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display font-bold text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-accent" /> Tournaments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Join tournaments and win cash prizes!</p>
        </motion.div>

        {/* Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 flex items-center gap-3 border border-neon-blue/10">
            <Coins className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="font-display font-bold text-xl text-primary">{wallet?.credits?.toFixed(0) || "0"}</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3 border border-neon-blue/10">
            <Banknote className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="font-display font-bold text-xl text-green-400">৳{wallet?.cash?.toFixed(0) || "0"}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="mode-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Loading tournaments...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {GAME_SECTIONS.map((section) => (
                    <div key={section.game_type}>
                      <h2 className="font-display font-bold text-lg text-center tracking-widest mb-4 neon-text">
                        {section.label}
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {section.modes.map((m) => {
                          const count = modeCount(section.game_type, m.mode);
                          return (
                            <motion.div
                              key={m.mode}
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ scale: 1.02 }}
                              className="relative rounded-xl overflow-hidden cursor-pointer group h-32 border border-neon-blue/20 shadow-[0_0_15px_-5px_hsl(var(--neon-blue)/0.15)]"
                              onClick={() => setSelected({ game_type: section.game_type, mode: m.mode, label: m.label })}
                            >
                              <img src={m.img} alt={m.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3">
                                <p className="font-display font-bold text-foreground text-sm">{m.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {count > 0 ? (
                                    <span className="text-primary font-semibold">{count} matches live</span>
                                  ) : (
                                    "No matches yet"
                                  )}
                                </p>
                              </div>
                              {count > 0 && (
                                <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md animate-pulse-neon">
                                  {count}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-primary mb-4 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Modes
              </button>

              <div className="flex items-center gap-3 mb-5 glass rounded-xl p-3 border border-neon-blue/10">
                <img src={getGameImage(selected.game_type).thumb} alt="" className="w-12 h-12 rounded-xl object-cover border border-neon-blue/20" />
                <div>
                  <p className="text-xs text-muted-foreground">{selected.game_type}</p>
                  <h2 className="font-display font-bold text-xl text-foreground">{selected.label.toUpperCase()}</h2>
                </div>
                <span className="ml-auto text-sm font-bold text-primary">{filteredTournaments.length} matches</span>
              </div>

              {filteredTournaments.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center border border-neon-blue/10">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No tournaments available for this mode right now</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back later or try another mode</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTournaments.map((t, i) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      index={i}
                      joining={joining}
                      hasJoined={hasJoined}
                      onJoin={handleJoinClick}
                      onViewRoom={viewRoomInfo}
                      roomLoading={roomLoading}
                      wallet={wallet}
                      onRules={setRulesPopup}
                      onLiveStream={setLiveStream}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AdSlot slot="tournaments-mid" format="horizontal" />
      </main>

      {/* Join Modal */}
      {joinModal && (
        <JoinTournamentModal
          open={!!joinModal}
          onClose={() => setJoinModal(null)}
          onConfirm={handleJoinConfirm}
          tournamentTitle={joinModal.tournament.title}
          entryFee={joinModal.tournament.entry_fee}
          feeType={joinModal.tournament.entry_fee_type}
          useCredits={joinModal.useCredits}
          loading={joining === joinModal.tournament.id}
        />
      )}

      {/* Rules Popup */}
      <RulesPopup
        open={!!rulesPopup}
        onClose={() => setRulesPopup(null)}
        gameType={rulesPopup?.game_type || ""}
        rules={rulesPopup?.rules}
      />

      {/* Room Info Dialog */}
      <Dialog open={!!roomInfo} onOpenChange={() => setRoomInfo(null)}>
        <DialogContent className="border-neon-blue/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Room Information
            </DialogTitle>
            <DialogDescription>Only you (joined player) can see this</DialogDescription>
          </DialogHeader>
          {roomInfo?.message ? (
            <div className="glass rounded-xl p-6 text-center border border-neon-blue/10">
              <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">{roomInfo.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 border border-neon-blue/10">
                <p className="text-xs text-muted-foreground mb-1">Room / Custom ID</p>
                <p className="font-display font-bold text-xl text-primary select-all">
                  {roomInfo?.room_id || "Not set yet"}
                </p>
              </div>
              <div className="glass rounded-xl p-4 border border-neon-blue/10">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="font-display font-bold text-xl text-primary select-all">
                  {roomInfo?.room_password || "Not set yet"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Stream Dialog */}
      <Dialog open={!!liveStream} onOpenChange={() => setLiveStream(null)}>
        <DialogContent className="max-w-3xl border-neon-blue/30 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-neon-blue">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              LIVE — {liveStream?.title}
            </DialogTitle>
            <DialogDescription>Watch the tournament live stream</DialogDescription>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {liveStream?.live_url ? (
              <iframe
                src={liveStream.live_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Live stream not available yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentsPage;
