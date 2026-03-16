/**
 * ASA 9 Security Module
 */

// ============================================================
// 1. INPUT SANITIZATION
// ============================================================
const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi, /on\w+\s*=/gi, /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi, /<script[\s>]/gi, /<\/script>/gi,
  /<iframe[\s>]/gi, /<object[\s>]/gi, /<embed[\s>]/gi,
  /eval\s*\(/gi, /document\.\w+/gi, /window\.\w+/gi,
];

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;",
  '"': "&quot;", "'": "&#x27;", "/": "&#x2F;", "`": "&#96;",
};

export function sanitizeInput(str: string): string {
  if (!str || typeof str !== "string") return "";
  let clean = str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
  for (const pattern of DANGEROUS_PATTERNS) clean = clean.replace(pattern, "");
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return clean.trim();
}

// ============================================================
// 2. URL VALIDATION
// ============================================================
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

export function isValidSafeUrl(url: string): boolean {
  if (!url) return true;
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|ico);base64,/.test(url)) return true;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    if (BLOCKED_HOSTS.some((h) => parsed.hostname === h)) return false;
    if (parsed.hostname.endsWith(".local")) return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;
    if (/[<>"{}|\\^`]/.test(url)) return false;
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// 3. RATE LIMITING
// ============================================================
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000,
  lockoutMs = 300_000
): { allowed: boolean; remainingAttempts: number; lockedUntilMs: number } {
  const now = Date.now();
  const entry = rateLimits.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

  if (entry.lockedUntil > now)
    return { allowed: false, remainingAttempts: 0, lockedUntilMs: entry.lockedUntil - now };

  if (now - entry.firstAttempt > windowMs) {
    entry.count = 0;
    entry.firstAttempt = now;
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    rateLimits.set(key, entry);
    return { allowed: false, remainingAttempts: 0, lockedUntilMs: lockoutMs };
  }

  rateLimits.set(key, entry);
  return { allowed: true, remainingAttempts: maxAttempts - entry.count, lockedUntilMs: 0 };
}

export function resetRateLimit(key: string) {
  rateLimits.delete(key);
}

// ============================================================
// 4. FILE UPLOAD VALIDATION
// ============================================================
export function validateFileUpload(file: File, maxSizeMB = 2): string | null {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"];
  const DANGEROUS_EXTENSIONS = [".exe", ".bat", ".cmd", ".scr", ".js", ".html", ".htm", ".php", ".py"];

  if (!ALLOWED_TYPES.includes(file.type)) return "Tipe file tidak diizinkan. Hanya gambar yang diterima.";

  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  if (DANGEROUS_EXTENSIONS.includes(ext)) return "Ekstensi file berbahaya terdeteksi!";

  if (file.size > maxSizeMB * 1024 * 1024) return `Ukuran file melebihi batas ${maxSizeMB}MB.`;

  const parts = file.name.split(".");
  if (parts.length > 2) {
    const suspiciousExts = parts.slice(1, -1);
    if (suspiciousExts.some((e) => DANGEROUS_EXTENSIONS.includes("." + e.toLowerCase())))
      return "File mencurigakan terdeteksi!";
  }

  return null;
}

// ============================================================
// 5. RUNTIME HARDENING
// ============================================================
export function hardenRuntime() {
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());
}

// ============================================================
// 6. WHATSAPP NOTIF — kirim pesan ke WA admin
// ============================================================
const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "";

export function notifyWhatsApp(nama: string, pesan: string) {
  if (!WA_NUMBER) return;
  const text = encodeURIComponent(`🔔 *Kritik & Saran Baru*\n\n*Dari:* ${nama || "Anonim"}\n*Pesan:*\n${pesan}`);
  window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
}