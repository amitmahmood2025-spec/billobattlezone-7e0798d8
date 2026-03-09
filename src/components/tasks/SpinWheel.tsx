import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { getAuthHeaders } from "@/lib/authHeaders";
import { Button } from "@/components/ui/button";
import { X, Loader2, Clock, Zap, Gift, ChevronRight, Trophy, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SpinMissions from "./SpinMissions";

interface SpinWheelProps {
  onClose: () => void;
}

// ═══════════════════════════════════════════
// WHEEL SEGMENTS — premium gaming labels with icons
// Players always win low credits (2-5), big prizes are visual only
// ═══════════════════════════════════════════
const WHEEL_SEGMENTS = [
  { label: "5 CR",       icon: "💰", subLabel: "CREDITS",       color1: "#0a3d5c", color2: "#0d4a6b", accent: "#00d9ff" },
  { label: "ROYAL",      icon: "👑", subLabel: "PASS",          color1: "#1a1a2e", color2: "#16213e", accent: "#ffd93d" },
  { label: "2 CR",       icon: "🪙", subLabel: "CREDITS",       color1: "#0d4a6b", color2: "#0a3d5c", accent: "#00ff88" },
  { label: "WEEKLY",     icon: "📅", subLabel: "MEMBERSHIP",    color1: "#1a1a2e", color2: "#16213e", accent: "#ff6b35" },
  { label: "3 CR",       icon: "💎", subLabel: "CREDITS",       color1: "#0a3d5c", color2: "#0d4a6b", accent: "#00d9ff" },
  { label: "ELITE",      icon: "⚔️", subLabel: "PASS",          color1: "#1a1a2e", color2: "#16213e", accent: "#c084fc" },
  { label: "4 CR",       icon: "✨", subLabel: "CREDITS",       color1: "#0d4a6b", color2: "#0a3d5c", accent: "#00ff88" },
  { label: "MONTHLY",    icon: "🏆", subLabel: "PREMIUM",       color1: "#1a1a2e", color2: "#16213e", accent: "#ff3d71" },
  { label: "2 CR",       icon: "🪙", subLabel: "CREDITS",       color1: "#0a3d5c", color2: "#0d4a6b", accent: "#00d9ff" },
  { label: "PREMIUM",    icon: "💠", subLabel: "PASS",          color1: "#1a1a2e", color2: "#16213e", accent: "#ffd93d" },
  { label: "3 CR",       icon: "💎", subLabel: "CREDITS",       color1: "#0d4a6b", color2: "#0a3d5c", accent: "#00ff88" },
  { label: "DIAMOND",    icon: "💎", subLabel: "ROYALE",        color1: "#1a1a2e", color2: "#16213e", accent: "#00d9ff" },
  { label: "5 CR",       icon: "💰", subLabel: "CREDITS",       color1: "#0a3d5c", color2: "#0d4a6b", accent: "#00ff88" },
  { label: "FF",         icon: "🔥", subLabel: "1000 💎",       color1: "#1a1a2e", color2: "#16213e", accent: "#ff6b35" },
  { label: "2 CR",       icon: "🪙", subLabel: "CREDITS",       color1: "#0d4a6b", color2: "#0a3d5c", accent: "#00d9ff" },
  { label: "PUBG",       icon: "🎯", subLabel: "600 UC",        color1: "#1a1a2e", color2: "#16213e", accent: "#ffd93d" },
];

// ═══════════════════════════════════════════
// LIVE FEED — 40 fake entries cycling randomly
// ═══════════════════════════════════════════
const PLAYER_NAMES = [
  "ProGamer_X", "FireKing22", "LudoMaster", "SniperBD", "NinjaFF",
  "ShadowKill", "StormRider", "DarkPhoenix", "CyberWolf", "BlazeFury",
  "TigerClaw", "GhostRecon", "IronFist99", "NeonBlade", "ThunderBolt",
  "VenomStrike", "DragonRage", "FrostBite", "SteelNerve", "RapidFire",
  "AlphaWolf", "OmegaX", "HyperNova", "ZeroGravity", "MaxPayne",
  "EliteForce", "WarMachine", "RocketMan", "BulletProof", "AceSniper",
  "SwiftKill", "PhantomX", "VortexBD", "MegaStrike", "CobraKai",
  "HawkEye99", "MadTitan", "PixelKing", "RunnerX", "LegendBD",
];

const AVATARS = ["🎮", "🔥", "🎲", "🎯", "⚡", "💀", "🐉", "🦅", "👑", "💎", "🎖️", "⭐", "🏅", "🎪", "🎰", "🃏"];

const PRIZES_VISUAL = [
  "2 Cr", "3 Cr", "4 Cr", "5 Cr", "2 Cr", "3 Cr",
  "Royal Pass", "Weekly", "Elite Pass", "Monthly",
  "Premium Pass", "Diamond Royale", "2 Cr", "3 Cr",
  "5 Cr", "4 Cr", "2 Cr", "3 Cr", "5 Cr", "2 Cr",
];

const TIMES = [
  "2s ago", "5s ago", "8s ago", "12s ago", "15s ago", "20s ago", "25s ago",
  "30s ago", "35s ago", "45s ago", "1m ago", "1m ago", "2m ago", "2m ago",
  "3m ago", "3m ago", "4m ago", "5m ago", "5m ago", "6m ago",
];

function generateLiveFeed() {
  const shuffled = [...PLAYER_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.map((name, i) => ({
    name,
    prize: PRIZES_VISUAL[i % PRIZES_VISUAL.length],
    time: TIMES[i % TIMES.length],
    avatar: AVATARS[i % AVATARS.length],
  }));
}

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showMissions, setShowMissions] = useState(false);
  const [nextSpinTime, setNextSpinTime] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [feedIndex, setFeedIndex] = useState(0);

  // Generate 40 live feed items once
  const liveFeed = useMemo(() => generateLiveFeed(), []);

  // Auto-cycle live feed every 2s
  useEffect(() => {
    const id = setInterval(() => setFeedIndex((i) => (i + 1) % liveFeed.length), 2000);
    return () => clearInterval(id);
  }, [liveFeed.length]);

  // Background particles
  const particles = useMemo(() =>
    Array.from({ length: 25 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 3,
      dur: 2 + Math.random() * 4,
      delay: Math.random() * 3,
    })), []);

  // Countdown timer
  useEffect(() => {
    if (!nextSpinTime) return;
    const target = new Date(nextSpinTime).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown(""); setNextSpinTime(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextSpinTime]);

  // ═══════════════════════════════════════════
  // DRAW PREMIUM WHEEL
  // ═══════════════════════════════════════════
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = 360;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const r = cx - 24;
    const segments = WHEEL_SEGMENTS.length;
    const sliceAngle = (2 * Math.PI) / segments;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // ── Outer decorative rings with multi-layer glow ──
    for (let i = 5; i >= 0; i--) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 14 + i * 2, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 217, 255, ${0.04 + i * 0.03})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Main outer ring — double stroke
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,217,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Tick marks (80 marks for premium feel)
    ctx.save();
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const len = isMajor ? 7 : 3;
      const x1 = cx + Math.cos(angle) * (r + 10);
      const y1 = cy + Math.sin(angle) * (r + 10);
      const x2 = cx + Math.cos(angle) * (r + 10 + len);
      const y2 = cy + Math.sin(angle) * (r + 10 + len);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? "rgba(0,217,255,0.9)" : "rgba(0,217,255,0.25)";
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // ── Rotating segments ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    WHEEL_SEGMENTS.forEach((seg, i) => {
      const start = i * sliceAngle - Math.PI / 2;
      const end = start + sliceAngle;
      const midAngle = start + sliceAngle / 2;

      // Gradient fill
      const gx = cx + Math.cos(midAngle) * r * 0.5;
      const gy = cy + Math.sin(midAngle) * r * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.25, gx, gy, r);
      grad.addColorStop(0, seg.color1);
      grad.addColorStop(1, seg.color2);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "rgba(0, 217, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Accent edge highlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, start, end);
      ctx.strokeStyle = `${seg.accent}18`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // ── Segment content: icon + label + sublabel ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = "center";

      // Icon (emoji)
      ctx.font = "16px sans-serif";
      ctx.fillText(seg.icon, r * 0.46, 1);

      // Main label
      ctx.font = "bold 10px 'Orbitron', sans-serif";
      ctx.fillStyle = seg.accent;
      ctx.shadowColor = seg.accent;
      ctx.shadowBlur = 10;
      ctx.fillText(seg.label, r * 0.72, -2);

      // Sub label
      ctx.shadowBlur = 0;
      ctx.font = "bold 6px 'Orbitron', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(seg.subLabel, r * 0.72, 8);

      ctx.restore();

      // Boundary dot
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start);
      ctx.beginPath();
      ctx.arc(r - 2, 0, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#00d9ff";
      ctx.shadowColor = "#00d9ff";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    });

    // ── Inner decorative rings ──
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.38, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,217,255,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.33, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,217,255,0.12)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // ── Center hub — premium gradient ──
    const hubR = r * 0.28;
    const hubGrad = ctx.createRadialGradient(cx, cy - 5, 0, cx, cy, hubR);
    hubGrad.addColorStop(0, "#163050");
    hubGrad.addColorStop(0.5, "#0d1f35");
    hubGrad.addColorStop(1, "#060e1a");
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // Hub border glow — triple ring
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 25;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, hubR - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,217,255,0.25)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, hubR - 9, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,217,255,0.12)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Center text
    ctx.font = "bold 15px 'Orbitron', sans-serif";
    ctx.fillStyle = "#00d9ff";
    ctx.textAlign = "center";
    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 20;
    ctx.fillText("SPIN", cx, cy - 5);
    ctx.fillText("NOW", cx, cy + 13);
    ctx.shadowBlur = 0;

    ctx.restore(); // end rotation

    // ── Pointer (top) — premium crystal shape ──
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 15, 38);
    ctx.lineTo(cx + 15, 38);
    ctx.closePath();

    const pGrad = ctx.createLinearGradient(cx, 4, cx, 38);
    pGrad.addColorStop(0, "#00ffff");
    pGrad.addColorStop(0.5, "#00b4d8");
    pGrad.addColorStop(1, "#006080");
    ctx.fillStyle = pGrad;
    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 30;
    ctx.fill();

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx - 6, 32);
    ctx.lineTo(cx + 6, 32);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,255,255,0.25)";
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
  }, [rotation]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  // ═══════════════════════════════════════════
  // SPIN ACTION
  // ═══════════════════════════════════════════
  const spin = async () => {
    if (!user) return;
    try {
      setSpinning(true);
      setResult(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spin-wheel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ firebaseUid: user.uid }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        if (data.error?.includes("Already spun")) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          setNextSpinTime(tomorrow.toISOString());
        }
        throw new Error(data.error || "Failed to spin");
      }

      const wonCredits = data.prize.credits;
      // Land on a matching credit segment
      const segIdx = WHEEL_SEGMENTS.findIndex((s) => s.label === `${wonCredits} CR`);
      const sliceAngle = 360 / WHEEL_SEGMENTS.length;
      const targetAngle = 360 - (segIdx >= 0 ? segIdx : 0) * sliceAngle - sliceAngle / 2;
      const spins = 8;
      const finalRotation = rotation + 360 * spins + targetAngle;

      let start: number | null = null;
      const duration = 7500;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 5);
        setRotation(rotation + (finalRotation - rotation) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setResult(wonCredits);
          confetti({
            particleCount: 300,
            spread: 150,
            origin: { y: 0.4 },
            colors: ["#00d9ff", "#00ff88", "#ffd93d", "#ff6b35", "#c084fc", "#ff3d71"],
          });
          toast.success(`🎉 You won ${wonCredits} Credits!`);
          setSpinning(false);
          refreshWallet();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          setNextSpinTime(tomorrow.toISOString());
        }
      };
      requestAnimationFrame(animate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to spin";
      toast.error(message);
      setSpinning(false);
    }
  };

  // Visible feed items (show 6 at a time in desktop panel, cycle through all 40)
  const visibleFeed = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      items.push(liveFeed[(feedIndex + i) % liveFeed.length]);
    }
    return items;
  }, [feedIndex, liveFeed]);

  const currentFeed = liveFeed[feedIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "radial-gradient(ellipse at center, rgba(0,30,60,0.97) 0%, rgba(2,8,20,0.99) 100%)" }}
      onClick={(e) => e.target === e.currentTarget && !spinning && onClose()}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: "hsl(var(--primary))" }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.5, 0.5], y: [0, -40, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
          />
        ))}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,217,255,0.08) 2px, rgba(0,217,255,0.08) 4px)"
        }} />
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="relative w-full max-w-3xl"
      >
        {/* ════════ HEADER ════════ */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex-1">
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display font-black text-lg sm:text-xl tracking-[0.2em] uppercase"
              style={{
                color: "hsl(var(--primary))",
                textShadow: "0 0 20px rgba(0,217,255,0.8), 0 0 60px rgba(0,217,255,0.3), 0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              ⚡ DAILY LUCKY SPIN & WIN
            </motion.h2>
            <p className="text-[10px] sm:text-xs tracking-[0.15em] uppercase mt-0.5 text-muted-foreground">
              PREMIER REWARDS • SPIN DAILY
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass neon-border">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Credits:</span>
              <span className="font-display font-bold text-primary text-sm">
                {wallet?.credits ?? 0}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ════════ MAIN LAYOUT ════════ */}
        <div className="flex gap-3">
          {/* LEFT: Live Feed panel (desktop) — shows 8 items from rotating 40 */}
          <div className="hidden lg:flex flex-col w-52 gap-2">
            <div className="rounded-xl p-3 flex-1 overflow-hidden"
                 style={{
                   background: "linear-gradient(180deg, rgba(0,20,40,0.85), rgba(0,10,25,0.95))",
                   border: "1px solid rgba(0,217,255,0.15)",
                   boxShadow: "inset 0 0 30px rgba(0,217,255,0.03)"
                 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-display text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(var(--primary) / 0.8)" }}>
                  LIVE WINNERS
                </span>
                <span className="ml-auto text-[9px] text-muted-foreground">{liveFeed.length}+ spins</span>
              </div>
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {visibleFeed.map((f, i) => (
                    <motion.div
                      key={`${f.name}-${feedIndex + i}`}
                      initial={{ opacity: 0, x: -15, scale: 0.95 }}
                      animate={{ opacity: i === 0 ? 1 : 0.7 - i * 0.07, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 15, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 p-1.5 rounded-lg"
                      style={{
                        background: i === 0 ? "rgba(0,217,255,0.1)" : "transparent",
                        borderLeft: i === 0 ? "2px solid rgba(0,217,255,0.5)" : "2px solid transparent",
                        transition: "all 0.3s"
                      }}
                    >
                      <span className="text-base shrink-0">{f.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          won <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>{f.prize}</span>
                          <span className="text-muted-foreground/40 ml-1">• {f.time}</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* CENTER: Wheel */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center"
                 style={{
                   background: "linear-gradient(180deg, rgba(0,20,40,0.6), rgba(0,10,25,0.8))",
                   border: "1px solid rgba(0,217,255,0.12)",
                   boxShadow: "0 0 50px rgba(0,217,255,0.06), inset 0 0 40px rgba(0,217,255,0.02)"
                 }}>

              {/* Mobile live feed ticker */}
              <div className="lg:hidden w-full mb-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={feedIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(0,217,255,0.06)", border: "1px solid rgba(0,217,255,0.1)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-base">{currentFeed.avatar}</span>
                    <span className="text-[10px] text-foreground font-medium">{currentFeed.name}</span>
                    <span className="text-[10px] text-muted-foreground">won</span>
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>{currentFeed.prize}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{currentFeed.time}</span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile credits */}
              <div className="sm:hidden flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg glass neon-border">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground">Credits:</span>
                <span className="font-display font-bold text-primary text-sm">{wallet?.credits ?? 0}</span>
              </div>

              {/* Canvas wheel */}
              <div className="relative" style={{ width: 360, height: 360 }}>
                {/* Multi-layer glow aura */}
                <div className="absolute -inset-8 rounded-full" style={{
                  background: "radial-gradient(circle, rgba(0,217,255,0.15) 0%, rgba(0,217,255,0.05) 40%, transparent 70%)",
                  filter: "blur(12px)"
                }} />
                <div className="absolute -inset-4 rounded-full" style={{
                  background: "radial-gradient(circle, rgba(0,217,255,0.08) 0%, transparent 60%)",
                }} />
                <canvas ref={canvasRef} className="relative z-10" />

                {/* Spinning border effect */}
                {spinning && (
                  <motion.div
                    className="absolute inset-0 rounded-full z-20 pointer-events-none"
                    style={{ border: "2px solid rgba(0,217,255,0.5)" }}
                    animate={{ rotate: 360, opacity: [0.2, 0.9, 0.2] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>

              {/* Result / Countdown / CTA */}
              <div className="mt-4 text-center min-h-[60px] w-full">
                <AnimatePresence mode="wait">
                  {result !== null ? (
                    <motion.div
                      key="result"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">YOU WON</span>
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-display font-black text-4xl tracking-wider"
                         style={{
                           color: "hsl(var(--primary))",
                           textShadow: "0 0 30px rgba(0,217,255,0.8), 0 0 60px rgba(0,217,255,0.3)"
                         }}>
                        {result} CREDITS!
                      </p>
                    </motion.div>
                  ) : countdown ? (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Next Spin In</span>
                      </div>
                      <div className="flex gap-1">
                        {countdown.split(":").map((unit, i) => (
                          <div key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-primary font-bold text-lg">:</span>}
                            <div className="px-3 py-1.5 rounded-lg font-display font-bold text-xl tracking-widest"
                                 style={{
                                   background: "rgba(0,217,255,0.08)",
                                   border: "1px solid rgba(0,217,255,0.2)",
                                   color: "hsl(var(--primary))",
                                   textShadow: "0 0 10px rgba(0,217,255,0.5)"
                                 }}>
                              {unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cta"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Try your luck! <span className="text-primary font-semibold">1 free spin</span> per day.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Spin button */}
              <Button
                onClick={result !== null ? onClose : spin}
                disabled={spinning || !!countdown}
                className="w-full max-w-xs h-12 font-display font-bold text-base tracking-[0.15em] mt-2 rounded-xl relative overflow-hidden group"
                style={{
                  background: spinning || countdown
                    ? "rgba(0,217,255,0.1)"
                    : "linear-gradient(135deg, #00b4d8, #00d9ff, #00e5a0)",
                  border: "1px solid rgba(0,217,255,0.4)",
                  boxShadow: spinning || countdown
                    ? "none"
                    : "0 0 25px rgba(0,217,255,0.4), 0 0 50px rgba(0,217,255,0.15)",
                  color: spinning || countdown ? "rgba(0,217,255,0.5)" : "#001a2e",
                }}
              >
                {!spinning && !countdown && result === null && (
                  <div className="absolute inset-0 opacity-30"
                       style={{
                         background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                         backgroundSize: "200% 100%",
                         animation: "shimmer 2s infinite"
                       }} />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {spinning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : result !== null ? (
                    <>✨ COLLECT & CLOSE</>
                  ) : countdown ? (
                    <><Clock className="w-4 h-4" /> COME BACK LATER</>
                  ) : (
                    <><Zap className="w-5 h-5" /> SPIN NOW!</>
                  )}
                </span>
              </Button>
            </div>
          </div>

          {/* RIGHT: Earn More panel (desktop) */}
          <div className="hidden md:flex flex-col w-48 gap-2">
            <button
              onClick={() => setShowMissions(true)}
              className="flex-1 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{
                background: "linear-gradient(180deg, rgba(0,20,40,0.85), rgba(0,10,25,0.95))",
                border: "1px solid rgba(0,217,255,0.2)",
                boxShadow: "0 0 25px rgba(0,217,255,0.05)",
              }}
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                   style={{
                     background: "linear-gradient(135deg, rgba(0,217,255,0.15), rgba(0,255,136,0.1))",
                     border: "1px solid rgba(0,217,255,0.3)",
                     boxShadow: "0 0 20px rgba(0,217,255,0.15)"
                   }}>
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <span className="font-display font-bold text-xs tracking-wider" style={{ color: "hsl(var(--primary))" }}>
                EARN MORE
              </span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                Complete quick missions for extra credits
              </span>
              <div className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-full"
                   style={{
                     background: "rgba(0,217,255,0.1)",
                     border: "1px solid rgba(0,217,255,0.2)"
                   }}>
                <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--primary))" }}>VIEW MISSIONS</span>
                <ChevronRight className="w-3 h-3 text-primary" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile: Earn More bottom bar */}
        <div className="md:hidden mt-3 flex gap-2">
          <button
            onClick={() => setShowMissions(true)}
            className="flex-1 rounded-xl py-3 px-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, rgba(0,217,255,0.08), rgba(0,20,40,0.8))",
              border: "1px solid rgba(0,217,255,0.2)",
              boxShadow: "0 0 15px rgba(0,217,255,0.05)"
            }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                 style={{
                   background: "rgba(0,217,255,0.1)",
                   border: "1px solid rgba(0,217,255,0.2)"
                 }}>
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-display font-bold text-xs tracking-wider block" style={{ color: "hsl(var(--primary))" }}>EARN MORE CREDITS</span>
              <span className="text-[10px] text-muted-foreground">Complete missions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
          </button>
        </div>

        {/* Missions overlay */}
        <AnimatePresence>
          {showMissions && <SpinMissions onClose={() => setShowMissions(false)} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SpinWheel;
