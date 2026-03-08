import { motion } from "framer-motion";
import { Camera, Newspaper, Bot, Film, Mic, Radio } from "lucide-react";

const FloatingElements = () => {
  const elements = [
    { Icon: Newspaper, className: "top-[5%] left-[3%]", size: 80, duration: 9, delay: 0, rotate: 12 },
    { Icon: Camera, className: "top-[15%] right-[8%]", size: 70, duration: 7, delay: 1, rotate: -8 },
    { Icon: Bot, className: "top-[55%] left-[6%]", size: 65, duration: 8, delay: 2, rotate: 10 },
    { Icon: Newspaper, className: "top-[35%] right-[3%]", size: 90, duration: 10, delay: 0.5, rotate: -15 },
    { Icon: Camera, className: "top-[70%] right-[12%]", size: 60, duration: 6, delay: 1.5, rotate: 6 },
    { Icon: Newspaper, className: "top-[80%] left-[15%]", size: 75, duration: 11, delay: 3, rotate: -10 },
    { Icon: Camera, className: "top-[45%] left-[25%]", size: 55, duration: 7.5, delay: 2.5, rotate: 18 },
    { Icon: Bot, className: "top-[25%] left-[50%]", size: 50, duration: 8.5, delay: 0.8, rotate: -5 },
    { Icon: Newspaper, className: "top-[90%] right-[30%]", size: 85, duration: 9.5, delay: 4, rotate: 8 },
    { Icon: Camera, className: "top-[10%] left-[70%]", size: 65, duration: 6.5, delay: 1.2, rotate: -12 },
    { Icon: Film, className: "top-[65%] left-[45%]", size: 45, duration: 8, delay: 3.5, rotate: 15 },
    { Icon: Mic, className: "top-[50%] right-[25%]", size: 50, duration: 7, delay: 2.2, rotate: -7 },
    { Icon: Radio, className: "top-[30%] right-[40%]", size: 40, duration: 9, delay: 1.8, rotate: 9 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute ${el.className}`}
          animate={{
            y: [0, -35, 5, -20, 0],
            rotate: [0, el.rotate, -el.rotate / 2, el.rotate / 3, 0],
            scale: [1, 1.05, 0.97, 1.02, 1],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: el.delay,
          }}
        >
          <el.Icon
            size={el.size}
            className="text-foreground/[0.06] stroke-[0.6]"
            style={{ filter: "blur(0.5px)" }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingElements;
