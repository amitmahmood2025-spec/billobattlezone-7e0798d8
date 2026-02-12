import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Loader2, Users } from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { username: string | null; email: string | null };
}

const AdminManager = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const fetchAdmins = useCallback(async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (roles && roles.length > 0) {
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, email")
        .in("id", userIds);

      const profileMap: Record<string, { username: string | null; email: string | null }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = { username: p.username, email: p.email };
      });

      setAdmins(
        roles.map((r) => ({
          ...r,
          profile: profileMap[r.user_id],
        }))
      );
    } else {
      setAdmins([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

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

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error("Email বা Username দিন");
      return;
    }
    setActionLoading(true);
    try {
      await callAdmin("add_admin", { emailOrUsername: newAdminEmail.trim() });
      toast.success("Admin added!");
      setNewAdminEmail("");
      await fetchAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const removeAdmin = async (targetUserId: string) => {
    if (!confirm("এই admin কে remove করতে চান?")) return;
    setActionLoading(true);
    try {
      await callAdmin("remove_admin", { targetUserId });
      toast.success("Admin removed!");
      await fetchAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" /> Admin Management
      </h3>
      <p className="text-sm text-muted-foreground">
        Admin add/remove করুন। 5+ admin রাখতে পারবেন।
      </p>

      {/* Add new admin */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add New Admin
        </h4>
        <div className="flex gap-3">
          <Input
            placeholder="Email বা Username দিন"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAdmin()}
          />
          <Button onClick={addAdmin} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      </div>

      {/* Current admins list */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="w-4 h-4" /> Current Admins ({admins.length})
        </h4>
        {admins.length === 0 ? (
          <p className="text-muted-foreground text-sm">No admins found</p>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between glass rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    {admin.profile?.username || admin.profile?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {admin.profile?.email || "No email"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => removeAdmin(admin.user_id)}
                  disabled={actionLoading}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManager;
