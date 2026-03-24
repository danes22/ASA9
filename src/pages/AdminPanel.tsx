import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Newspaper, MessageSquare, Image, Plus, Trash2, Edit2,
  Save, X, ArrowLeft, Link as LinkIcon, ImageIcon, Upload,
  ShieldAlert, Timer, Eye, EyeOff, CheckCircle, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { sanitizeInput, isValidSafeUrl, checkRateLimit, resetRateLimit, validateFileUpload, hardenRuntime } from "@/lib/security";
import { useDataStore, FeedbackItem } from "@/lib/dataStore";

const inputClass = "w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/50";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

const handleFileSelect = (file: File, onResult: (dataUrl: string) => void) => {
  const error = validateFileUpload(file, 2);
  if (error) { toast.error(error); return; }
  const reader = new FileReader();
  reader.onload = () => { if (typeof reader.result === "string") onResult(reader.result); };
  reader.onerror = () => toast.error("Gagal membaca file!");
  reader.readAsDataURL(file);
};


interface NewsFormProps {
  form: { judul: string; isi: string; tag: string; foto: string; link: string };
  setForm: React.Dispatch<React.SetStateAction<{ judul: string; isi: string; tag: string; foto: string; link: string }>>;
  onSave?: () => void;
  onCancel?: () => void;
  onAdd?: () => void;
  loading: boolean;
}

function NewsForm({ form, setForm, onSave, onCancel, onAdd, loading }: NewsFormProps) {
  return (
    <div className="space-y-3">
      <input
        value={form.judul}
        onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
        maxLength={200}
        placeholder="Judul berita *"
        className={inputClass}
      />
      <textarea
        value={form.isi}
        onChange={e => setForm(f => ({ ...f, isi: e.target.value }))}
        maxLength={2000}
        placeholder="Isi berita *"
        rows={4}
        className={`${inputClass} resize-none`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={form.foto.startsWith("data:") ? "📷 File terpilih" : form.foto}
            onChange={e => setForm(f => ({ ...f, foto: e.target.value }))}
            maxLength={500}
            placeholder="URL Gambar (opsional)"
            className={`${inputClass} pl-9 pr-20`}
            readOnly={form.foto.startsWith("data:")}
          />
          <label className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors">
            <Upload size={12} /> File
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f, url => setForm(prev => ({ ...prev, foto: url })));
              e.target.value = "";
            }} />
          </label>
        </div>
        <div className="relative">
          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            maxLength={500}
            placeholder="Link artikel (opsional)"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>
      {form.foto && (
        <div className="rounded-lg overflow-hidden border border-border/30 max-h-40">
          <img src={form.foto} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="flex gap-3">
        <input
          value={form.tag}
          onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
          maxLength={30}
          placeholder="Tag (misal: Prestasi) *"
          className={`flex-1 ${inputClass}`}
        />
        {onSave ? (
          <div className="flex gap-2">
            <button onClick={onSave} disabled={loading} className="text-foreground hover:text-foreground/80 disabled:opacity-50"><Save size={18} /></button>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
        ) : (
          <button onClick={onAdd} disabled={loading} className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50">
            Tambah
          </button>
        )}
      </div>
    </div>
  );
}


