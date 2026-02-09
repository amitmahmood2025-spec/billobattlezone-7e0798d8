import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SpinWheelProps {
  onClose: () => void;
}

const PRIZES = [
  { credits: 5, color: "#00d9ff", label: "5" },
  { credits: 10, color: "#00ff88", label: "10" },
  { credits: 15, color: "#ff6b6b", label: "15" },
  { credits: 25, color: "#ffd93d", label: "25" },
  { credits: 50, color: "#6c5ce7", label: "50" },
  { credits: 75, color: "#fd79a8", label: "75" },
  { credits: 100, color: "#00cec9", label: "100" },
  { credits: 5, color: "#e17055", label: "5" },
];

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    drawWheel();
  }, [rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / PRIZES.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw slices
    PRIZES.forEach((prize, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Orbitron";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.label, radius - 20, 6);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX - 15, 35);
    ctx.lineTo(centerX + 15, 35);
    ctx.closePath();
    ctx.fillStyle = "#00d9ff";
    ctx.fill();
    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 10;
  };

  const spin = async () => {
    if (!user) return;

    try {
      setSpinning(true);
      setResult(null);

      // Call spin endpoint
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
        throw new Error(data.error || "Failed to spin");
      }

      // Find prize index
      const prizeIndex = PRIZES.findIndex((p) => p.credits === data.prize.credits);
      const sliceAngle = 360 / PRIZES.length;
      const targetAngle = 360 - prizeIndex * sliceAngle - sliceAngle / 2;
      const spins = 5; // Number of full rotations
      const finalRotation = rotation + 360 * spins + targetAngle;

      // Animate rotation
      let currentRotation = rotation;
      const duration = 5000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = rotation + (finalRotation - rotation) * eased;
        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setResult(data.prize.credits);
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
          });
          toast.success(`You won ${data.prize.credits} Credits!`);
          setSpinning(false);
        }
      };

      animate();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl p-6 max-w-md w-full text-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-xl">Spin the Wheel!</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mx-auto mb-6" style={{ width: 280, height: 280 }}>
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="drop-shadow-2xl"
          />
        </div>

        {result !== null ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4"
          >
            <p className="text-lg text-muted-foreground">You won</p>
            <p className="font-display font-bold text-4xl text-primary">
              {result} Credits!
            </p>
          </motion.div>
        ) : (
          <p className="text-muted-foreground mb-4">
            Try your luck! 1 free spin per day.
          </p>
        )}

        <Button
          onClick={result !== null ? onClose : spin}
          disabled={spinning}
          className="w-full h-12 font-display font-bold text-lg shadow-neon"
        >
          {spinning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : result !== null ? (
            "Collect & Close"
          ) : (
            "SPIN!"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SpinWheel;
