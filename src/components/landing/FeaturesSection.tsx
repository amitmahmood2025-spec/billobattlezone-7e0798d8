import { motion } from "framer-motion";
import { Gift, Trophy, Wallet, Shield, Gamepad2, Users } from "lucide-react";

const features = [
  {
    icon: Gift,
    title: "Free Credits Daily",
    desc: "Earn credits through login bonuses, quizzes, spin wheel, and social tasks. No deposit required!",
    glowColor: "--neon",
  },
  {
    icon: Trophy,
    title: "Win Real Cash",
    desc: "Join tournaments with credits or cash. Win real money prizes you can withdraw anytime.",
    glowColor: "--neon-orange",
  },
  {
    icon: Wallet,
    title: "Easy Deposit",
    desc: "Deposit via bKash, Nagad, Rocket, or Binance. Instant processing with admin verification.",
    glowColor: "--neon-green",
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    desc: "Anti-cheat protection, verified transactions, and transparent prize distribution.",
    glowColor: "--neon-purple",
  },
  {
    icon: Gamepad2,
    title: "Multiple Games",
    desc: "Free Fire, PUBG, COD Mobile, and more. New tournaments added daily.",
    glowColor: "--neon-pink",
  },
  {
    icon: Users,
    title: "Referral Rewards",
    desc: "Invite friends and earn 50 credits per signup + 5% lifetime commission on their deposits.",
    glowColor: "--neon",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card neon-border mb-6"
          >
            <Gamepad2 className="w-4 h-4 text-primary icon-glow" />
            <span className="text-xs font-semibold text-primary tracking-wider uppercase">Why Choose Us</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Why <span className="text-gradient-premium">Billo Battle Zone</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            The ultimate gaming tournament platform with free-to-earn credits and real cash prizes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 150 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card rounded-2xl p-6 hover:neon-glow transition-all duration-300 group relative overflow-hidden"
            >
              {/* Hover ambient glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `hsla(var(${feat.glowColor}) / 0.15)` }}
              />
              
              <div className="relative">
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-13 h-13 rounded-xl gradient-neon flex items-center justify-center mb-4 shadow-neon"
                  style={{ width: 52, height: 52 }}
                >
                  <feat.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
