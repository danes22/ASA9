import { motion } from "framer-motion";
import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";

const GallerySection = () => {
  const { gallery } = useDataStore();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedItem = gallery.find(g => g.id === selected);

  return (
    <section id="galeri" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-muted-foreground/60 tracking-widest uppercase mb-3">04</p>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gradient">Galeri</h2>
          <div className="glow-line w-24 mx-auto mt-6" />
        </motion.div>

        <div className="columns-2 md:columns-3 gap-4 max-w-4xl mx-auto">
          {gallery.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="mb-4 break-inside-avoid"
            >
              <div
                onClick={() => setSelected(item.id)}
                className={`${item.aspect} relative rounded-lg overflow-hidden cursor-pointer group bg-secondary`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground/30 font-mono text-xs">{item.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-sm font-display font-medium text-foreground">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{item.description}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selected !== null && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
          >
            <button className="absolute top-6 right-6 text-foreground/60 hover:text-foreground transition-colors">
              <X size={28} />
            </button>
            <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground font-mono text-sm">{selectedItem.title}</span>
                )}
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-display font-semibold text-foreground">{selectedItem.title}</h3>
                {selectedItem.description && <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>}
                {selectedItem.link && (
                  <a href={selectedItem.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary/70 hover:text-primary mt-3 transition-colors">
                    <ExternalLink size={14} /> Lihat selengkapnya
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
