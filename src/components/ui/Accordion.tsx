import { motion } from "framer-motion";
import { ArrowUpRight, Clock, ExternalLink } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";

const NewsSection = () => {
  const { news } = useDataStore();

  return (
    <section id="berita" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-muted-foreground/60 tracking-widest uppercase mb-3">02</p>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gradient">Berita Utama</h2>
          <div className="glow-line w-24 mx-auto mt-6" />
        </motion.div>

        <div className="space-y-6 max-w-3xl mx-auto">
          {news.map((item, i) => {
            const Wrapper = item.link ? "a" : "div";
            const wrapperProps = item.link ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <Wrapper
                  {...wrapperProps}
                  className="glass-card rounded-lg overflow-hidden group hover:bg-accent/40 transition-all duration-500 cursor-pointer block"
                >
                  {item.imageUrl && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider bg-secondary px-3 py-1 rounded-full">
                          {item.tag}
                        </span>
                        <h3 className="text-xl font-display font-semibold text-foreground mt-3 mb-2 group-hover:text-gradient transition-all">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.excerpt}</p>
                        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground/50">
                          <Clock size={12} />
                          <span>{item.date}</span>
                          {item.link && (
                            <span className="flex items-center gap-1 text-primary/50">
                              <ExternalLink size={10} /> Baca selengkapnya
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors flex-shrink-0 mt-2" size={20} />
                    </div>
                  </div>
                </Wrapper>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
