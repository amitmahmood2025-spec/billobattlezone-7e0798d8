import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useTasks, Task } from "@/hooks/useTasks";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Lock, Loader2, Gift, Sparkles, ExternalLink, Timer, ChevronDown, ChevronUp } from "lucide-react";
import SpinWheel from "@/components/tasks/SpinWheel";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TaskStep {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  step_url: string | null;
  verification_seconds: number;
  reward_credits: number;
  sort_order: number;
}

const TasksPage = () => {
  const { user } = useAuth();
  const { profile, wallet, refreshWallet } = useProfile();
  const { tasks, userTasks, claiming, claimTask, canClaimTask, getTasksByType, refreshTasks } = useTasks(profile?.id);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [linkTimers, setLinkTimers] = useState<Record<string, number>>({});
  const [linkActive, setLinkActive] = useState<Record<string, boolean>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [stepTimers, setStepTimers] = useState<Record<string, number>>({});
  const [stepActive, setStepActive] = useState<Record<string, boolean>>({});
  const [claimingStep, setClaimingStep] = useState<string | null>(null);

  // Fetch task steps for special tasks
  const fetchSteps = useCallback(async (taskId: string) => {
    const { data } = await supabase
      .from("task_steps")
      .select("*")
      .eq("task_id", taskId)
      .order("sort_order", { ascending: true });
    if (data) {
      setTaskSteps((prev) => ({ ...prev, [taskId]: data as TaskStep[] }));
    }
  }, []);

  // Fetch completed steps for user
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("user_task_steps")
      .select("task_step_id")
      .eq("profile_id", profile.id)
      .then(({ data }) => {
        if (data) {
          setCompletedSteps(new Set(data.map((d) => d.task_step_id)));
        }
      });
  }, [profile?.id]);

  // Start link verification timer for regular tasks
  const startLinkTimer = (taskId: string, url: string, seconds: number) => {
    window.open(url, "_blank");
    setLinkActive((prev) => ({ ...prev, [taskId]: true }));
    setLinkTimers((prev) => ({ ...prev, [taskId]: seconds }));

    const interval = setInterval(() => {
      setLinkTimers((prev) => {
        const remaining = (prev[taskId] || 0) - 1;
        if (remaining <= 0) {
          clearInterval(interval);
          setLinkActive((prev2) => ({ ...prev2, [taskId]: false }));
          return { ...prev, [taskId]: 0 };
        }
        return { ...prev, [taskId]: remaining };
      });
    }, 1000);
  };

  // Start step timer
  const startStepTimer = (stepId: string, url: string, seconds: number) => {
    window.open(url, "_blank");
    setStepActive((prev) => ({ ...prev, [stepId]: true }));
    setStepTimers((prev) => ({ ...prev, [stepId]: seconds }));

    const interval = setInterval(() => {
      setStepTimers((prev) => {
        const remaining = (prev[stepId] || 0) - 1;
        if (remaining <= 0) {
          clearInterval(interval);
          setStepActive((prev2) => ({ ...prev2, [stepId]: false }));
          return { ...prev, [stepId]: 0 };
        }
        return { ...prev, [stepId]: remaining };
      });
    }, 1000);
  };

  const handleClaimStep = async (step: TaskStep) => {
    if (!user || !profile) return;
    setClaimingStep(step.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            taskStepId: step.id,
            isStepClaim: true,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed");
      toast.success(`+${result.creditsEarned} Credits!`);
      setCompletedSteps((prev) => new Set([...prev, step.id]));
      await refreshWallet();
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim");
    } finally {
      setClaimingStep(null);
    }
  };

  const handleClaimTask = async (task: Task) => {
    if (task.title.toLowerCase().includes("spin")) {
      setShowSpinWheel(true);
      return;
    }

    // If task has a URL and verification_seconds > 0, start timer first
    if ((task as any).task_url && (task as any).verification_seconds > 0) {
      const timer = linkTimers[task.id];
      if (timer === undefined || timer > 0) {
        // Timer not started or still running - start/continue
        if (!linkActive[task.id]) {
          startLinkTimer(task.id, (task as any).task_url, (task as any).verification_seconds);
        }
        return;
      }
    }

    try {
      await claimTask(task.id);
      await refreshWallet();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      // Error already handled
    }
  };

  const renderTaskCard = (task: Task) => {
    const userTask = userTasks[task.id];
    const isClaimed = userTask?.is_claimed;
    const canClaim = canClaimTask(task);
    const isClaiming = claiming === task.id;
    const hasUrl = !!(task as any).task_url;
    const verifySeconds = (task as any).verification_seconds || 0;
    const timerValue = linkTimers[task.id];
    const isTimerRunning = linkActive[task.id];
    const timerDone = timerValue === 0 && !isTimerRunning && hasUrl && verifySeconds > 0;
    const isSpecialWithSteps = task.task_type === "special";
    const isLoginTask = task.title.toLowerCase().includes("login") || task.title.toLowerCase().includes("daily check");
    const steps = taskSteps[task.id] || [];

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-4 transition-all ${canClaim && !isClaimed ? "glow-border" : ""}`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">{task.icon || "🎯"}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">{task.title}</h3>
              <div className="flex items-center gap-1 text-primary font-bold">
                <Sparkles className="w-4 h-4" />
                {task.reward_credits}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground capitalize">
                {task.reset_type === "never" ? "One-time" : task.reset_type}
              </span>

              {isClaimed && task.reset_type === "never" ? (
                <div className="flex items-center gap-1 text-neon-green text-sm">
                  <CheckCircle className="w-4 h-4" /> Claimed
                </div>
              ) : !canClaim ? (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Lock className="w-4 h-4" /> Claimed Today
                </div>
              ) : isSpecialWithSteps ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (expandedTask === task.id) {
                      setExpandedTask(null);
                    } else {
                      setExpandedTask(task.id);
                      if (!taskSteps[task.id]) fetchSteps(task.id);
                    }
                  }}
                >
                  {expandedTask === task.id ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  Steps
                </Button>
              ) : hasUrl && verifySeconds > 0 ? (
                isTimerRunning ? (
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <Timer className="w-4 h-4 animate-pulse" />
                    <span className="font-display font-bold">{timerValue}s</span>
                  </div>
                ) : timerDone ? (
                  <Button size="sm" onClick={() => handleClaimTask(task)} disabled={isClaiming} className="shadow-neon">
                    {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 mr-1" /> Claim</>}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleClaimTask(task)}>
                    <ExternalLink className="w-4 h-4 mr-1" /> Visit & Earn
                  </Button>
                )
              ) : (
                <Button size="sm" onClick={() => handleClaimTask(task)} disabled={isClaiming} className="shadow-neon">
                  {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 mr-1" /> {isLoginTask ? "Check In" : "Claim"}</>}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Steps for Special Tasks */}
        <AnimatePresence>
          {expandedTask === task.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                {steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No steps added yet</p>
                ) : (
                  steps.map((step, idx) => {
                    const isStepDone = completedSteps.has(step.id);
                    const stepTimerVal = stepTimers[step.id];
                    const isStepTimerRunning = stepActive[step.id];
                    const stepTimerDone = stepTimerVal === 0 && !isStepTimerRunning && step.step_url;

                    return (
                      <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStepDone ? "bg-neon-green/20 text-neon-green" : "bg-primary/20 text-primary"}`}>
                          {isStepDone ? "✓" : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{step.title}</p>
                          {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                        </div>
                        <span className="text-xs text-primary font-bold">+{step.reward_credits}</span>
                        {isStepDone ? (
                          <CheckCircle className="w-4 h-4 text-neon-green" />
                        ) : isStepTimerRunning ? (
                          <div className="flex items-center gap-1 text-primary text-xs">
                            <Timer className="w-3 h-3 animate-pulse" /> {stepTimerVal}s
                          </div>
                        ) : stepTimerDone ? (
                          <Button size="sm" className="h-7 text-xs" disabled={claimingStep === step.id} onClick={() => handleClaimStep(step)}>
                            {claimingStep === step.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Claim"}
                          </Button>
                        ) : step.step_url ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startStepTimer(step.id, step.step_url!, step.verification_seconds || 10)}>
                            <ExternalLink className="w-3 h-3 mr-1" /> Visit
                          </Button>
                        ) : (
                          <Button size="sm" className="h-7 text-xs" disabled={claimingStep === step.id} onClick={() => handleClaimStep(step)}>
                            {claimingStep === step.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Claim"}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display font-bold text-2xl">Daily Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete tasks to earn free credits!</p>
        </motion.div>

        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Your Credits</p>
            <p className="font-display font-bold text-2xl text-primary">{wallet?.credits?.toFixed(0) || "0"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="font-display font-bold text-lg text-foreground">{wallet?.total_earned?.toFixed(0) || "0"}</p>
          </div>
        </motion.div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full grid grid-cols-3 glass">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="achievement">Achievements</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          {(["daily", "achievement", "special"] as const).map((type) => (
            <TabsContent key={type} value={type} className="space-y-3 mt-4">
              {getTasksByType(type).map(renderTaskCard)}
              {getTasksByType(type).length === 0 && (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">No {type} tasks available</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <AnimatePresence>
        {showSpinWheel && (
          <SpinWheel onClose={() => { setShowSpinWheel(false); refreshWallet(); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
