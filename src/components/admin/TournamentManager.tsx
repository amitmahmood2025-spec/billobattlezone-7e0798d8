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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Users, Trophy, Loader2, Eye, Medal, Gamepad2,
} from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  id: string;
  title: string;
  game_type: string;
  description: string | null;
  entry_fee: number;
  entry_fee_type: string;
  prize_pool: number;
  max_participants: number | null;
  current_participants: number | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  rules: string | null;
  created_at: string;
}

interface TournamentEntry {
  id: string;
  profile_id: string;
  fee_paid: number;
  fee_type: string;
  placement: number | null;
  prize_won: number | null;
  joined_at: string;
  profiles: { username: string | null; email: string | null };
}

const emptyForm = {
  title: "", game_type: "", description: "", entry_fee: "0",
  entry_fee_type: "credits", prize_pool: "0", max_participants: "",
  starts_at: "", ends_at: "", rules: "",
};

const TournamentManager = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewEntries, setViewEntries] = useState<string | null>(null);
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const fetchTournaments = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments").select("*").order("created_at", { ascending: false });
    setTournaments((data || []) as Tournament[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

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
    if (!form.title || !form.game_type || !form.starts_at) {
      toast.error("Title, Game Type এবং Start Time দিন");
      return;
    }
    setActionLoading(true);
    try {
      if (editingId) {
        await callAdmin("update_tournament", {
          tournamentId: editingId,
          updates: {
            title: form.title, game_type: form.game_type,
            description: form.description || null,
            entry_fee: Number(form.entry_fee), entry_fee_type: form.entry_fee_type,
            prize_pool: Number(form.prize_pool),
            max_participants: form.max_participants ? Number(form.max_participants) : null,
            starts_at: new Date(form.starts_at).toISOString(),
            ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
            rules: form.rules || null,
          },
        });
        toast.success("Tournament updated!");
      } else {
        await callAdmin("create_tournament", {
          title: form.title, game_type: form.game_type,
          description: form.description || null,
          entry_fee: Number(form.entry_fee), entry_fee_type: form.entry_fee_type,
          prize_pool: Number(form.prize_pool),
          max_participants: form.max_participants ? Number(form.max_participants) : null,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          rules: form.rules || null,
        });
        toast.success("Tournament created!");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchTournaments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (t: Tournament) => {
    setEditingId(t.id);
    setForm({
      title: t.title, game_type: t.game_type, description: t.description || "",
      entry_fee: String(t.entry_fee), entry_fee_type: t.entry_fee_type,
      prize_pool: String(t.prize_pool),
      max_participants: t.max_participants ? String(t.max_participants) : "",
      starts_at: t.starts_at ? format(new Date(t.starts_at), "yyyy-MM-dd'T'HH:mm") : "",
      ends_at: t.ends_at ? format(new Date(t.ends_at), "yyyy-MM-dd'T'HH:mm") : "",
      rules: t.rules || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই tournament মুছে ফেলতে চান?")) return;
    setActionLoading(true);
    try {
      await callAdmin("delete_tournament", { tournamentId: id });
      toast.success("Tournament deleted");
      await fetchTournaments();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await callAdmin("update_tournament", { tournamentId: id, updates: { status } });
      toast.success(`Status: ${status}`);
      await fetchTournaments();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const loadEntries = async (tournamentId: string) => {
    setViewEntries(tournamentId);
    setEntriesLoading(true);
    try {
      const result = await callAdmin("get_tournament_entries", { tournamentId });
      setEntries(result.entries || []);
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setEntriesLoading(false);
    }
  };

  const updatePlacement = async (entryId: string, placement: number, prizeWon: number) => {
    try {
      await callAdmin("update_placement", { entryId, placement, prizeWon });
      toast.success("Placement updated & prize credited!");
      if (viewEntries) await loadEntries(viewEntries);
    } catch {
      toast.error("Update failed");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "live": return "text-green-400 bg-green-500/20";
      case "upcoming": return "text-primary bg-primary/20";
      case "completed": return "text-muted-foreground bg-muted/20";
      case "cancelled": return "text-red-400 bg-red-500/20";
      default: return "";
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Tournaments ({tournaments.length})
        </h3>
        <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Tournament
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No tournaments yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div key={t.id} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-display font-bold">{t.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.game_type}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor(t.status)}`}>
                  {t.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="glass rounded-lg p-2">
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-bold">{t.entry_fee} {t.entry_fee_type}</p>
                </div>
                <div className="glass rounded-lg p-2">
                  <p className="text-muted-foreground">Prize</p>
                  <p className="font-bold text-yellow-400">৳{t.prize_pool}</p>
                </div>
                <div className="glass rounded-lg p-2">
                  <p className="text-muted-foreground">Players</p>
                  <p className="font-bold">{t.current_participants || 0}{t.max_participants ? `/${t.max_participants}` : ""}</p>
                </div>
                <div className="glass rounded-lg p-2">
                  <p className="text-muted-foreground">Starts</p>
                  <p className="font-bold text-[10px]">{format(new Date(t.starts_at), "dd MMM HH:mm")}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEdit(t)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => loadEntries(t.id)}>
                  <Eye className="w-3 h-3 mr-1" /> Players
                </Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Tournament</DialogTitle>
            <DialogDescription>Tournament এর details দিন</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Tournament Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Game Type (e.g. Free Fire, PUBG) *" value={form.game_type} onChange={(e) => setForm({ ...form, game_type: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Entry Fee" value={form.entry_fee} onChange={(e) => setForm({ ...form, entry_fee: e.target.value })} />
              <Select value={form.entry_fee_type} onValueChange={(v) => setForm({ ...form, entry_fee_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credits">Credits</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Prize Pool (৳)" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} />
              <Input type="number" placeholder="Max Players (optional)" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Start Time *</label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End Time (optional)</label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <Input placeholder="Rules (optional)" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entries/Participants Dialog */}
      <Dialog open={!!viewEntries} onOpenChange={() => setViewEntries(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Participants & Scores
            </DialogTitle>
            <DialogDescription>Players who joined this tournament</DialogDescription>
          </DialogHeader>
          {entriesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No participants yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <EntryRow key={e.id} entry={e} onUpdate={updatePlacement} />
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EntryRow = ({
  entry,
  onUpdate,
}: {
  entry: TournamentEntry;
  onUpdate: (id: string, placement: number, prize: number) => void;
}) => {
  const [placement, setPlacement] = useState(String(entry.placement || ""));
  const [prize, setPrize] = useState(String(entry.prize_won || "0"));

  return (
    <TableRow>
      <TableCell className="font-medium">
        {entry.profiles?.username || entry.profiles?.email || "Unknown"}
      </TableCell>
      <TableCell>{entry.fee_paid} {entry.fee_type}</TableCell>
      <TableCell>
        <Input
          type="number" className="w-16 h-7 text-xs" placeholder="#"
          value={placement} onChange={(e) => setPlacement(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number" className="w-20 h-7 text-xs" placeholder="৳0"
          value={prize} onChange={(e) => setPrize(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Button size="sm" className="h-7 text-xs" onClick={() => onUpdate(entry.id, Number(placement), Number(prize))}>
          <Medal className="w-3 h-3 mr-1" /> Save
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TournamentManager;
