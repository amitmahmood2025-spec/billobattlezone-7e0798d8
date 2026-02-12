import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import TournamentManager from "@/components/admin/TournamentManager";
import AdminManager from "@/components/admin/AdminManager";
import TaskManager from "@/components/admin/TaskManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, CreditCard, Wallet, Settings, CheckCircle, XCircle,
  Loader2, Shield, TrendingUp, DollarSign,
} from "lucide-react";

interface PendingDeposit {
  id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  profiles: { username: string | null; email: string | null };
}

interface PendingWithdrawal {
  id: string;
  amount: number;
  payment_method: string;
  account_number: string;
  created_at: string;
  profiles: { username: string | null; email: string | null };
}

interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { isAdmin } = useProfile();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, pendingDeposits: 0, pendingWithdrawals: 0,
  });
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<Record<string, { number: string; name: string }>>({});

  useEffect(() => {
    if (isAdmin) fetchAdminData();
    else setLoading(false);
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { data: depositsData } = await supabase.from("deposits").select("amount, status");
      const { data: withdrawalsData } = await supabase.from("withdrawals").select("amount, status");

      const totalDeposits = (depositsData || []).filter((d) => d.status === "approved").reduce((sum, d) => sum + Number(d.amount), 0);
      const totalWithdrawals = (withdrawalsData || []).filter((w) => w.status === "completed").reduce((sum, w) => sum + Number(w.amount), 0);

      setStats({
        totalUsers: usersCount || 0, totalDeposits, totalWithdrawals,
        pendingDeposits: (depositsData || []).filter((d) => d.status === "pending").length,
        pendingWithdrawals: (withdrawalsData || []).filter((w) => w.status === "pending").length,
      });

      const { data: deposits } = await supabase.from("deposits").select("*, profiles(username, email)").eq("status", "pending").order("created_at", { ascending: false });
      setPendingDeposits((deposits || []) as PendingDeposit[]);

      const { data: withdrawals } = await supabase.from("withdrawals").select("*, profiles(username, email)").eq("status", "pending").order("created_at", { ascending: false });
      setPendingWithdrawals((withdrawals || []) as PendingWithdrawal[]);

      const { data: settings } = await supabase.from("payment_settings").select("*");
      const settingsMap: Record<string, { number: string; name: string }> = {};
      (settings || []).forEach((s: { payment_method: string; account_number: string; account_name: string | null }) => {
        settingsMap[s.payment_method] = { number: s.account_number, name: s.account_name || "" };
      });
      setPaymentSettings(settingsMap);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (action: string, data: Record<string, unknown>) => {
    if (!user) return;
    try {
      setActionLoading(`${action}-${data.depositId || data.withdrawalId}`);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ firebaseUid: user.uid, action, data }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action failed");
      toast.success(result.message);
      await fetchAdminData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const updatePaymentSetting = async (method: string) => {
    const setting = paymentSettings[method];
    if (!setting) return;
    await handleAdminAction("update_payment_settings", {
      method, accountNumber: setting.number, accountName: setting.name, minDeposit: 50, minWithdrawal: 100,
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <DashboardNav />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-display font-bold text-2xl">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage everything from here</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass rounded-xl p-4">
            <Users className="w-6 h-6 text-primary mb-2" />
            <p className="text-2xl font-display font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="glass rounded-xl p-4">
            <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-display font-bold">৳{stats.totalDeposits}</p>
            <p className="text-xs text-muted-foreground">Total Deposits</p>
          </div>
          <div className="glass rounded-xl p-4">
            <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-display font-bold">৳{stats.totalWithdrawals}</p>
            <p className="text-xs text-muted-foreground">Total Withdrawals</p>
          </div>
          <div className="glass rounded-xl p-4">
            <CreditCard className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-2xl font-display font-bold">{stats.pendingDeposits}</p>
            <p className="text-xs text-muted-foreground">Pending Deposits</p>
          </div>
          <div className="glass rounded-xl p-4">
            <Wallet className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-2xl font-display font-bold">{stats.pendingWithdrawals}</p>
            <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
          </div>
        </motion.div>

        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="w-full grid grid-cols-6 glass">
            <TabsTrigger value="deposits">Deposits ({stats.pendingDeposits})</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({stats.pendingWithdrawals})</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="mt-4 space-y-3">
            {pendingDeposits.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center"><p className="text-muted-foreground">No pending deposits</p></div>
            ) : (
              pendingDeposits.map((deposit) => (
                <div key={deposit.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{deposit.profiles?.username || deposit.profiles?.email || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{deposit.payment_method.toUpperCase()} • TrxID: {deposit.transaction_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(deposit.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right"><p className="font-display font-bold text-xl text-green-400">৳{deposit.amount}</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAdminAction("approve_deposit", { depositId: deposit.id })} disabled={actionLoading === `approve_deposit-${deposit.id}`}>
                      {actionLoading === `approve_deposit-${deposit.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAdminAction("reject_deposit", { depositId: deposit.id, note: "Rejected by admin" })} disabled={actionLoading === `reject_deposit-${deposit.id}`}>
                      {actionLoading === `reject_deposit-${deposit.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" /> Reject</>}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4 space-y-3">
            {pendingWithdrawals.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center"><p className="text-muted-foreground">No pending withdrawals</p></div>
            ) : (
              pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{withdrawal.profiles?.username || withdrawal.profiles?.email || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{withdrawal.payment_method.toUpperCase()} • {withdrawal.account_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(withdrawal.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right"><p className="font-display font-bold text-xl text-yellow-400">৳{withdrawal.amount}</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAdminAction("approve_withdrawal", { withdrawalId: withdrawal.id })} disabled={actionLoading === `approve_withdrawal-${withdrawal.id}`}>
                      {actionLoading === `approve_withdrawal-${withdrawal.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Complete</>}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAdminAction("reject_withdrawal", { withdrawalId: withdrawal.id, note: "Rejected by admin" })} disabled={actionLoading === `reject_withdrawal-${withdrawal.id}`}>
                      {actionLoading === `reject_withdrawal-${withdrawal.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" /> Reject</>}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="tournaments" className="mt-4">
            <TournamentManager />
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <TaskManager />
          </TabsContent>

          <TabsContent value="admins" className="mt-4">
            <AdminManager />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" /> Payment Settings
            </h3>
            {["bkash", "nagad", "rocket", "binance"].map((method) => (
              <div key={method} className="glass rounded-xl p-4 space-y-3">
                <h4 className="font-medium capitalize">{method}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Account Number / Wallet Address" value={paymentSettings[method]?.number || ""}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, [method]: { ...prev[method], number: e.target.value } }))} />
                  <Input placeholder="Account Name (optional)" value={paymentSettings[method]?.name || ""}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, [method]: { ...prev[method], name: e.target.value } }))} />
                </div>
                <Button size="sm" onClick={() => updatePaymentSetting(method)}>Save {method}</Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
