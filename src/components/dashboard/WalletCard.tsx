import { motion } from "framer-motion";
import { Coins, Banknote } from "lucide-react";

interface WalletCardProps {
  credits: number;
  cash: number;
}

const WalletCard = ({ credits, cash }: WalletCardProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-5 neon-border"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credits (Play Only)</p>
            <p className="text-2xl font-display font-bold text-primary neon-text">
              {credits.toLocaleString()}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">For tournament entry only • Non-withdrawable</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5"
        style={{ borderColor: "hsla(var(--neon-green) / 0.3)", borderWidth: 1 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cash (Withdrawable)</p>
            <p className="text-2xl font-display font-bold text-neon-green">
              ৳{cash.toLocaleString()}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Deposited funds • Withdrawable anytime</p>
      </motion.div>
    </div>
  );
};

export default WalletCard;
