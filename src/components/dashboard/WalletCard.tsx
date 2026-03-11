import { motion } from "framer-motion";
import { Coins, Banknote, TrendingUp, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WalletCardProps {
  credits: number;
  cash: number;
}

const WalletCard = ({ credits, cash }: WalletCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Credits Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="relative glass-card rounded-2xl p-5 overflow-hidden group cursor-pointer glow-border"
        onClick={() => navigate("/dashboard/tasks")}
      >
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
        <div className="relative flex items-center gap-3 mb-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-11 h-11 rounded-xl gradient-neon-glow flex items-center justify-center shadow-neon"
          >
            <Coins className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Credits <span className="text-[10px] opacity-60">(Play Only)</span>
            </p>
            <p className="text-2xl font-display font-bold text-primary neon-text-strong">
              {credits.toLocaleString()}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
        </div>
        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> For tournament entry • Non-withdrawable
        </p>
      </motion.div>

      {/* Cash Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="relative glass-card rounded-2xl p-5 overflow-hidden group cursor-pointer"
        style={{ borderColor: "hsla(var(--neon-green) / 0.25)", borderWidth: 1 }}
        onClick={() => navigate("/dashboard/withdraw")}
      >
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-neon-green/10 rounded-full blur-3xl group-hover:bg-neon-green/20 transition-all" />
        <div className="relative flex items-center gap-3 mb-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
            className="w-11 h-11 rounded-xl bg-neon-green/20 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px hsla(var(--neon-green) / 0.3)" }}
          >
            <Banknote className="w-5 h-5 text-neon-green" />
          </motion.div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Cash <span className="text-[10px] opacity-60">(Withdrawable)</span>
            </p>
            <p className="text-2xl font-display font-bold text-neon-green" style={{ textShadow: "0 0 12px hsla(var(--neon-green) / 0.5)" }}>
              ৳{cash.toLocaleString()}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-neon-green/50 group-hover:text-neon-green transition-colors" />
        </div>
        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Deposited funds • Withdraw anytime
        </p>
      </motion.div>
    </div>
  );
};

export default WalletCard;
