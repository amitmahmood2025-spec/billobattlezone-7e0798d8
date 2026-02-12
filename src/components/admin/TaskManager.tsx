import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ListChecks } from "lucide-react";

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
}

const emptyForm = {
  title: "", description: "", reward_credits: "10", task_type: "daily",
  reset_type: "daily", max_claims_per_period: "1", cooldown_hours: "24",
  icon: "🎯", sort_order: "0",
};

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks").select("*").order("sort_order", { ascending: true });
    setTasks((data || []) as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const callAdmin = async (action: string, data: Record<string, unknown>) => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
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
    } catch (err) {
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
            <div key={t.id} className={`glass rounded-xl p-4 flex items-center justify-between gap-3 ${!t.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{t.icon || "🎯"}</span>
                <div>
                  <h4 className="font-medium text-sm">{t.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t.reward_credits} credits • {t.task_type} • {t.reset_type}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleActive(t.id, !!t.is_active)}>
                  {t.is_active ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEdit(t)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
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
                  <SelectItem value="special">Special</SelectItem>
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
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Max Claims/Period" value={form.max_claims_per_period} onChange={(e) => setForm({ ...form, max_claims_per_period: e.target.value })} />
              <Input type="number" placeholder="Cooldown Hours" value={form.cooldown_hours} onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })} />
            </div>
            <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManager;
