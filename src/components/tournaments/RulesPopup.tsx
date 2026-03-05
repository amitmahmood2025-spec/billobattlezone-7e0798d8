import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Trophy, Clock, Ban } from "lucide-react";
import { motion } from "framer-motion";

interface RulesPopupProps {
  open: boolean;
  onClose: () => void;
  gameType: string;
  rules?: string | null;
}

const DEFAULT_RULES = [
  { icon: <Clock className="w-4 h-4 text-primary" />, text: "Match শুরু হওয়ার ১০ মিনিট আগে Room ID ও Password দেওয়া হবে" },
  { icon: <Shield className="w-4 h-4 text-green-400" />, text: "কোনো প্রকার Hack বা Cheat ব্যবহার করলে ID permanent ban হবে" },
  { icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />, text: "Match এ সময়মতো Join না করলে Entry Fee ফেরত দেওয়া হবে না" },
  { icon: <Trophy className="w-4 h-4 text-accent" />, text: "Prize Money ২৪ ঘণ্টার মধ্যে Wallet এ জমা হবে" },
  { icon: <Ban className="w-4 h-4 text-red-400" />, text: "Teaming বা আনুগত্য ভাঙলে প্রতিযোগী বাতিল হবে" },
];

const RulesPopup = ({ open, onClose, gameType, rules }: RulesPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-neon-blue/20 bg-background/95 backdrop-blur-xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Shield className="w-5 h-5 text-primary" /> Game Rules
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {gameType} — Tournament Rules & Guidelines
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-3 py-2">
            {DEFAULT_RULES.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 glass rounded-xl p-3 border border-neon-blue/10"
              >
                <div className="mt-0.5 shrink-0">{rule.icon}</div>
                <p className="text-sm text-foreground leading-relaxed">{rule.text}</p>
              </motion.div>
            ))}

            {rules && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-4 border border-primary/20 mt-4"
              >
                <p className="text-xs text-primary font-bold mb-2 uppercase tracking-wider">
                  📋 Additional Rules
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {rules}
                </p>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RulesPopup;
