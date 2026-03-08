import { motion } from "framer-motion";
import { MessageSquare, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useDataStore } from "@/lib/dataStore";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

const feedbackSchema = z.object({
  name: z.string().trim().max(50, "Nama maksimal 50 karakter").optional(),
  feedback: z.string().trim().min(1, "Kritik/saran tidak boleh kosong").max(1000, "Maksimal 1000 karakter"),
});

const FeedbackSection = () => {
  const { addFeedback } = useDataStore();
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = feedbackSchema.safeParse({ name: name || undefined, feedback });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const limit = checkRateLimit("feedback", 5, 60_000, 180_000);
    if (!limit.allowed) {
      toast.error("Terlalu banyak pengiriman! Coba lagi nanti.");
      return;
    }

    setSending(true);
    setTimeout(() => {
      addFeedback({ name: name.trim() ? sanitizeInput(name) : undefined, feedback: sanitizeInput(feedback) });
      toast.success("Terima kasih atas masukan Anda! 🙏");
      setName("");
      setFeedback("");
      setSending(false);
    }, 800);
  };

  return (
    <section id="feedback" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-muted-foreground/60 tracking-widest uppercase mb-3">05</p>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gradient">Kritik & Saran</h2>
          <div className="glow-line w-24 mx-auto mt-6" />
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="glass-card rounded-lg p-8 md:p-12 max-w-xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-muted-foreground" size={20} />
              <span className="text-sm text-muted-foreground font-mono">Suaramu penting bagi kami</span>
            </div>
            <ShieldCheck className="text-muted-foreground/30" size={16} />
          </div>

          <div className="space-y-5">
            <div>
              <input type="text" placeholder="Nama (opsional)" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} className="w-full bg-secondary/50 border border-border/50 rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50 transition-all" />
              {errors.name && <p className="text-xs text-destructive mt-1.5 font-mono">{errors.name}</p>}
            </div>
            <div>
              <textarea placeholder="Tulis kritik atau saran kamu di sini..." value={feedback} maxLength={1000} onChange={(e) => setFeedback(e.target.value)} rows={5} className="w-full bg-secondary/50 border border-border/50 rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50 transition-all resize-none" />
              <p className="text-xs text-muted-foreground/30 text-right mt-1 font-mono">{feedback.length}/1000</p>
              {errors.feedback && <p className="text-xs text-destructive mt-1 font-mono">{errors.feedback}</p>}
            </div>
            <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-foreground text-background font-display font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-50">
              {sending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
              ) : (
                <><Send size={16} /> Kirim</>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default FeedbackSection;

