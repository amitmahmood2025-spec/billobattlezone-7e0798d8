import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  reward_credits: number;
  task_type: "daily" | "achievement" | "special";
  reset_type: "daily" | "weekly" | "never";
  max_claims_per_period: number | null;
  cooldown_hours: number | null;
  is_active: boolean;
  icon: string | null;
  sort_order: number | null;
}

export interface UserTask {
  id: string;
  profile_id: string;
  task_id: string;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  last_claimed_at: string | null;
  claims_today: number;
}

export const useTasks = (profileId: string | undefined) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Record<string, UserTask>>({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setTasks((tasksData || []) as Task[]);

      if (profileId) {
        const { data: userTasksData } = await supabase
          .from("user_tasks")
          .select("*")
          .eq("profile_id", profileId);

        const userTaskMap: Record<string, UserTask> = {};
        (userTasksData || []).forEach((ut) => {
          userTaskMap[ut.task_id] = ut as UserTask;
        });
        setUserTasks(userTaskMap);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const claimTask = async (taskId: string) => {
    if (!user) return;

    try {
      setClaiming(taskId);

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
            taskId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to claim task");
      }

      toast.success(`+${result.creditsEarned} Credits!`, {
        description: "Task reward claimed successfully",
      });

      // Refresh tasks
      await fetchTasks();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim";
      toast.error(message);
      throw err;
    } finally {
      setClaiming(null);
    }
  };

  const canClaimTask = (task: Task): boolean => {
    const userTask = userTasks[task.id];
    
    if (!userTask) return true; // Never claimed
    if (task.reset_type === "never" && userTask.is_claimed) return false;
    
    if (task.reset_type === "daily" && userTask.last_claimed_at) {
      const today = new Date().toISOString().split("T")[0];
      const lastClaimed = new Date(userTask.last_claimed_at).toISOString().split("T")[0];
      if (lastClaimed === today) return false;
    }

    return true;
  };

  const getTasksByType = (type: "daily" | "achievement" | "special") => {
    return tasks.filter((t) => t.task_type === type);
  };

  return {
    tasks,
    userTasks,
    loading,
    claiming,
    claimTask,
    canClaimTask,
    getTasksByType,
    refreshTasks: fetchTasks,
  };
};
