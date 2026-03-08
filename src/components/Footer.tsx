import logo from "@/assets/logo-asa9.png";

const Footer = () => (
  <footer className="py-12 border-t border-border/30">
    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <img src={logo} alt="ASA 9" className="w-8 h-8" />
        <span className="font-display font-semibold text-foreground/80 text-sm">ASA 9 — SMAN 9</span>
      </div>
      <p className="text-xs text-muted-foreground/40 font-mono">
        © 2026 ASA 9. Semua hak dilindungi.
      </p>
    </div>
  </footer>
);

export default Footer;

