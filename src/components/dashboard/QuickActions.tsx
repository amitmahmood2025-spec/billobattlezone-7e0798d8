import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, RotateCw, HelpCircle, Wallet, Trophy, Users } from "lucide-react";

const actions = [
  { label: "Daily Tasks", icon: Target, path: "/dashboard/tasks", color: "text-primary" },
  { label: "Spin Wheel", icon: RotateCw, path: "/dashboard/tasks", color: "text-neon-purple" },
  { label: "Quiz", icon: HelpCircle, path: "/dashboard/tasks", color: "text-neon-pink" },
  { label: "Deposit", icon: Wallet, path: "/dashboard/deposit", color: "text-neon-green" },
  { label: "Tournaments", icon: Trophy, path: "/dashboard/tournaments", color: "text-primary" },
  { label: "Referrals", icon: Users, path: "/dashboard/referrals", color: "text-neon-purple" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(action.path)}
          className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:neon-glow transition-all duration-300 group"
        >
          <action.icon className={`w-6 h-6 ${action.color} group-hover:scale-110 transition-transform`} />
          <span className="text-xs text-muted-foreground font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
