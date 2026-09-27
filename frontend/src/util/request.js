import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  return "/api";
};

// 凭证走 HttpOnly Cookie，前端拿不到也不需要 token
const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !location.pathname.includes("/login")) {
      // Cookie 已失效（过期/被清），清掉本地展示用的用户缓存并回登录页
      localStorage.removeItem("user");
      location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default request;
