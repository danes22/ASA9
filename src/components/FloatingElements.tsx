import { motion, type Transition } from "framer-motion";

const makeFloat = (duration: number, delay = 0, y = -20, rotate = 2) => ({
  y: [0, y, 0],
  rotate: [0, rotate, 0],
  transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay } as Transition,
});

const FloatingElements = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <motion.div animate={makeFloat(8, 0, -30, 3)} style={{ willChange: "transform" }}
        className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />
      <motion.div animate={makeFloat(6, 1, -20, -2)} style={{ willChange: "transform" }}
        className="absolute top-[30%] right-[8%] w-96 h-96 rounded-full bg-foreground/[0.015] blur-3xl" />
      <motion.div animate={makeFloat(8, 2, -25, 2)} style={{ willChange: "transform" }}
        className="absolute bottom-[20%] left-[15%] w-80 h-80 rounded-full bg-foreground/[0.02] blur-3xl" />
      <motion.div animate={makeFloat(4, 0, -15, 2)} style={{ willChange: "transform" }}
        className="absolute top-[20%] right-[20%] w-2 h-2 rounded-full bg-foreground/20" />
      <motion.div animate={makeFloat(6, 0.5, -12, -1)} style={{ willChange: "transform" }}
        className="absolute top-[60%] left-[8%] w-1.5 h-1.5 rounded-full bg-foreground/15" />
      <motion.div animate={makeFloat(4, 1.5, -15, 2)} style={{ willChange: "transform" }}
        className="absolute bottom-[35%] right-[12%] w-2 h-2 rounded-full bg-foreground/20" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />
    </div>
  );
};

export default FloatingElements;