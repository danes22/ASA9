import API from "./api";

export const kirimKritik = async (data) => {
  const res = await API.post("/kritik/kritik.php", data);
  return res.data;
};

export const kirimSaran = async (data) => {
  const res = await API.post("/kritik/saran.php", data);
  return res.data;
};
