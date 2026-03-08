import API from "./api";

export const getBerita = () => {
  return API.get("/berita/get.php");
};

export const tambahBerita = (data) => {
  return API.post("/berita/create.php", data);
};

export const hapusBerita = (id) => {
  return API.post("/berita/delete.php", { id });
};
