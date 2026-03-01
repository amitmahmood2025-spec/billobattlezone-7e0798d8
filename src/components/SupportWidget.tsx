import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ExternalLink } from "lucide-react";

const channels = [
  {
    name: "Facebook Page",
    icon: "📘",
    url: "https://facebook.com/billobattlezone",
    description: "আমাদের FB Page ভিজিট করুন",
  },
  {
    name: "WhatsApp",
    icon: "💬",
    url: "https://wa.me/8801XXXXXXXXX",
    description: "WhatsApp এ মেসেজ করুন",
  },
  {
    name: "Telegram Channel",
    icon: "📢",
    url: "https://t.me/billobattlezone",
    description: "Official Telegram Channel",
  },
  {
    name: "Telegram Group",
    icon: "👥",
    url: "https://t.me/billobbzcommunity",
    description: "Community Group এ যোগ দিন",
  },
  {
    name: "Admin Support",
    icon: "🛡️",
    url: "https://t.me/billobbzadmin",
    description: "সরাসরি Admin এর সাথে কথা বলুন",
  },
];

const SupportWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-4 z-[60] w-14 h-14 rounded-full gradient-neon shadow-neon flex items-center justify-center text-primary-foreground"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: open ? 180 : 0 }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 md:bottom-24 right-4 z-[60] w-72 glass-strong rounded-2xl overflow-hidden border border-border"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-display font-bold text-sm text-primary">🎮 BILLO BBZ Support</h3>
              <p className="text-xs text-muted-foreground mt-1">সাহায্য দরকার? আমাদের সাথে যোগাযোগ করুন!</p>
            </div>
            <div className="p-2 space-y-1 max-h-[280px] overflow-y-auto">
              {channels.map((ch) => (
                <a
                  key={ch.name}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-2xl">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ch.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;
