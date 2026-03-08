import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost/asa9-backend",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;