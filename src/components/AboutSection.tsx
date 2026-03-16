import { motion } from "framer-motion";
import { Camera, Newspaper, Users, Award, Lightbulb } from "lucide-react";

const features = [
  { icon: Camera, title: "Fotografi", desc: "Mengabadikan momen dengan sudut pandang kreatif" },
  { icon: Users, title: "Broadcasting", desc: "Siaran dan konten multimedia profesional" },
  { icon: Lightbulb, title: "Kreatif", desc: "Menyunting dan menyempurnakan konten secara kreatif" },
  { icon: Award, title: "Kompetisi", desc: "Berprestasi di berbagai lomba jurnalistik" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-muted-foreground/60 tracking-widest uppercase mb-3">01</p>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gradient">About Us</h2>
          <div className="glow-line w-24 mx-auto mt-6" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-lg leading-relaxed"
        >
          ASA 9 adalah ekstrakurikuler jurnalistik SMAN 9 yang berdedikasi dalam dunia media, 
          fotografi, dan broadcasting. Kami menciptakan konten kreatif yang menginspirasi 
          dan menyuarakan aspirasi siswa.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="glass-card rounded-lg p-8 text-center group hover:bg-accent/50 transition-colors duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-5 group-hover:bg-foreground/10 transition-colors">
                <f.icon className="text-foreground/70" size={24} />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

