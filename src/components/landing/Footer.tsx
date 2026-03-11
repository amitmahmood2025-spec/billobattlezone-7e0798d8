import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-10 px-4 relative">
    <div className="absolute inset-0 bg-gradient-to-t from-primary/3 to-transparent pointer-events-none" />
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="font-display font-bold text-lg flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center shadow-neon">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-foreground">BILLO</span>{" "}
        <span className="text-primary neon-text">BATTLE ZONE</span>
      </motion.div>
      <p className="text-sm text-muted-foreground">
        © 2026 Billo Battle Zone. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
