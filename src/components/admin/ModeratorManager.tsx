import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Loader2, Users, Settings, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ALL_PERMISSIONS = [
  { key: "manage_deposits", label: "Deposits", desc: "Approve/Reject deposits", icon: "💳" },
  { key: "manage_withdrawals", label: "Withdrawals", desc: "Approve/Reject withdrawals", icon: "💸" },
  { key: "manage_tournaments", label: "Tournaments", desc: "Create/Edit/Delete tournaments", icon: "🏆" },
  { key: "manage_tasks", label: "Tasks", desc: "Create/Edit/Delete tasks", icon: "✅" },
  { key: "manage_telegram", label: "Telegram", desc: "Manage Telegram tasks", icon: "🤖" },
  { key: "manage_users", label: "Users", desc: "Ban/Unban users", icon: "👥" },
  { key: "manage_settings", label: "Settings", desc: "Update payment settings", icon: "⚙️" },
];

interface StaffUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { username: string | null; email: string | null };
  permissions: string[];
}

const ModeratorManager = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator">("moderator");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    // Get all admin/moderator roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .in("role", ["admin", "moderator"]);

    if (!roles || roles.length === 0) {
      setStaff([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);

    // Fetch profiles and permissions in parallel
    const [profilesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("id, username, email").in("id", userIds),
      supabase.from("role_permissions").select("*").in("user_id", userIds),
    ]);

    const profileMap: Record<string, { username: string | null; email: string | null }> = {};
    (profilesRes.data || []).forEach((p) => {
      profileMap[p.id] = { username: p.username, email: p.email };
    });

    const permMap: Record<string, string[]> = {};
    (permsRes.data || []).forEach((p: { user_id: string; permission: string }) => {
      if (!permMap[p.user_id]) permMap[p.user_id] = [];
      permMap[p.user_id].push(p.permission);
    });

    setStaff(
      roles.map((r) => ({
        ...r,
        profile: profileMap[r.user_id],
        permissions: permMap[r.user_id] || [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
    // Get current user's profile id
    if (user) {
      supabase
        .from("profiles")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single()
        .then(({ data }) => {
          if (data) setCurrentProfileId(data.id);
        });
    }
  }, [fetchStaff, user]);

  const callAdmin = async (action: string, data: Record<string, unknown>) => {
    const { getAuthHeaders } = await import("@/lib/authHeaders");
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ action, data }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed");
    return result;
  };

  const addStaff = async () => {
    if (!newEmail.trim()) {
      toast.error("Email বা Username দিন");
      return;
    }
    setActionLoading(true);
    try {
      await callAdmin(newRole === "admin" ? "add_admin" : "add_moderator", {
        emailOrUsername: newEmail.trim(),
      });
      toast.success(`${newRole === "admin" ? "Admin" : "Moderator"} added!`);
      setNewEmail("");
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const removeStaff = async (targetUserId: string, role: string) => {
    if (!confirm(`এই ${role} কে remove করতে চান?`)) return;
    setActionLoading(true);
    try {
      await callAdmin(role === "admin" ? "remove_admin" : "remove_moderator", {
        targetUserId,
      });
      toast.success(`${role} removed!`);
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = async (targetUserId: string, permission: string, enabled: boolean) => {
    try {
      await callAdmin("toggle_permission", {
        targetUserId,
        permission,
        enabled,
      });
      // Update local state
      setStaff((prev) =>
        prev.map((s) => {
          if (s.user_id !== targetUserId) return s;
          return {
            ...s,
            permissions: enabled
              ? [...s.permissions, permission]
              : s.permissions.filter((p) => p !== permission),
          };
        })
      );
      toast.success(`${permission.replace("manage_", "").replace("_", " ")} ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const admins = staff.filter((s) => s.role === "admin");
  const moderators = staff.filter((s) => s.role === "moderator");

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-neon-purple/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Staff Management</h3>
          <p className="text-xs text-muted-foreground">Admin ও Moderator manage করুন</p>
        </div>
      </div>

      {/* Add New Staff */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 space-y-4"
      >
        <h4 className="font-display font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Add New Staff
        </h4>

        {/* Role Selector */}
        <div className="flex gap-2">
          {(["moderator", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setNewRole(role)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all capitalize ${
                newRole === role
                  ? "gradient-neon text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {role === "admin" ? "🛡️ Admin" : "👮 Moderator"}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Email বা Username দিন"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStaff()}
          />
          <Button onClick={addStaff} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      </motion.div>

      {/* Admins Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5 space-y-3"
      >
        <h4 className="font-display font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-400" /> Admins ({admins.length})
          <span className="text-[10px] text-muted-foreground ml-auto">Full Access</span>
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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500/30 to-primary/20 flex items-center justify-center font-display font-bold text-sm text-yellow-400">
                    {admin.profile?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {admin.profile?.username || admin.profile?.email || "Unknown"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{admin.profile?.email || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                    ADMIN
                  </span>
                  {admin.user_id !== currentProfileId && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => removeStaff(admin.user_id, "admin")}
                      disabled={actionLoading}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Moderators Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-5 space-y-3"
      >
        <h4 className="font-display font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Moderators ({moderators.length})
          <span className="text-[10px] text-muted-foreground ml-auto">Custom Permissions</span>
        </h4>

        {moderators.length === 0 ? (
          <p className="text-muted-foreground text-sm">No moderators yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {moderators.map((mod) => (
              <div key={mod.id} className="glass rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedUser(expandedUser === mod.user_id ? null : mod.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-neon-purple/20 flex items-center justify-center font-display font-bold text-sm text-primary">
                      {mod.profile?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {mod.profile?.username || mod.profile?.email || "Unknown"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {mod.permissions.length}/{ALL_PERMISSIONS.length} permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                      MOD
                    </span>
                    <Settings className={`w-4 h-4 text-muted-foreground transition-transform ${expandedUser === mod.user_id ? "rotate-90" : ""}`} />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStaff(mod.user_id, "moderator");
                      }}
                      disabled={actionLoading}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Permission Toggles */}
                <AnimatePresence>
                  {expandedUser === mod.user_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/20 overflow-hidden"
                    >
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                          <Lock className="w-3 h-3" /> Permission Controls
                        </p>
                        {ALL_PERMISSIONS.map((perm) => {
                          const isEnabled = mod.permissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{perm.icon}</span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{perm.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{perm.desc}</p>
                                </div>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) =>
                                  togglePermission(mod.user_id, perm.key, checked)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ModeratorManager;
