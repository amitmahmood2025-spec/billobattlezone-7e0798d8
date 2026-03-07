import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getGameImage } from "@/lib/gameImages";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SEO from "@/components/SEO";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Clock, Loader2, ArrowLeft, Users, Swords, Crown,
  Shield, Gamepad2, Hash, MapPin, Eye, Award,
} from "lucide-react";
import { format } from "date-fns";

interface TournamentFull {
  id: string;
  title: string;
  game_type: string;
  mode: string | null;
  description: string | null;
  entry_fee: number;
  entry_fee_type: string;
  prize_pool: number;
  max_participants: number | null;
  current_participants: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  rules: string | null;
  match_type: string | null;
  map: string | null;
  perspective: string | null;
  per_kill: number | null;
  tournament_no: number | null;
  live_url: string | null;
}

interface Participant {
  id: string;
  game_id: string | null;
  game_name: string | null;
  placement: number | null;
  kills: number | null;
  prize_won: number | null;
  joined_at: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

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

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentFull | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const countdown = useCountdown(tournament?.starts_at || new Date().toISOString());

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data: t } = await supabase.from("tournaments").select("*").eq("id", id).single();
      setTournament(t as TournamentFull | null);

      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*, profiles:profile_id(username, avatar_url)")
        .eq("tournament_id", id)
        .order("joined_at", { ascending: true });

      setParticipants(
        (entries || []).map((e: any) => ({
          id: e.id,
          game_id: e.game_id,
          game_name: e.game_name,
          placement: e.placement,
          kills: e.kills,
          prize_won: e.prize_won,
          joined_at: e.joined_at,
          profile: e.profiles,
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Tournament not found</p>
      </div>
    );
  }

  const gameImg = getGameImage(tournament.game_type);
  const maxSpots = tournament.max_participants || 48;
  const filled = tournament.current_participants || 0;
  const fillPct = Math.min((filled / maxSpots) * 100, 100);

  const statusColors: Record<string, string> = {
    upcoming: "bg-primary/90",
    live: "bg-red-500",
    completed: "bg-green-500",
    cancelled: "bg-muted",
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title={tournament.title} description={`Tournament details for ${tournament.title}`} />
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button onClick={() => navigate("/dashboard/tournaments")} className="flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Tournaments
        </button>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden h-44 sm:h-56"
        >
          <img src={gameImg.banner} alt={tournament.game_type} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <span className={`${statusColors[tournament.status] || "bg-muted"} text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase`}>
                  {tournament.status === "live" ? "🔴 LIVE" : tournament.status}
                </span>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground mt-1 neon-text">{tournament.title}</h1>
                <p className="text-sm text-muted-foreground">{tournament.mode || tournament.match_type || "Custom"}</p>
              </div>
              {tournament.tournament_no && (
                <span className="glass text-xs font-bold px-2.5 py-1 rounded-md text-primary">#{tournament.tournament_no}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "PRIZE POOL", value: `৳${tournament.prize_pool}`, icon: Trophy, color: "text-yellow-400" },
            { label: "ENTRY FEE", value: `${tournament.entry_fee}${tournament.entry_fee_type === "credits" ? " Cr" : " ৳"}`, icon: Award, color: "text-primary" },
            { label: "PER KILL", value: `৳${tournament.per_kill || 0}`, icon: Swords, color: "text-red-400" },
          ].map((item) => (
            <motion.div key={item.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-xl p-3.5 text-center border border-neon-blue/10">
              <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
              <p className="font-display font-bold text-lg text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Match Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border border-neon-blue/10">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Match Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Type", value: tournament.match_type || "Solo", icon: Gamepad2 },
              { label: "Map", value: tournament.map || "—", icon: MapPin },
              { label: "View", value: tournament.perspective || "TPP", icon: Eye },
              { label: "Mode", value: tournament.mode || "Classic", icon: Hash },
            ].map((d) => (
              <div key={d.label} className="glass rounded-lg py-2.5 px-2 border border-neon-blue/5">
                <d.icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="font-display font-bold text-foreground text-sm">{d.value}</p>
                <p className="text-[9px] text-muted-foreground uppercase">{d.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Countdown */}
        {tournament.status === "upcoming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4 text-center border border-primary/20"
          >
            <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Starts In</p>
            <p className="font-display font-bold text-xl text-primary tracking-widest">{countdown}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(new Date(tournament.starts_at), "EEEE, MMM d, yyyy 'at' hh:mm aa")}
            </p>
          </motion.div>
        )}

        {/* Spots Progress */}
        <div className="glass rounded-xl p-4 border border-neon-blue/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Slots
            </h2>
            <span className="text-xs font-bold text-primary">{filled}/{maxSpots}</span>
          </div>
          <Progress value={fillPct} className="h-2 mb-1" />
          <p className="text-[10px] text-muted-foreground">
            {maxSpots - filled > 0 ? `${maxSpots - filled} spots remaining` : "Tournament is full!"}
          </p>
        </div>

        {/* Participants List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Players Joined
            <span className="ml-auto text-sm font-bold text-primary">{participants.length}</span>
          </h2>

          {participants.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-neon-blue/10">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No players have joined yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-3.5 flex items-center gap-3 border border-neon-blue/10 hover:border-primary/30 transition-all"
                >
                  {/* Rank Number */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${
                    p.placement === 1 ? "bg-yellow-500/20 text-yellow-400" :
                    p.placement === 2 ? "bg-gray-400/20 text-gray-300" :
                    p.placement === 3 ? "bg-orange-500/20 text-orange-400" :
                    "bg-muted/30 text-muted-foreground"
                  }`}>
                    {p.placement ? (
                      p.placement <= 3 ? <Crown className="w-4 h-4" /> : `#${p.placement}`
                    ) : (
                      i + 1
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">
                      {(p.profile?.username || p.game_name || "P")[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.game_name || p.profile?.username || "Player"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ID: {p.game_id || "—"} • {format(new Date(p.joined_at), "MMM d, h:mm a")}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2.5 text-xs">
                    {p.kills !== null && p.kills > 0 && (
                      <span className="flex items-center gap-0.5 text-red-400 font-bold">
                        <Swords className="w-3 h-3" />{p.kills}
                      </span>
                    )}
                    {p.prize_won !== null && p.prize_won > 0 && (
                      <span className="text-green-400 font-bold">৳{p.prize_won}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Rules */}
        {tournament.rules && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border border-neon-blue/10">
            <h2 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Rules
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{tournament.rules}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TournamentDetail;
