import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, RotateCw, HelpCircle, Wallet, Trophy, Users } from "lucide-react";

const actions = [
  { label: "Daily Tasks", icon: Target, path: "/dashboard/tasks", gradient: "from-primary/20 to-primary/5", iconColor: "text-primary", glowColor: "--neon" },
  { label: "Spin Wheel", icon: RotateCw, path: "/dashboard/tasks", gradient: "from-neon-purple/20 to-neon-purple/5", iconColor: "text-neon-purple", glowColor: "--neon-purple" },
  { label: "Quiz", icon: HelpCircle, path: "/dashboard/tasks", gradient: "from-neon-pink/20 to-neon-pink/5", iconColor: "text-neon-pink", glowColor: "--neon-pink" },
  { label: "Deposit", icon: Wallet, path: "/dashboard/deposit", gradient: "from-neon-green/20 to-neon-green/5", iconColor: "text-neon-green", glowColor: "--neon-green" },
  { label: "Tournaments", icon: Trophy, path: "/dashboard/tournaments", gradient: "from-neon-orange/20 to-neon-orange/5", iconColor: "text-neon-orange", glowColor: "--neon-orange" },
  { label: "Referrals", icon: Users, path: "/dashboard/referrals", gradient: "from-primary/20 to-neon-purple/5", iconColor: "text-primary", glowColor: "--neon" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.06, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(action.path)}
          className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2.5 hover:neon-glow transition-all duration-300 group relative overflow-hidden"
        >
          {/* Background gradient orb */}
          <div className={`absolute inset-0 bg-gradient-to-b ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          <div className="relative">
            <motion.div
              className={`w-10 h-10 rounded-xl bg-gradient-to-b ${action.gradient} flex items-center justify-center transition-all`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <action.icon className={`w-5 h-5 ${action.iconColor} group-hover:icon-glow transition-all`} />
            </motion.div>
          </div>
          <span className="relative text-[11px] text-muted-foreground font-semibold group-hover:text-foreground transition-colors">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
