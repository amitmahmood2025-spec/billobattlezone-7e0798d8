import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useTasks, Task } from "@/hooks/useTasks";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Lock, Loader2, Gift, Sparkles } from "lucide-react";
import SpinWheel from "@/components/tasks/SpinWheel";
import confetti from "canvas-confetti";

const TasksPage = () => {
  const { profile, wallet, refreshWallet } = useProfile();
  const { tasks, userTasks, claiming, claimTask, canClaimTask, getTasksByType } = useTasks(
    profile?.id
  );
  const [showSpinWheel, setShowSpinWheel] = useState(false);

  const handleClaimTask = async (task: Task) => {
    if (task.title.toLowerCase().includes("spin")) {
      setShowSpinWheel(true);
      return;
    }

    try {
      await claimTask(task.id);
      await refreshWallet();
      
      // Celebration effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Error already handled in hook
    }
  };

  const renderTaskCard = (task: Task) => {
    const userTask = userTasks[task.id];
    const isClaimed = userTask?.is_claimed;
    const canClaim = canClaimTask(task);
    const isClaiming = claiming === task.id;

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-4 transition-all ${
          canClaim && !isClaimed ? "glow-border" : ""
        }`}
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
                <div className="flex items-center gap-1 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Claimed
                </div>
              ) : !canClaim ? (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Lock className="w-4 h-4" />
                  Claimed Today
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleClaimTask(task)}
                  disabled={isClaiming}
                  className="shadow-neon"
                >
                  {isClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-1" />
                      Claim
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display font-bold text-2xl">Daily Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete tasks to earn free credits!
          </p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-muted-foreground">Your Credits</p>
            <p className="font-display font-bold text-2xl text-primary">
              {wallet?.credits?.toFixed(0) || "0"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="font-display font-bold text-lg text-foreground">
              {wallet?.total_earned?.toFixed(0) || "0"}
            </p>
          </div>
        </motion.div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full grid grid-cols-3 glass">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="achievement">Achievements</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3 mt-4">
            {getTasksByType("daily").map(renderTaskCard)}
            {getTasksByType("daily").length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No daily tasks available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievement" className="space-y-3 mt-4">
            {getTasksByType("achievement").map(renderTaskCard)}
            {getTasksByType("achievement").length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No achievements available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="special" className="space-y-3 mt-4">
            {getTasksByType("special").map(renderTaskCard)}
            {getTasksByType("special").length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No special tasks available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Spin Wheel Modal */}
      <AnimatePresence>
        {showSpinWheel && (
          <SpinWheel
            onClose={() => {
              setShowSpinWheel(false);
              refreshWallet();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
