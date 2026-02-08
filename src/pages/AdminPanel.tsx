import DashboardNav from "@/components/dashboard/DashboardNav";
import { motion } from "framer-motion";
import { Users, Wallet, ListTodo, Settings } from "lucide-react";

const stats = [
  { label: "Total Users", value: "0", icon: Users },
  { label: "Total Deposits", value: "৳0", icon: Wallet },
  { label: "Credits Distributed", value: "0", icon: ListTodo },
];

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display font-bold text-2xl mb-1">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, deposits, tasks, and settings.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg gradient-neon flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-display font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admin sections placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Pending Deposits", "Pending Withdrawals", "Task Management", "User Management"].map((section) => (
            <div key={section} className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold mb-2">{section}</h3>
              <p className="text-sm text-muted-foreground">Coming soon — will be wired to backend.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
