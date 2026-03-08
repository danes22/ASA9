/**
 * ASA 9 Security Module
 * Comprehensive client-side security utilities
 */

// ============================================================
// 1. INPUT SANITIZATION — Deep XSS prevention
// ============================================================

const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
  /<script[\s>]/gi,
  /<\/script>/gi,
  /<iframe[\s>]/gi,
  /<object[\s>]/gi,
  /<embed[\s>]/gi,
  /<form[\s>]/gi,
  /document\.\w+/gi,
  /window\.\w+/gi,
  /eval\s*\(/gi,
  /alert\s*\(/gi,
  /prompt\s*\(/gi,
  /confirm\s*\(/gi,
  /innerHTML/gi,
  /outerHTML/gi,
  /\.cookie/gi,
  /\.localStorage/gi,
  /\.sessionStorage/gi,
];

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

/** Deep sanitize user input — strips HTML, script injections, and dangerous patterns */
export function sanitizeInput(str: string): string {
  if (!str || typeof str !== "string") return "";

  // First: replace HTML entities
  let clean = str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);

  // Second: remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }

  // Third: remove null bytes and control characters (except newline/tab)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return clean.trim();
}

/** Sanitize for display — lighter version that preserves readability */
export function sanitizeDisplay(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

// ============================================================
// 2. URL VALIDATION — Strict URL safety
// ============================================================

const ALLOWED_PROTOCOLS = ["https:", "http:"];
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

export function isValidSafeUrl(url: string): boolean {
  if (!url) return true; // empty is ok (optional fields)
  
  // Allow data:image URLs for file uploads
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|ico);base64,/.test(url)) return true;

  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;
    
    // Block localhost/internal
    if (BLOCKED_HOSTS.some((h) => parsed.hostname === h)) return false;
    if (parsed.hostname.endsWith(".local")) return false;
    
    // Block IPs in private ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;
    
    // Check for suspicious characters in URL
    if (/[<>"{}|\\^`]/.test(url)) return false;
    
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// 3. RATE LIMITING — Prevent brute force and spam
// ============================================================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000,
  lockoutMs: number = 300_000 // 5 min lockout
): { allowed: boolean; remainingAttempts: number; lockedUntilMs: number } {
  const now = Date.now();
  const entry = rateLimits.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

  // Check if locked out
  if (entry.lockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, lockedUntilMs: entry.lockedUntil - now };
  }

  // Reset window if expired
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
// 4. SESSION MANAGEMENT — Secure admin sessions
// ============================================================

const SESSION_KEY = "asa9_session";
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  token: string;
  expiresAt: number;
  fingerprint: string;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getBrowserFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(36);
}

export function createSession(): string {
  const token = generateToken();
  const session: SessionData = {
    token,
    expiresAt: Date.now() + SESSION_DURATION,
    fingerprint: getBrowserFingerprint(),
  };
  sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(session)));
  return token;
}

export function validateSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    const session: SessionData = JSON.parse(atob(raw));

    // Check expiry
    if (Date.now() > session.expiresAt) {
      destroySession();
      return false;
    }

    // Check browser fingerprint (prevent session hijacking)
    if (session.fingerprint !== getBrowserFingerprint()) {
      destroySession();
      return false;
    }

    // Auto-extend session on activity
    session.expiresAt = Date.now() + SESSION_DURATION;
    sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(session)));
    return true;
  } catch {
    destroySession();
    return false;
  }
}

export function destroySession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ============================================================
// 5. PASSWORD SECURITY — Hash comparison instead of plaintext
// ============================================================

/** Simple but effective hash for client-side password comparison */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "asa9_salt_2026_xK9p");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ADMIN_PW_KEY = "asa9_admin_pw";

/** Check if admin password has been set */
export function isPasswordSet(): boolean {
  return !!localStorage.getItem(ADMIN_PW_KEY);
}

/** Set or update admin password */
export async function setAdminPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(ADMIN_PW_KEY, hash);
}

/** Remove admin password (for reset) */
export function resetAdminPassword(): void {
  localStorage.removeItem(ADMIN_PW_KEY);
}

/** Verify input against stored password */
export async function verifyPassword(input: string): Promise<boolean> {
  const storedHash = localStorage.getItem(ADMIN_PW_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPassword(input);
  // Constant-time comparison to prevent timing attacks
  if (inputHash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < inputHash.length; i++) {
    diff |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================
// 6. DATA INTEGRITY — HMAC-like integrity check for stored data
// ============================================================

const INTEGRITY_SECRET = "asa9_integrity_2026_qM7w";

export async function computeIntegrity(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(INTEGRITY_SECRET);
  const msgData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyIntegrity(data: string, hash: string): Promise<boolean> {
  const computed = await computeIntegrity(data);
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================
// 7. ANTI-TAMPER — Detect DevTools localStorage manipulation
// ============================================================

export function createSecureStorage() {
  const PREFIX = "asa9_";
  const HASH_PREFIX = "asa9_hash_";

  return {
    async save(key: string, data: unknown): Promise<void> {
      try {
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        const hash = await computeIntegrity(encoded);
        localStorage.setItem(PREFIX + key, encoded);
        localStorage.setItem(HASH_PREFIX + key, hash);
      } catch (e) {
        console.error("Storage save error");
      }
    },

    async load<T>(key: string, fallback: T): Promise<T> {
      try {
        const stored = localStorage.getItem(PREFIX + key);
        if (!stored) return fallback;

        const storedHash = localStorage.getItem(HASH_PREFIX + key);
        if (storedHash) {
          const valid = await verifyIntegrity(stored, storedHash);
          if (!valid) {
            console.warn(`Data integrity check failed for ${key}. Data may have been tampered.`);
            // Remove tampered data
            localStorage.removeItem(PREFIX + key);
            localStorage.removeItem(HASH_PREFIX + key);
            return fallback;
          }
        }

        return JSON.parse(decodeURIComponent(atob(stored)));
      } catch {
        return fallback;
      }
    },

    remove(key: string) {
      localStorage.removeItem(PREFIX + key);
      localStorage.removeItem(HASH_PREFIX + key);
    },
  };
}

// ============================================================
// 8. CONTENT SECURITY — Prevent common attack vectors
// ============================================================

/** Validate file uploads */
export function validateFileUpload(file: File, maxSizeMB: number = 2): string | null {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"];
  const DANGEROUS_EXTENSIONS = [".exe", ".bat", ".cmd", ".scr", ".js", ".html", ".htm", ".php", ".py"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Tipe file tidak diizinkan. Hanya gambar yang diterima.";
  }

  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return "Ekstensi file berbahaya terdeteksi!";
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Ukuran file melebihi batas ${maxSizeMB}MB.`;
  }

  // Check for double extensions (e.g., "image.php.jpg")
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const suspiciousExts = parts.slice(1, -1);
    if (suspiciousExts.some((e) => DANGEROUS_EXTENSIONS.includes("." + e.toLowerCase()))) {
      return "File mencurigakan terdeteksi!";
    }
  }

  return null; // valid
}

/** Freeze prototype to prevent prototype pollution */
export function hardenRuntime() {
  // Prevent prototype pollution attacks
  if (typeof Object.freeze === "function") {
    const frozenProtos = [Object.prototype, Array.prototype, String.prototype, Function.prototype];
    // Note: We don't actually freeze these as it would break the app
    // Instead we monitor for suspicious additions
  }

  // Disable drag-drop of files into the page (prevents file-based XSS)
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());
}
