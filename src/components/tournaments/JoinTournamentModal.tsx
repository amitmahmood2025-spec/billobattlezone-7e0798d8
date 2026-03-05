import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Gamepad2, User, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface JoinTournamentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (gameId: string, gameName: string) => void;
  tournamentTitle: string;
  entryFee: number;
  feeType: string;
  useCredits: boolean;
  loading: boolean;
}

const JoinTournamentModal = ({
  open, onClose, onConfirm, tournamentTitle, entryFee, feeType, useCredits, loading,
}: JoinTournamentModalProps) => {
  const [gameId, setGameId] = useState("");
  const [gameName, setGameName] = useState("");

  const canSubmit = gameId.trim().length >= 3 && gameName.trim().length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(gameId.trim(), gameName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-neon-blue/20 bg-background/95 backdrop-blur-xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Gamepad2 className="w-5 h-5 text-primary" /> Join Tournament
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {tournamentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Fee Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-4 border border-neon-blue/10 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">ENTRY FEE</p>
            <p className="font-display font-bold text-2xl text-primary">
              {useCredits ? `${entryFee} Credits` : `৳${entryFee}`}
            </p>
          </motion.div>

          {/* Game ID */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Player / Game ID *
            </label>
            <Input
              placeholder="আপনার Game ID লিখুন"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="border-neon-blue/20 bg-background/50 focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Game এর ভিতরে যে ID দেখায় সেটা দিন
            </p>
          </div>

          {/* Game Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> In-Game Name *
            </label>
            <Input
              placeholder="আপনার Game Name লিখুন"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="border-neon-blue/20 bg-background/50 focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Game এ যে নাম ব্যবহার করেন সেটা দিন
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-neon-blue/20">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="bg-gradient-to-r from-primary to-neon-blue text-primary-foreground font-bold shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Joining...</>
            ) : (
              "Confirm & Join"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinTournamentModal;
