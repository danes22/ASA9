import API from "./api";

// ============================================================
// Token Management
// ============================================================
const TOKEN_KEY = "asa9_admin_token";

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token); // sessionStorage: hilang saat tab ditutup
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// Helper: tambah Authorization header
function authHeader() {
  return { headers: { Authorization: `Bearer ${getToken()}` } };
}

// ============================================================
// Auth
// ============================================================
export const loginAdmin = async (username, password) => {
  const res = await API.post("/admin/login.php", { username, password });
  if (res.data?.status === "success" && res.data?.token) {
    saveToken(res.data.token);
    return res.data;
  }
  throw new Error(res.data?.message || "Login gagal.");
};

export const logoutAdmin = async () => {
  try {
    await API.post("/admin/logout.php", {}, authHeader());
  } finally {
    clearToken();
  }
};

// ============================================================
// Get All Data (berita, galeri, kritik_saran)
// ============================================================
export const getAdminData = async () => {
  const res = await API.get("/admin/get_data.php", authHeader());
  if (res.data?.status === "success") return res.data.data;
  throw new Error(res.data?.message || "Gagal mengambil data.");
};

// ============================================================
// Berita
// ============================================================
export const tambahBerita = async (data) => {
  const res = await API.post("/admin/tambah_berita.php", data, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal menambah berita.");
  return res.data;
};

export const editBerita = async (data) => {
  const res = await API.post("/admin/edit_berita.php", data, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal edit berita.");
  return res.data;
};

export const hapusBerita = async (id) => {
  const res = await API.post("/admin/delete.php", { id, tabel: "berita" }, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal hapus berita.");
  return res.data;
};

// ============================================================
// Galeri
// ============================================================
export const tambahGaleri = async (data) => {
  const res = await API.post("/admin/tambah_galeri.php", data, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal menambah galeri.");
  return res.data;
};

export const hapusGaleri = async (id) => {
  const res = await API.post("/admin/delete.php", { id, tabel: "galeri" }, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal hapus galeri.");
  return res.data;
};

// ============================================================
// Kritik & Saran
// ============================================================
export const hapusKritik = async (id) => {
  const res = await API.post("/admin/delete.php", { id, tabel: "kritik_saran" }, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal hapus.");
  return res.data;
};

export const tandaiDibaca = async (id) => {
  const res = await API.post("/admin/mark_read.php", { id }, authHeader());
  if (res.data?.status !== "success") throw new Error(res.data?.message || "Gagal update.");
  return res.data;
};