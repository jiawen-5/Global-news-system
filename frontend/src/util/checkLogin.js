import request from "./request.js";

// 登录态的真实校验在后端（Cookie 里的 JWT）。这里的 user 只是登录后缓存的展示信息，
// 用于首屏渲染用户名/角色、菜单；即使被篡改也拿不到接口数据（后端会 401/403）。
export const checkLogin = () => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("user");
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const logout = async () => {
  try {
    // 让后端清掉 HttpOnly Cookie，否则仅清 localStorage 仍处于登录态
    await request.post("/auth/logout");
  } catch {
    /* 网络异常也要完成本地登出 */
  }
  localStorage.removeItem("user");
};
