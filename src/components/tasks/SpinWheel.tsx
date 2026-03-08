import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Loader2, Clock, Zap, Gift, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SpinMissions from "./SpinMissions";

interface SpinWheelProps {
  onClose: () => void;
}

// Visual prizes on wheel - mix of flashy + low value
const WHEEL_SEGMENTS = [
  { label: "2", color: "hsl(var(--primary))", textColor: "#fff" },
  { label: "50", color: "hsl(190 100% 20%)", textColor: "hsl(var(--primary))" },
  { label: "3", color: "hsl(var(--neon-green))", textColor: "#fff" },
  { label: "75", color: "hsl(190 100% 15%)", textColor: "hsl(var(--primary))" },
  { label: "4", color: "hsl(var(--primary))", textColor: "#fff" },
  { label: "100", color: "hsl(190 100% 18%)", textColor: "hsl(var(--primary))" },
  { label: "5", color: "hsl(142 71% 45%)", textColor: "#fff" },
  { label: "25", color: "hsl(190 100% 15%)", textColor: "hsl(var(--primary))" },
  { label: "3", color: "hsl(var(--primary))", textColor: "#fff" },
  { label: "10", color: "hsl(190 100% 20%)", textColor: "hsl(var(--primary))" },
  { label: "2", color: "hsl(142 71% 45%)", textColor: "#fff" },
  { label: "15", color: "hsl(190 100% 15%)", textColor: "hsl(var(--primary))" },
];

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showMissions, setShowMissions] = useState(false);
  const [nextSpinTime, setNextSpinTime] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  // Calculate next spin countdown
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

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 12;
    const segments = WHEEL_SEGMENTS.length;
    const sliceAngle = (2 * Math.PI) / segments;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 3;
    ctx.shadowColor = "hsl(var(--primary))";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    // Second glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "hsl(var(--primary) / 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // Draw segments
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const start = i * sliceAngle - Math.PI / 2;
      const end = start + sliceAngle;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "hsl(var(--primary) / 0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Segment text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = seg.textColor;
      ctx.font = "bold 16px 'Orbitron', monospace";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, r * 0.65, 5);
      ctx.restore();

      // Small dot dividers
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start);
      ctx.beginPath();
      ctx.arc(r - 5, 0, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(var(--primary))";
      ctx.fill();
      ctx.restore();
    });

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.28);
    grad.addColorStop(0, "hsl(222 47% 14%)");
    grad.addColorStop(1, "hsl(222 47% 8%)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    ctx.shadowColor = "hsl(var(--primary))";
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Center text
    ctx.shadowBlur = 0;
    ctx.font = "bold 13px 'Orbitron', monospace";
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.textAlign = "center";
    ctx.fillText("SPIN", cx, cy - 4);
    ctx.fillText("NOW", cx, cy + 12);

    ctx.restore();

    // Pointer (top)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 12, 30);
    ctx.lineTo(cx + 12, 30);
    ctx.closePath();
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.shadowColor = "hsl(var(--primary))";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();
  }, [rotation]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

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
          // Set countdown to tomorrow midnight
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          setNextSpinTime(tomorrow.toISOString());
        }
        throw new Error(data.error || "Failed to spin");
      }

      // Find matching segment index for landing
      const wonCredits = data.prize.credits;
      const segIdx = WHEEL_SEGMENTS.findIndex((s) => s.label === String(wonCredits));
      const sliceAngle = 360 / WHEEL_SEGMENTS.length;
      const targetAngle = 360 - segIdx * sliceAngle - sliceAngle / 2;
      const spins = 6;
      const finalRotation = rotation + 360 * spins + targetAngle;

      let start: number | null = null;
      const duration = 6000;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setRotation(rotation + (finalRotation - rotation) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setResult(wonCredits);
          confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ["#00d9ff", "#00ff88", "#ffd93d"] });
          toast.success(`🎉 You won ${wonCredits} Credits!`);
          setSpinning(false);
          // Set next spin countdown
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && !spinning && onClose()}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div>
            <h2 className="font-display font-bold text-xl tracking-wider text-primary neon-text">
              DAILY LUCKY SPIN
            </h2>
            <p className="text-xs text-muted-foreground">Win credits every day!</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main content - wheel + missions side panel */}
        <div className="flex gap-3">
          {/* Wheel area */}
          <div className="flex-1 glass rounded-2xl p-4 neon-border relative overflow-hidden">
            {/* Subtle background particles */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                />
              ))}
            </div>

            {/* Canvas wheel */}
            <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
              <canvas ref={canvasRef} width={280} height={280} />
            </div>

            {/* Result or countdown */}
            <div className="mt-4 text-center min-h-[60px]">
              <AnimatePresence mode="wait">
                {result !== null ? (
                  <motion.div key="result" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}>
                    <p className="text-sm text-muted-foreground">You won</p>
                    <p className="font-display font-bold text-3xl text-primary neon-text">{result} Credits!</p>
                  </motion.div>
                ) : countdown ? (
                  <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Next spin in</span>
                    <span className="font-display font-bold text-primary text-lg tracking-widest">{countdown}</span>
                  </motion.div>
                ) : (
                  <motion.p key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                    🎰 Try your luck! 1 free spin per day.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Spin / Close button */}
            <Button
              onClick={result !== null ? onClose : spin}
              disabled={spinning || !!countdown}
              className="w-full h-12 font-display font-bold text-base tracking-wider shadow-neon mt-2"
            >
              {spinning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : result !== null ? (
                <>Collect & Close</>
              ) : countdown ? (
                <><Clock className="w-4 h-4 mr-2" /> COME BACK LATER</>
              ) : (
                <><Zap className="w-5 h-5 mr-2" /> SPIN!</>
              )}
            </Button>
          </div>

          {/* Earn More Spins side panel (desktop) */}
          <div className="hidden md:flex flex-col w-44">
            <Button
              variant="outline"
              className="w-full h-full neon-border font-display text-xs flex flex-col gap-2 py-4 hover:bg-primary/10"
              onClick={() => setShowMissions(true)}
            >
              <Gift className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold">EARN MORE</span>
              <span className="text-muted-foreground">Complete missions</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* Earn More button (mobile) */}
        <div className="md:hidden mt-3">
          <Button
            variant="outline"
            className="w-full neon-border font-display text-sm flex items-center gap-3 py-3"
            onClick={() => setShowMissions(true)}
          >
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-primary font-bold">EARN MORE CREDITS</span>
            <ChevronRight className="w-4 h-4 text-primary ml-auto" />
          </Button>
        </div>

        {/* Missions panel */}
        <AnimatePresence>
          {showMissions && <SpinMissions onClose={() => setShowMissions(false)} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SpinWheel;
