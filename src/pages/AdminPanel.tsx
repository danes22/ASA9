import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Newspaper, MessageSquare, Image, Plus, Trash2, Edit2, Save, X, ArrowLeft, Link as LinkIcon, ImageIcon, Upload, ShieldAlert, Timer, KeyRound } from "lucide-react";
import { useDataStore, NewsItem, GalleryItem } from "@/lib/dataStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  sanitizeInput,
  isValidSafeUrl,
  checkRateLimit,
  resetRateLimit,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  validateFileUpload,
  hardenRuntime,
  isPasswordSet,
  setAdminPassword,
  resetAdminPassword,
} from "@/lib/security";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const handleFileSelect = (file: File, onResult: (dataUrl: string) => void) => {
  const error = validateFileUpload(file, 2);
  if (error) { toast.error(error); return; }
  const reader = new FileReader();
  reader.onload = () => { if (typeof reader.result === "string") onResult(reader.result); };
  reader.onerror = () => toast.error("Gagal membaca file!");
  reader.readAsDataURL(file);
};

const AdminPanel = () => {
  const [authenticated, setAuthenticated] = useState(() => validateSession());
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [lockoutTime, setLockoutTime] = useState(0);
  const [tab, setTab] = useState<"news" | "feedback" | "gallery">("news");
  const [mode, setMode] = useState<"login" | "setup" | "reset">(isPasswordSet() ? "login" : "setup");

  // Runtime hardening on mount
  useEffect(() => { hardenRuntime(); }, []);

  // Session validation interval
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      if (!validateSession()) {
        setAuthenticated(false);
        toast.error("Sesi telah berakhir. Silakan login kembali.");
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const interval = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleSetup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password minimal 6 karakter!"); return; }
    if (password !== confirmPw) { toast.error("Konfirmasi password tidak cocok!"); return; }
    await setAdminPassword(password);
    createSession();
    setAuthenticated(true);
    setPassword("");
    setConfirmPw("");
    toast.success("Password berhasil dibuat! Anda sudah login.");
  }, [password, confirmPw]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const limit = checkRateLimit("admin_login", 5, 60_000, 300_000);
    if (!limit.allowed) {
      setLockoutTime(limit.lockedUntilMs);
      toast.error("Terlalu banyak percobaan! Coba lagi nanti.");
      setPassword("");
      return;
    }

    const valid = await verifyPassword(password);
    if (valid) {
      resetRateLimit("admin_login");
      createSession();
      setAuthenticated(true);
      toast.success("Login berhasil!");
    } else {
      toast.error(`Password salah! (${limit.remainingAttempts} percobaan tersisa)`);
      setPassword("");
    }
  }, [password]);

  const handleReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password baru minimal 6 karakter!"); return; }
    if (password !== confirmPw) { toast.error("Konfirmasi password tidak cocok!"); return; }
    await setAdminPassword(password);
    createSession();
    setAuthenticated(true);
    setPassword("");
    setConfirmPw("");
    toast.success("Password berhasil direset! Anda sudah login.");
  }, [password, confirmPw]);

  const handleLogout = useCallback(() => {
    destroySession();
    setAuthenticated(false);
    setMode(isPasswordSet() ? "login" : "setup");
    toast.success("Logout berhasil.");
  }, []);

  if (lockoutTime > 0) {
    const minutes = Math.floor(lockoutTime / 60_000);
    const seconds = Math.ceil((lockoutTime % 60_000) / 1000);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-lg p-12 text-center max-w-md">
          <ShieldAlert className="text-destructive mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Akses Diblokir Sementara</h2>
          <p className="text-sm text-muted-foreground mb-4">Terlalu banyak percobaan login gagal.</p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Timer size={16} />
            <span className="font-mono text-lg">{minutes}:{seconds.toString().padStart(2, "0")}</span>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4">Coba lagi setelah waktu habis</p>
          <Link to="/" className="flex items-center gap-2 justify-center mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={12} /> Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-lg p-12 max-w-sm w-full">
          <Lock className="text-muted-foreground mx-auto mb-6" size={40} />
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">
            {mode === "setup" ? "Buat Password" : mode === "reset" ? "Reset Password" : "Admin Panel"}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-8 font-mono">
            {mode === "setup" ? "Buat password admin baru" : mode === "reset" ? "Masukkan password baru" : "ASA 9 — Akses Terbatas"}
          </p>

          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)}
                maxLength={50} autoComplete="current-password"
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50 mb-4" />
              <button type="submit" className="w-full bg-foreground text-background font-display font-semibold py-3 rounded-lg hover:bg-foreground/90 transition-colors">Masuk</button>
              <button type="button" onClick={() => { setMode("reset"); setPassword(""); }} className="w-full text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
                Lupa / Reset Password
              </button>
            </form>
          )}

          {(mode === "setup" || mode === "reset") && (
            <form onSubmit={mode === "setup" ? handleSetup : handleReset}>
              <input type="password" placeholder="Password baru (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)}
                maxLength={50} autoComplete="new-password"
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50 mb-3" />
              <input type="password" placeholder="Konfirmasi password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                maxLength={50} autoComplete="new-password"
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50 mb-4" />
              <button type="submit" className="w-full bg-foreground text-background font-display font-semibold py-3 rounded-lg hover:bg-foreground/90 transition-colors">
                {mode === "setup" ? "Buat Password" : "Reset Password"}
              </button>
              {mode === "reset" && (
                <button type="button" onClick={() => { setMode("login"); setPassword(""); setConfirmPw(""); }} className="w-full text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
                  Kembali ke Login
                </button>
              )}
            </form>
          )}

          <Link to="/" className="flex items-center gap-2 justify-center mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={12} /> Kembali ke beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { key: "news" as const, label: "Berita", icon: Newspaper },
    { key: "feedback" as const, label: "Feedback", icon: MessageSquare },
    { key: "gallery" as const, label: "Galeri", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground font-mono">ASA 9 Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">← Beranda</Link>
            <button onClick={() => { destroySession(); setAuthenticated(false); setMode("reset"); }}
              className="text-xs bg-secondary text-muted-foreground px-4 py-2 rounded-lg hover:text-foreground transition-colors font-mono flex items-center gap-1"><KeyRound size={12} /> Ganti Password</button>
            <button onClick={handleLogout}
              className="text-xs bg-secondary text-muted-foreground px-4 py-2 rounded-lg hover:text-foreground transition-colors font-mono">Logout</button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-medium transition-all whitespace-nowrap ${tab === t.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {tab === "news" && <NewsManager />}
            {tab === "feedback" && <FeedbackViewer />}
            {tab === "gallery" && <GalleryManager />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const inputClass = "w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50";

const newsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().min(1).max(500),
  tag: z.string().trim().min(1).max(30),
  imageUrl: z.string().max(500).optional(),
  link: z.string().max(500).optional(),
});

function NewsManager() {
  const { news, setNews } = useDataStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", tag: "", imageUrl: "", link: "" });

  const validateForm = () => {
    const result = newsSchema.safeParse(form);
    if (!result.success) { toast.error("Isi semua field wajib dengan benar!"); return false; }
    if (form.imageUrl && !isValidSafeUrl(form.imageUrl)) { toast.error("URL gambar tidak valid atau tidak aman!"); return false; }
    if (form.link && !isValidSafeUrl(form.link)) { toast.error("URL link tidak valid atau tidak aman!"); return false; }
    return true;
  };

  const addNews = () => {
    if (!validateForm()) return;
    const item: NewsItem = {
      id: crypto.randomUUID(), title: sanitizeInput(form.title), excerpt: sanitizeInput(form.excerpt),
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      tag: sanitizeInput(form.tag), imageUrl: form.imageUrl.trim() || undefined, link: form.link.trim() || undefined,
    };
    setNews([item, ...news]);
    setForm({ title: "", excerpt: "", tag: "", imageUrl: "", link: "" });
    toast.success("Berita ditambahkan!");
  };

  const saveEdit = (id: string) => {
    if (!validateForm()) return;
    setNews(news.map(n => n.id === id ? {
      ...n, title: sanitizeInput(form.title), excerpt: sanitizeInput(form.excerpt), tag: sanitizeInput(form.tag),
      imageUrl: form.imageUrl.trim() || undefined, link: form.link.trim() || undefined,
    } : n));
    setEditing(null);
    toast.success("Berita diperbarui!");
  };

  const deleteNews = (id: string) => { setNews(news.filter(n => n.id !== id)); toast.success("Berita dihapus!"); };

  const FormFields = ({ showSave, onSave }: { showSave?: boolean; onSave?: () => void }) => (
    <div className="space-y-3">
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} placeholder="Judul berita *" className={inputClass} />
      <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} maxLength={500} placeholder="Ringkasan *" rows={2} className={`${inputClass} resize-none`} />
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={form.imageUrl.startsWith("data:") ? "📷 File terpilih" : form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} maxLength={500} placeholder="URL Gambar (opsional)" className={`${inputClass} pl-9 pr-20`} readOnly={form.imageUrl.startsWith("data:")} />
            <label className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors">
              <Upload size={12} /> File
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, url => setForm(prev => ({ ...prev, imageUrl: url }))); e.target.value = ""; }} />
            </label>
          </div>
          <div className="relative">
            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} maxLength={500} placeholder="Link artikel (opsional)" className={`${inputClass} pl-9`} />
          </div>
        </div>
        {form.imageUrl && (form.imageUrl.startsWith("data:") ? true : isValidSafeUrl(form.imageUrl)) && (
          <div className="relative rounded-lg overflow-hidden border border-border/30 max-h-40">
            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            {form.imageUrl.startsWith("data:") && <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-muted-foreground hover:text-destructive"><X size={14} /></button>}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} maxLength={30} placeholder="Tag (misal: Prestasi) *" className={`flex-1 ${inputClass}`} />
        {showSave ? (
          <div className="flex gap-2">
            <button onClick={onSave} className="text-foreground hover:text-foreground/80"><Save size={18} /></button>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
        ) : (
          <button onClick={addNews} className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors">Tambah</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Plus size={16} /> Tambah Berita</h3>
        <FormFields />
      </div>

      {news.map(item => (
        <div key={item.id} className="glass-card rounded-lg p-6">
          {editing === item.id ? (
            <FormFields showSave onSave={() => saveEdit(item.id)} />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">{item.tag}</span>
                <h4 className="font-display font-semibold text-foreground mt-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{item.excerpt}</p>
                {item.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border/30 max-h-32">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-muted-foreground/40 font-mono">{item.date}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                      <LinkIcon size={10} /> Link
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setEditing(item.id); setForm({ title: item.title, excerpt: item.excerpt, tag: item.tag, imageUrl: item.imageUrl || "", link: item.link || "" }); }} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => deleteNews(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeedbackViewer() {
  const { feedbacks } = useDataStore();
  return (
    <div className="space-y-4">
      {feedbacks.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <MessageSquare className="text-muted-foreground/30 mx-auto mb-3" size={40} />
          <p className="text-muted-foreground text-sm">Belum ada kritik & saran.</p>
        </div>
      ) : feedbacks.map(fb => (
        <div key={fb.id} className="glass-card rounded-lg p-6">
          <p className="text-foreground text-sm">{fb.feedback}</p>
          <div className="flex items-center gap-3 mt-3">
            {fb.name && <span className="text-xs text-muted-foreground font-mono">— {fb.name}</span>}
            <span className="text-xs text-muted-foreground/40 font-mono">{new Date(fb.createdAt).toLocaleDateString("id-ID")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const gallerySchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(500).optional(),
  link: z.string().max(500).optional(),
});

function GalleryManager() {
  const { gallery, setGallery } = useDataStore();
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", link: "" });
  const aspects = ["aspect-square", "aspect-[4/5]", "aspect-video"];
  const [aspect, setAspect] = useState(aspects[0]);

  const addItem = () => {
    const result = gallerySchema.safeParse(form);
    if (!result.success) { toast.error("Isi judul galeri!"); return; }
    if (form.imageUrl && !isValidSafeUrl(form.imageUrl)) { toast.error("URL gambar tidak valid atau tidak aman!"); return; }
    if (form.link && !isValidSafeUrl(form.link)) { toast.error("URL link tidak valid atau tidak aman!"); return; }
    const item: GalleryItem = {
      id: crypto.randomUUID(), title: sanitizeInput(form.title), description: sanitizeInput(form.description) || undefined,
      aspect, imageUrl: form.imageUrl.trim() || undefined, link: form.link.trim() || undefined,
    };
    setGallery([...gallery, item]);
    setForm({ title: "", description: "", imageUrl: "", link: "" });
    toast.success("Item galeri ditambahkan!");
  };

  const deleteItem = (id: string) => { setGallery(gallery.filter(g => g.id !== id)); toast.success("Item galeri dihapus!"); };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Plus size={16} /> Tambah Item Galeri</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={100} placeholder="Judul foto *" className={`flex-1 ${inputClass}`} />
            <select value={aspect} onChange={e => setAspect(e.target.value)} className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none">
              <option value="aspect-square">Square</option>
              <option value="aspect-[4/5]">Portrait</option>
              <option value="aspect-video">Landscape</option>
            </select>
          </div>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={300} placeholder="Deskripsi kegiatan (opsional)" className={inputClass} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input value={form.imageUrl.startsWith("data:") ? "📷 File terpilih" : form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} maxLength={500} placeholder="URL Gambar / Link GDrive" className={`${inputClass} pl-9 pr-20`} readOnly={form.imageUrl.startsWith("data:")} />
              <label className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors">
                <Upload size={12} /> File
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, url => setForm(prev => ({ ...prev, imageUrl: url }))); e.target.value = ""; }} />
              </label>
            </div>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} maxLength={500} placeholder="Link terkait (opsional)" className={`${inputClass} pl-9`} />
            </div>
          </div>
          {form.imageUrl && (form.imageUrl.startsWith("data:") ? true : isValidSafeUrl(form.imageUrl)) && (
            <div className="relative rounded-lg overflow-hidden border border-border/30 max-h-32">
              <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              {form.imageUrl.startsWith("data:") && <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-muted-foreground hover:text-destructive"><X size={14} /></button>}
            </div>
          )}
          <button onClick={addItem} className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors">Tambah</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map(item => (
          <div key={item.id} className="glass-card rounded-lg p-4 group">
            <div className={`${item.aspect} bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden relative`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-muted-foreground/30 font-mono text-xs">{item.title}</span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-sm font-display text-foreground block truncate">{item.title}</span>
                {item.description && <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-2">{item.description}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 mt-1">
                    <LinkIcon size={10} /> Link
                  </a>
                )}
              </div>
              <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
