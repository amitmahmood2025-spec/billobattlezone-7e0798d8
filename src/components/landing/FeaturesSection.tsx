import { motion } from "framer-motion";
import { Gift, Trophy, Wallet, Shield, Gamepad2, Users } from "lucide-react";

const features = [
  {
    icon: Gift,
    title: "Free Credits Daily",
    desc: "Earn credits through login bonuses, quizzes, spin wheel, and social tasks. No deposit required!",
  },
  {
    icon: Trophy,
    title: "Win Real Cash",
    desc: "Join tournaments with credits or cash. Win real money prizes you can withdraw anytime.",
  },
  {
    icon: Wallet,
    title: "Easy Deposit",
    desc: "Deposit via bKash, Nagad, Rocket, or Binance. Instant processing with admin verification.",
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    desc: "Anti-cheat protection, verified transactions, and transparent prize distribution.",
  },
  {
    icon: Gamepad2,
    title: "Multiple Games",
    desc: "Free Fire, PUBG, COD Mobile, and more. New tournaments added daily.",
  },
  {
    icon: Users,
    title: "Referral Rewards",
    desc: "Invite friends and earn 50 credits per signup + 5% lifetime commission on their deposits.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Why <span className="text-gradient-neon">Billo Battle Zone</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The ultimate gaming tournament platform with free-to-earn credits and real cash prizes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-6 hover:neon-glow transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg gradient-neon flex items-center justify-center mb-4 group-hover:animate-glow">
                <feat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
