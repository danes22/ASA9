import { motion, type Transition } from "framer-motion";
import { Camera, Lightbulb, Newspaper, Mic, PenTool, BookOpen, Radio, Film } from "lucide-react";

const makeFloat = (duration: number, delay = 0, y = -20, rotate = 2) => ({
  y: [0, y, 0],
  rotate: [0, rotate, 0],
  transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay } as Transition,
});

const FloatingElements = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">

      {/* ===== BLOB BACKGROUNDS ===== */}
      <motion.div animate={makeFloat(8, 0, -30, 3)} style={{ willChange: "transform" }}
        className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-foreground/[0.03] blur-3xl" />
      <motion.div animate={makeFloat(6, 1, -20, -2)} style={{ willChange: "transform" }}
        className="absolute top-[30%] right-[8%] w-96 h-96 rounded-full bg-foreground/[0.025] blur-3xl" />
      <motion.div animate={makeFloat(8, 2, -25, 2)} style={{ willChange: "transform" }}
        className="absolute bottom-[20%] left-[15%] w-80 h-80 rounded-full bg-foreground/[0.03] blur-3xl" />
      <motion.div animate={makeFloat(10, 3, -15, -1)} style={{ willChange: "transform" }}
        className="absolute top-[60%] right-[30%] w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />

      {/* ===== IKON BESAR ===== */}
      <motion.div animate={makeFloat(7, 0, -28, 6)} style={{ willChange: "transform" }}
        className="absolute top-[12%] right-[10%] text-foreground/[0.12]">
        <Camera size={80} strokeWidth={0.8} />
      </motion.div>

      <motion.div animate={makeFloat(9, 1.5, -22, -5)} style={{ willChange: "transform" }}
        className="absolute bottom-[20%] right-[15%] text-foreground/[0.12]">
        <Newspaper size={90} strokeWidth={0.8} />
      </motion.div>

      <motion.div animate={makeFloat(6, 0.8, -20, 4)} style={{ willChange: "transform" }}
        className="absolute top-[45%] left-[4%] text-foreground/[0.12]">
        <Lightbulb size={70} strokeWidth={0.8} />
      </motion.div>

      <motion.div animate={makeFloat(8, 2.5, -18, -3)} style={{ willChange: "transform" }}
        className="absolute top-[25%] left-[18%] text-foreground/[0.10]">
        <Mic size={64} strokeWidth={0.8} />
      </motion.div>

      <motion.div animate={makeFloat(7, 1, -25, 5)} style={{ willChange: "transform" }}
        className="absolute bottom-[35%] left-[8%] text-foreground/[0.10]">
        <Radio size={72} strokeWidth={0.8} />
      </motion.div>

      {/* ===== IKON SEDANG ===== */}
      <motion.div animate={makeFloat(5, 2, -15, -4)} style={{ willChange: "transform" }}
        className="absolute bottom-[45%] left-[22%] text-foreground/[0.08]">
        <Camera size={44} strokeWidth={1} />
      </motion.div>

      <motion.div animate={makeFloat(8, 0.5, -14, 3)} style={{ willChange: "transform" }}
        className="absolute top-[68%] right-[6%] text-foreground/[0.08]">
        <Newspaper size={48} strokeWidth={1} />
      </motion.div>

      <motion.div animate={makeFloat(6, 1.8, -16, -2)} style={{ willChange: "transform" }}
        className="absolute top-[20%] right-[30%] text-foreground/[0.08]">
        <PenTool size={40} strokeWidth={1} />
      </motion.div>

      <motion.div animate={makeFloat(7, 3, -12, 3)} style={{ willChange: "transform" }}
        className="absolute bottom-[12%] left-[35%] text-foreground/[0.08]">
        <BookOpen size={50} strokeWidth={1} />
      </motion.div>

      <motion.div animate={makeFloat(5, 0.3, -18, -3)} style={{ willChange: "transform" }}
        className="absolute top-[80%] left-[12%] text-foreground/[0.07]">
        <Film size={42} strokeWidth={1} />
      </motion.div>

      <motion.div animate={makeFloat(9, 2.2, -10, 2)} style={{ willChange: "transform" }}
        className="absolute top-[38%] right-[4%] text-foreground/[0.07]">
        <Mic size={36} strokeWidth={1} />
      </motion.div>

      {/* ===== DOT DECORATIONS ===== */}
      <motion.div animate={makeFloat(4, 0, -15, 2)} style={{ willChange: "transform" }}
        className="absolute top-[20%] right-[22%] w-2 h-2 rounded-full bg-foreground/25" />
      <motion.div animate={makeFloat(6, 0.5, -12, -1)} style={{ willChange: "transform" }}
        className="absolute top-[55%] left-[8%] w-1.5 h-1.5 rounded-full bg-foreground/20" />
      <motion.div animate={makeFloat(4, 1.5, -15, 2)} style={{ willChange: "transform" }}
        className="absolute bottom-[30%] right-[25%] w-2 h-2 rounded-full bg-foreground/25" />
      <motion.div animate={makeFloat(5, 0.8, -10, -2)} style={{ willChange: "transform" }}
        className="absolute top-[75%] right-[35%] w-1.5 h-1.5 rounded-full bg-foreground/20" />
      <motion.div animate={makeFloat(7, 2, -8, 1)} style={{ willChange: "transform" }}
        className="absolute bottom-[55%] right-[45%] w-1 h-1 rounded-full bg-foreground/15" />

      {/* ===== GRID PATTERN ===== */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />
    </div>
  );
};

export default FloatingElements;