const AdminPanel = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [tab, setTab] = useState<"news" | "feedback" | "gallery">("news");
  const { refreshNews, refreshGallery, refreshFeedbacks } = useDataStore();

  useEffect(() => { hardenRuntime(); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthenticated(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthenticated(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (lockoutTime <= 0) return;
    const interval = setInterval(() => {
      setLockoutTime((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = checkRateLimit("admin_login", 5, 60_000, 300_000);
    if (!limit.allowed) {
      setLockoutTime(limit.lockedUntilMs);
      toast.error("Terlalu banyak percobaan!");
      setPassword("");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (error) {
      toast.error(`Password salah! (${limit.remainingAttempts} percobaan tersisa)`);
      setPassword("");
    } else {
      resetRateLimit("admin_login");
      toast.success("Login berhasil!");
    }
  }, [password]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Logout berhasil.");
  }, []);

  const handleTabChange = (key: "news" | "feedback" | "gallery") => {
    setTab(key);
    if (key === "news") refreshNews();
    if (key === "gallery") refreshGallery();
    if (key === "feedback") refreshFeedbacks();
  };

  if (lockoutTime > 0) {
    const minutes = Math.floor(lockoutTime / 60_000);
    const seconds = Math.ceil((lockoutTime % 60_000) / 1000);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-lg p-12 text-center max-w-md">
          <ShieldAlert className="text-destructive mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Akses Diblokir</h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mt-4">
            <Timer size={16} />
            <span className="font-mono text-lg">{minutes}:{seconds.toString().padStart(2, "0")}</span>
          </div>
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
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">Admin Panel</h2>
          <p className="text-xs text-muted-foreground text-center mb-8 font-mono">ASA 9 — Akses Terbatas</p>
          <form onSubmit={handleLogin}>
            <div className="relative mb-4">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className="w-full bg-foreground text-background font-display font-semibold py-3 rounded-lg hover:bg-foreground/90 transition-colors">Masuk</button>
          </form>
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
            <button onClick={handleLogout} className="text-xs bg-secondary text-muted-foreground px-4 py-2 rounded-lg hover:text-foreground transition-colors font-mono">Logout</button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
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


const newsSchema = z.object({
  judul: z.string().trim().min(1, "Judul wajib diisi").max(200),
  isi: z.string().trim().min(1, "Isi wajib diisi").max(2000),
  tag: z.string().trim().min(1, "Tag wajib diisi").max(30),
});

function NewsManager() {
  const { news, refreshNews } = useDataStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ judul: "", isi: "", tag: "", foto: "", link: "" });
  const [editForm, setEditForm] = useState({ judul: "", isi: "", tag: "", foto: "", link: "" });
  const [loading, setLoading] = useState(false);

  const validateForm = (form: typeof addForm) => {
    const result = newsSchema.safeParse(form);
    if (!result.success) { toast.error(result.error.errors[0].message); return false; }
    if (form.foto && !isValidSafeUrl(form.foto)) { toast.error("URL gambar tidak valid!"); return false; }
    if (form.link && !isValidSafeUrl(form.link)) { toast.error("URL link tidak valid!"); return false; }
    return true;
  };

  const addNews = async () => {
    if (!validateForm(addForm)) return;
    setLoading(true);
    const { error } = await supabase.from("berita").insert({
      judul: sanitizeInput(addForm.judul),
      isi: sanitizeInput(addForm.isi),
      tag: sanitizeInput(addForm.tag),
      foto: addForm.foto.trim() || null,
      link: addForm.link.trim() || null,
    });
    if (error) toast.error("Gagal menyimpan!");
    else {
      toast.success("Berita ditambahkan!");
      setAddForm({ judul: "", isi: "", tag: "", foto: "", link: "" });
      await refreshNews();
    }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    if (!validateForm(editForm)) return;
    setLoading(true);
    const { error } = await supabase.from("berita").update({
      judul: sanitizeInput(editForm.judul),
      isi: sanitizeInput(editForm.isi),
      tag: sanitizeInput(editForm.tag),
      foto: editForm.foto.trim() || null,
      link: editForm.link.trim() || null,
    }).eq("id", id);
    if (error) toast.error("Gagal update!");
    else { toast.success("Berita diperbarui!"); setEditing(null); await refreshNews(); }
    setLoading(false);
  };

  const deleteNews = async (id: string) => {
    const { error } = await supabase.from("berita").delete().eq("id", id);
    if (error) toast.error("Gagal hapus!");
    else { toast.success("Berita dihapus!"); await refreshNews(); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Plus size={16} /> Tambah Berita</h3>
        <NewsForm form={addForm} setForm={setAddForm} onAdd={addNews} loading={loading} />
      </div>

      {news.map(item => (
        <div key={item.id} className="glass-card rounded-lg p-6">
          {editing === item.id ? (
            <NewsForm
              form={editForm}
              setForm={setEditForm}
              onSave={() => saveEdit(item.id)}
              onCancel={() => setEditing(null)}
              loading={loading}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">{item.tag}</span>
                <h4 className="font-display font-semibold text-foreground mt-2">{item.judul}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.isi}</p>
                {item.foto && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border/30 max-h-32">
                    <img src={item.foto} alt={item.judul} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground/40 font-mono mt-2">{new Date(item.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => {
                  setEditing(item.id);
                  setEditForm({ judul: item.judul, isi: item.isi, tag: item.tag, foto: item.foto || "", link: item.link || "" });
                }} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={16} /></button>
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
  const { feedbacks, loadingFeedbacks, refreshFeedbacks } = useDataStore();
  const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "";

  const markRead = async (id: string) => {
    await supabase.from("kritik_saran").update({ is_read: true }).eq("id", id);
    await refreshFeedbacks();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("kritik_saran").delete().eq("id", id);
    if (error) toast.error("Gagal hapus!");
    else { toast.success("Feedback dihapus!"); await refreshFeedbacks(); }
  };

  const forwardToWA = (fb: FeedbackItem) => {
    const numbers = (WA_NUMBER).split(",").map((n: string) => n.trim()).filter(Boolean);
    if (!numbers.length) { toast.error("Nomor WA belum diset di .env!"); return; }
    const text = encodeURIComponent(`🔔 *Kritik & Saran*\n\n*Dari:* ${fb.nama || "Anonim"}\n*Pesan:*\n${fb.pesan}`);
    numbers.forEach(number => window.open(`https://wa.me/${number}?text=${text}`, "_blank"));
  };

  if (loadingFeedbacks) return (
    <div className="glass-card rounded-lg p-12 text-center text-muted-foreground/40 font-mono text-sm">Memuat...</div>
  );

  return (
    <div className="space-y-4">
      {feedbacks.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <MessageSquare className="text-muted-foreground/30 mx-auto mb-3" size={40} />
          <p className="text-muted-foreground text-sm">Belum ada kritik & saran.</p>
        </div>
      ) : feedbacks.map(fb => (
        <div key={fb.id} className={`glass-card rounded-lg p-6 ${!fb.is_read ? "border-l-2 border-l-foreground/30" : ""}`}>
          <p className="text-foreground text-sm leading-relaxed">{fb.pesan}</p>
          <div className="flex items-center justify-between mt-3 gap-3">
            <div className="flex items-center gap-3">
              {fb.nama && <span className="text-xs text-muted-foreground font-mono">— {fb.nama}</span>}
              <span className="text-xs text-muted-foreground/40 font-mono">{new Date(fb.created_at).toLocaleDateString("id-ID")}</span>
              {!fb.is_read && <span className="text-xs bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full font-mono">Baru</span>}
            </div>
            <div className="flex items-center gap-2">
              {!fb.is_read && (
                <button onClick={() => markRead(fb.id)} title="Tandai dibaca" className="text-muted-foreground hover:text-foreground transition-colors">
                  <CheckCircle size={15} />
                </button>
              )}
              <button onClick={() => forwardToWA(fb)} title="Kirim ke WA" className="text-muted-foreground hover:text-green-500 transition-colors">
                <MessageCircle size={15} />
              </button>
              <button onClick={() => deleteItem(fb.id)} title="Hapus" className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


function GalleryManager() {
  const { gallery, refreshGallery } = useDataStore();
  const [form, setForm] = useState({ judul: "", deskripsi: "", foto: "", link: "" });
  const [aspect, setAspect] = useState("aspect-square");
  const [loading, setLoading] = useState(false);

  const addItem = async () => {
    if (!form.judul.trim()) { toast.error("Judul wajib diisi!"); return; }
    if (form.foto && !isValidSafeUrl(form.foto)) { toast.error("URL gambar tidak valid!"); return; }
    setLoading(true);
    const { error } = await supabase.from("galeri").insert({
      judul: sanitizeInput(form.judul),
      deskripsi: sanitizeInput(form.deskripsi) || null,
      foto: form.foto.trim() || null,
      link: form.link.trim() || null,
      aspect,
    });
    if (error) toast.error("Gagal menyimpan!");
    else { toast.success("Item galeri ditambahkan!"); setForm({ judul: "", deskripsi: "", foto: "", link: "" }); await refreshGallery(); }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("galeri").delete().eq("id", id);
    if (error) toast.error("Gagal hapus!");
    else { toast.success("Item dihapus!"); await refreshGallery(); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Plus size={16} /> Tambah Item Galeri</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} maxLength={100} placeholder="Judul foto *" className={`flex-1 ${inputClass}`} />
            <select value={aspect} onChange={e => setAspect(e.target.value)} className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none">
              <option value="aspect-square">Square</option>
              <option value="aspect-[4/5]">Portrait</option>
              <option value="aspect-video">Landscape</option>
            </select>
          </div>
          <input value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} maxLength={300} placeholder="Deskripsi (opsional)" className={inputClass} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input value={form.foto.startsWith("data:") ? "📷 File terpilih" : form.foto} onChange={e => setForm(f => ({ ...f, foto: e.target.value }))} placeholder="URL Gambar" className={`${inputClass} pl-9 pr-20`} readOnly={form.foto.startsWith("data:")} />
              <label className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors">
                <Upload size={12} /> File
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, url => setForm(prev => ({ ...prev, foto: url }))); e.target.value = ""; }} />
              </label>
            </div>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Link (opsional)" className={`${inputClass} pl-9`} />
            </div>
          </div>
          {form.foto && (
            <div className="rounded-lg overflow-hidden border border-border/30 max-h-32">
              <img src={form.foto} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <button onClick={addItem} disabled={loading} className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50">Tambah</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map(item => (
          <div key={item.id} className="glass-card rounded-lg p-4 group">
            <div className={`${item.aspect} bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden relative`}>
              {item.foto ? (
                <img src={item.foto} alt={item.judul} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-muted-foreground/30 font-mono text-xs">{item.judul}</span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-sm font-display text-foreground block truncate">{item.judul}</span>
                {item.deskripsi && <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-2">{item.deskripsi}</p>}
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