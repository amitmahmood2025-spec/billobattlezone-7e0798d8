import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Timer, CheckCircle, Loader2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SpinMissionsProps {
  onClose: () => void;
}

interface MiniMission {
  id: string;
  title: string;
  description: string | null;
  reward_credits: number;
  task_url: string | null;
  verification_seconds: number;
  icon: string | null;
}

const SpinMissions = ({ onClose }: SpinMissionsProps) => {
  const { user } = useAuth();
  const { profile, refreshWallet } = useProfile();
  const [missions, setMissions] = useState<MiniMission[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [timerActive, setTimerActive] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    // Fetch tasks that are spin missions (title contains [SPIN] or description contains [spin_mission])
    const { data } = await supabase
      .from("tasks")
      .select("id, title, description, reward_credits, task_url, verification_seconds, icon")
      .eq("is_active", true)
      .or("title.ilike.%[SPIN]%,description.ilike.%[spin_mission]%")
      .order("sort_order", { ascending: true });

    setMissions((data as MiniMission[]) || []);

    // Fetch completed
    if (profile?.id) {
      const today = new Date().toISOString().split("T")[0];
      const { data: claims } = await supabase
        .from("task_claims")
        .select("task_id")
        .eq("profile_id", profile.id)
        .gte("claimed_at", today + "T00:00:00");

      if (claims) {
        setCompletedIds(new Set(claims.map((c) => c.task_id)));
      }
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const startTimer = (missionId: string, url: string, seconds: number) => {
    window.open(url, "_blank");
    setTimerActive((p) => ({ ...p, [missionId]: true }));
    setTimers((p) => ({ ...p, [missionId]: seconds }));

    const interval = setInterval(() => {
      setTimers((p) => {
        const rem = (p[missionId] || 0) - 1;
        if (rem <= 0) {
          clearInterval(interval);
          setTimerActive((pa) => ({ ...pa, [missionId]: false }));
          return { ...p, [missionId]: 0 };
        }
        return { ...p, [missionId]: rem };
      });
    }, 1000);
  };

  const claimMission = async (mission: MiniMission) => {
    if (!user) return;
    setClaiming(mission.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ firebaseUid: user.uid, taskId: mission.id }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed");
      toast.success(`+${result.creditsEarned} Credits!`);
      setCompletedIds((p) => new Set([...p, mission.id]));
      await refreshWallet();
      confetti({ particleCount: 50, spread: 40, origin: { y: 0.7 } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim");
    } finally {
      setClaiming(null);
    }
  };

  const handleAction = (mission: MiniMission) => {
    if (mission.task_url && (mission.verification_seconds || 0) > 0) {
      const tv = timers[mission.id];
      const isActive = timerActive[mission.id];
      if (tv === undefined && !isActive) {
        startTimer(mission.id, mission.task_url, mission.verification_seconds || 10);
        return;
      }
      if (isActive) return; // still running
    }
    claimMission(mission);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="glass rounded-2xl p-5 w-full max-w-sm neon-border max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg text-primary">Earn More Credits</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Complete these quick missions to earn extra credits!
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No missions available right now</p>
              <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
            </div>
          ) : (
            missions.map((m) => {
              const done = completedIds.has(m.id);
              const tv = timers[m.id];
              const isActive = timerActive[m.id];
              const timerDone = tv === 0 && !isActive && m.task_url;

              return (
                <div
                  key={m.id}
                  className={`rounded-xl p-3 flex items-center gap-3 transition-all ${
                    done ? "bg-muted/20 opacity-60" : "bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  <span className="text-2xl">{m.icon || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.title.replace(/\[SPIN\]/gi, "").trim()}
                    </p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {m.description.replace(/\[spin_mission\]/gi, "").trim()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-primary font-bold whitespace-nowrap">+{m.reward_credits}</span>

                  {done ? (
                    <CheckCircle className="w-5 h-5 text-neon-green shrink-0" />
                  ) : isActive ? (
                    <div className="flex items-center gap-1 text-primary shrink-0">
                      <Timer className="w-4 h-4 animate-pulse" />
                      <span className="text-xs font-bold">{tv}s</span>
                    </div>
                  ) : timerDone || !m.task_url ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs shrink-0 shadow-neon"
                      disabled={claiming === m.id}
                      onClick={() => handleAction(m)}
                    >
                      {claiming === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Claim"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => handleAction(m)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Go
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SpinMissions;
