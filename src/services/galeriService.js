import API from "./api";

export const getGaleri = async () => {
  const res = await API.get("/galeri/get.php");
  return res.data;
};
