import API from "./api";

export const loginAdmin = (data) => {
  return API.post("/admin/login.php", data);
};
