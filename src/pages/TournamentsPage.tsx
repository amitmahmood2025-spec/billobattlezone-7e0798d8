import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTournaments, Tournament } from "@/hooks/useTournaments";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { getGameImage } from "@/lib/gameImages";
import {
  Trophy, Clock, Loader2, Coins, Banknote, CheckCircle, Lock, Eye, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ─── Game & Mode Config ───────────────────────────────────────────────────────

const GAME_SECTIONS = [
  {
    label: "FREE FIRE",
    game_type: "Free Fire",
    modes: [
      { label: "BR Match",    mode: "BR Match",    img: "https://i.imgur.com/8rMHOdJ.jpg" },
      { label: "Clash Squad", mode: "Clash Squad", img: "https://i.imgur.com/Mv0QBMV.jpg" },
      { label: "Lone Wolf",   mode: "Lone Wolf",   img: "https://i.imgur.com/oCO2pj9.jpg" },
      { label: "CS 1v1 2v2",  mode: "1v1",         img: "https://i.imgur.com/3kNvPdU.jpg" },
    ],
  },
  {
    label: "PUBG",
    game_type: "PUBG",
    modes: [
      { label: "BR Match",    mode: "BR Match",    img: "https://i.imgur.com/8rMHOdJ.jpg" },
      { label: "Clash Squad", mode: "Clash Squad", img: "https://i.imgur.com/Mv0QBMV.jpg" },
      { label: "Lone Wolf",   mode: "Lone Wolf",   img: "https://i.imgur.com/oCO2pj9.jpg" },
      { label: "1v1 / 2v2",   mode: "1v1",         img: "https://i.imgur.com/3kNvPdU.jpg" },
    ],
  },
  {
    label: "LUDO AND FREE MATCH",
    game_type: "Ludo",
    modes: [
      { label: "Ludo Match",  mode: "Ludo Match",  img: "https://i.imgur.com/qKkFJfj.jpg" },
      { label: "Free Match",  mode: "Free Match",  img: "https://i.imgur.com/Q3zKh8R.jpg" },
    ],
  },
];

// ─── Countdown Hook ───────────────────────────────────────────────────────────

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
  tournament, index, joining, hasJoined, onJoin, onViewRoom, roomLoading, wallet,
}: {
  tournament: Tournament;
  index: number;
  joining: string | null;
  hasJoined: (id: string) => boolean;
  onJoin: (t: Tournament, useCredits: boolean) => void;
  onViewRoom: (id: string) => void;
  roomLoading: boolean;
  wallet: any;
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

  // Optional extra fields — add these columns to your Supabase tournaments table
  const perKill     = (tournament as any).per_kill     ?? "—";
  const matchType   = (tournament as any).match_type   ?? "Solo";
  const map         = (tournament as any).map          ?? "Bermuda";
  const perspective = (tournament as any).perspective  ?? "TPP";
  const tournamentNo = (tournament as any).tournament_no
    ?? String(index + 1).padStart(5, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden border border-white/10 bg-[#0f1923]"
    >
      {/* Top Row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 relative">
        <img
          src={gameImage.thumb}
          alt={tournament.game_type}
          className="w-12 h-12 rounded-xl object-cover border border-white/10"
        />
        <div className="flex-1 pr-16">
          <p className="font-display font-bold text-white text-base leading-tight">{tournament.title}</p>
          <p className="text-xs text-orange-400 font-medium mt-0.5">
            {format(new Date(tournament.starts_at), "yyyy-MM-dd hh:mm aa")}
          </p>
        </div>
        <span className="absolute top-3 right-3 text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
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
          <div key={item.label} className="bg-[#1a2535] rounded-xl py-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">{item.label}</p>
            <p className="font-display font-bold text-white text-base">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Match Meta */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3 text-center">
        {[matchType, map, perspective].map((v) => (
          <p key={v} className="text-xs text-gray-400 font-medium">{v}</p>
        ))}
      </div>

      {/* Progress + Join */}
      <div className="px-4 pb-3">
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
          <div
            className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Only {spotsLeft} spots left</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filled}/{maxSpots}</span>
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
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : "JOIN NOW"}
                  </button>
                )}
                {tournament.entry_fee_type !== "credits" && (
                  <button
                    onClick={() => onJoin(tournament, false)}
                    disabled={isJoining || !canPayWithCash}
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : `PAY ৳${tournament.entry_fee}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Details & Prize Pool */}
      <div className="grid grid-cols-2 border-t border-white/10">
        <button
          onClick={() => joined && onViewRoom(tournament.id)}
          disabled={roomLoading || !joined}
          className="flex items-center justify-center gap-2 py-3 text-sm text-blue-400 hover:bg-white/5 disabled:opacity-40 transition border-r border-white/10"
        >
          {roomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Room Details
        </button>
        <button className="flex items-center justify-center gap-2 py-3 text-sm text-yellow-400 hover:bg-white/5 transition">
          <Trophy className="w-4 h-4" /> Prize Pool
        </button>
      </div>

      {/* Countdown Banner */}
      <div className="bg-green-500 flex items-center justify-center gap-2 py-2.5">
        <Clock className="w-4 h-4 text-white" />
        <span className="text-white font-bold text-sm tracking-wider">
          {tournament.status === "live" ? "🔴 LIVE NOW" : `STARTS IN ${countdown}`}
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

  const handleJoin = async (tournament: Tournament, useCredits: boolean) => {
    await joinTournament(tournament, useCredits);
    await refreshWallet();
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
        t.game_type?.toLowerCase().includes(game_type.toLowerCase()) &&
        (t.mode?.toLowerCase().includes(mode.toLowerCase()) ||
          t.title?.toLowerCase().includes(mode.toLowerCase()))
    ).length;

  const filteredTournaments = selected
    ? tournaments.filter(
        (t) =>
          t.game_type?.toLowerCase().includes(selected.game_type.toLowerCase()) &&
          (t.mode?.toLowerCase().includes(selected.mode.toLowerCase()) ||
            t.title?.toLowerCase().includes(selected.mode.toLowerCase()))
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
            <Trophy className="w-6 h-6 text-yellow-400" /> Tournaments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Join tournaments and win cash prizes!</p>
        </motion.div>

        {/* Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <Coins className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="font-display font-bold text-xl text-primary">{wallet?.credits?.toFixed(0) || "0"}</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <Banknote className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="font-display font-bold text-xl text-green-400">৳{wallet?.cash?.toFixed(0) || "0"}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            /* ── Mode Selection ── */
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
                      <h2 className="font-display font-bold text-lg text-center tracking-widest mb-4">
                        {section.label}
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {section.modes.map((m) => (
                          <motion.div
                            key={m.mode}
                            whileTap={{ scale: 0.97 }}
                            className="relative rounded-xl overflow-hidden cursor-pointer group h-32"
                            onClick={() => setSelected({ game_type: section.game_type, mode: m.mode, label: m.label })}
                          >
                            <img src={m.img} alt={m.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-2 left-3">
                              <p className="font-display font-bold text-white text-sm">{m.label}</p>
                              <p className="text-xs text-gray-300">{modeCount(section.game_type, m.mode)} matches found</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Tournament List ── */
            <motion.div key="list" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-primary mb-4 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3 mb-5">
                <img src={getGameImage(selected.game_type).thumb} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className="text-xs text-muted-foreground">Mode</p>
                  <h2 className="font-display font-bold text-xl">{selected.label.toUpperCase()}</h2>
                </div>
              </div>

              {filteredTournaments.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tournaments available for this mode right now</p>
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
                      onJoin={handleJoin}
                      onViewRoom={viewRoomInfo}
                      roomLoading={roomLoading}
                      wallet={wallet}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AdSlot slot="tournaments-mid" format="horizontal" />
      </main>

      {/* Room Info Dialog */}
      <Dialog open={!!roomInfo} onOpenChange={() => setRoomInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Room Information
            </DialogTitle>
            <DialogDescription>Only you (joined player) can see this</DialogDescription>
          </DialogHeader>
          {roomInfo?.message ? (
            <div className="glass rounded-xl p-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">{roomInfo.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Room / Custom ID</p>
                <p className="font-display font-bold text-xl text-primary select-all">
                  {roomInfo?.room_id || "Not set yet"}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="font-display font-bold text-xl text-primary select-all">
                  {roomInfo?.room_password || "Not set yet"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentsPage;
      
