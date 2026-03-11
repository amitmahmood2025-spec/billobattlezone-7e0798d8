import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Target, Trophy, BarChart3, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", path: "/dashboard/tasks", icon: Target },
  { label: "Tournaments", path: "/dashboard/tournaments", icon: Trophy },
  { label: "Results", path: "/dashboard/results", icon: BarChart3 },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle },
];

const DashboardNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <nav className="glass-strong border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-display font-bold text-lg cursor-pointer flex items-center gap-1.5"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center shadow-neon">
              <span className="text-primary-foreground font-black text-sm">B</span>
            </div>
            <span className="text-foreground">BILLO</span>{" "}
            <span className="text-primary neon-text">BBZ</span>
          </motion.div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-primary/10 text-primary neon-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "icon-glow" : ""}`} />
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm glass-card rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full gradient-neon-glow flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground font-medium">{user?.displayName || "Player"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav - premium */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50">
        <div className="flex justify-around py-1.5 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-primary/15 neon-glow" : ""}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "icon-glow" : ""}`} />
                </div>
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
