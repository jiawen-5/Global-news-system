import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  return "/api";
};

const request = axios.create({ baseURL: getBaseURL(), timeout: 10000 });

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !location.pathname.includes("/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default request;
