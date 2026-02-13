import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ListChecks, ChevronDown, ChevronUp } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward_credits: number;
  task_type: string;
  reset_type: string;
  max_claims_per_period: number | null;
  cooldown_hours: number | null;
  is_active: boolean;
  icon: string | null;
  sort_order: number | null;
  task_url: string | null;
  verification_seconds: number | null;
}

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

const emptyForm = {
  title: "", description: "", reward_credits: "10", task_type: "daily",
  reset_type: "daily", max_claims_per_period: "1", cooldown_hours: "24",
  icon: "🎯", sort_order: "0", task_url: "", verification_seconds: "0",
};

const emptyStep = { title: "", description: "", step_url: "", verification_seconds: "10", reward_credits: "5" };

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepForm, setStepForm] = useState(emptyStep);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepParentId, setStepParentId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("sort_order", { ascending: true });
    setTasks((data || []) as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const fetchSteps = async (taskId: string) => {
    const { data } = await supabase.from("task_steps").select("*").eq("task_id", taskId).order("sort_order", { ascending: true });
    setTaskSteps((prev) => ({ ...prev, [taskId]: (data || []) as TaskStep[] }));
  };

  const callAdmin = async (action: string, data: Record<string, unknown>) => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ firebaseUid: user?.uid, action, data }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed");
    return result;
  };

  const handleSubmit = async () => {
    if (!form.title) { toast.error("Title দিন"); return; }
    setActionLoading(true);
    try {
      const payload = {
        title: form.title, description: form.description || null,
        reward_credits: Number(form.reward_credits), task_type: form.task_type,
        reset_type: form.reset_type,
        max_claims_per_period: form.max_claims_per_period ? Number(form.max_claims_per_period) : 1,
        cooldown_hours: form.cooldown_hours ? Number(form.cooldown_hours) : 24,
        icon: form.icon || "🎯", sort_order: Number(form.sort_order) || 0,
        task_url: form.task_url || null,
        verification_seconds: Number(form.verification_seconds) || 0,
      };

      if (editingId) {
        await callAdmin("update_task", { taskId: editingId, updates: payload });
        toast.success("Task updated!");
      } else {
        await callAdmin("create_task", payload);
        toast.success("Task created!");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (t: Task) => {
    setEditingId(t.id);
    setForm({
      title: t.title, description: t.description || "",
      reward_credits: String(t.reward_credits), task_type: t.task_type,
      reset_type: t.reset_type,
      max_claims_per_period: String(t.max_claims_per_period || 1),
      cooldown_hours: String(t.cooldown_hours || 24),
      icon: t.icon || "🎯", sort_order: String(t.sort_order || 0),
      task_url: t.task_url || "", verification_seconds: String(t.verification_seconds || 0),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই task মুছে ফেলতে চান?")) return;
    setActionLoading(true);
    try {
      await callAdmin("delete_task", { taskId: id });
      toast.success("Task deleted");
      await fetchTasks();
    } catch {
      toast.error("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await callAdmin("update_task", { taskId: id, updates: { is_active: !currentActive } });
      toast.success(currentActive ? "Task deactivated" : "Task activated");
      await fetchTasks();
    } catch {
      toast.error("Update failed");
    }
  };

  // Step management - direct DB operations (service role handles via RLS)
  const handleStepSubmit = async () => {
    if (!stepForm.title || !stepParentId) return;
    setActionLoading(true);
    try {
      if (editingStepId) {
        await supabase.from("task_steps").update({
          title: stepForm.title, description: stepForm.description || null,
          step_url: stepForm.step_url || null,
          verification_seconds: Number(stepForm.verification_seconds) || 10,
          reward_credits: Number(stepForm.reward_credits) || 5,
        }).eq("id", editingStepId);
        toast.success("Step updated");
      } else {
        const steps = taskSteps[stepParentId] || [];
        await supabase.from("task_steps").insert({
          task_id: stepParentId, title: stepForm.title,
          description: stepForm.description || null,
          step_url: stepForm.step_url || null,
          verification_seconds: Number(stepForm.verification_seconds) || 10,
          reward_credits: Number(stepForm.reward_credits) || 5,
          sort_order: steps.length,
        });
        toast.success("Step added");
      }
      setShowStepForm(false);
      setStepForm(emptyStep);
      setEditingStepId(null);
      await fetchSteps(stepParentId);
    } catch {
      toast.error("Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteStep = async (stepId: string, taskId: string) => {
    if (!confirm("Delete this step?")) return;
    await supabase.from("task_steps").delete().eq("id", stepId);
    toast.success("Step deleted");
    await fetchSteps(taskId);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" /> Tasks ({tasks.length})
        </h3>
        <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No tasks yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id}>
              <div className={`glass rounded-xl p-4 flex items-center justify-between gap-3 ${!t.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{t.icon || "🎯"}</span>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{t.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t.reward_credits} credits • {t.task_type} • {t.reset_type}
                      {t.task_url && " • 🔗 Link"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {t.task_type === "special" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                      if (expandedTask === t.id) { setExpandedTask(null); } else {
                        setExpandedTask(t.id);
                        if (!taskSteps[t.id]) fetchSteps(t.id);
                      }
                    }}>
                      {expandedTask === t.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleActive(t.id, !!t.is_active)}>
                    {t.is_active ? "Off" : "On"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEdit(t)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Steps for special tasks */}
              {expandedTask === t.id && (
                <div className="ml-8 mt-2 space-y-1.5">
                  {(taskSteps[t.id] || []).map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 glass rounded-lg p-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{step.title}</span>
                        <span className="text-xs text-muted-foreground">{step.reward_credits} credits {step.step_url && "• 🔗"} {step.verification_seconds}s</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => {
                        setEditingStepId(step.id);
                        setStepParentId(t.id);
                        setStepForm({
                          title: step.title, description: step.description || "",
                          step_url: step.step_url || "",
                          verification_seconds: String(step.verification_seconds),
                          reward_credits: String(step.reward_credits),
                        });
                        setShowStepForm(true);
                      }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => deleteStep(step.id, t.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => {
                    setStepParentId(t.id);
                    setEditingStepId(null);
                    setStepForm(emptyStep);
                    setShowStepForm(true);
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Step
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Task</DialogTitle>
            <DialogDescription>Task details দিন</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Task Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Reward Credits" value={form.reward_credits} onChange={(e) => setForm({ ...form, reward_credits: e.target.value })} />
              <Input placeholder="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="special">Special (Multi-step)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.reset_type} onValueChange={(v) => setForm({ ...form, reset_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Link URL (optional)" value={form.task_url} onChange={(e) => setForm({ ...form, task_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Verify Seconds (0=instant)" value={form.verification_seconds} onChange={(e) => setForm({ ...form, verification_seconds: e.target.value })} />
              <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Max Claims/Period" value={form.max_claims_per_period} onChange={(e) => setForm({ ...form, max_claims_per_period: e.target.value })} />
              <Input type="number" placeholder="Cooldown Hours" value={form.cooldown_hours} onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Form Dialog */}
      <Dialog open={showStepForm} onOpenChange={setShowStepForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingStepId ? "Edit" : "Add"} Step</DialogTitle>
            <DialogDescription>Step details দিন</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Step Title *" value={stepForm.title} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} />
            <Input placeholder="Description" value={stepForm.description} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} />
            <Input placeholder="Link URL (optional)" value={stepForm.step_url} onChange={(e) => setStepForm({ ...stepForm, step_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Verify Seconds" value={stepForm.verification_seconds} onChange={(e) => setStepForm({ ...stepForm, verification_seconds: e.target.value })} />
              <Input type="number" placeholder="Reward Credits" value={stepForm.reward_credits} onChange={(e) => setStepForm({ ...stepForm, reward_credits: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepForm(false)}>Cancel</Button>
            <Button onClick={handleStepSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingStepId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManager;
