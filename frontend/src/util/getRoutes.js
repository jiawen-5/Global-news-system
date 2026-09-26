import request from "./request.js";

let cache = null;

export async function fetchMe(force = false) {
  if (cache && !force) return cache;
  const { data } = await request.get("/auth/me");
  cache = data;
  try {
    if (data?.user) localStorage.setItem("user", JSON.stringify({ ...data.user, menus: data.menus, keys: data.keys }));
  } catch { /* noop */ }
  return data;
}

export const clearMeCache = () => { cache = null; };

export function hasPerm(keys, key) {
  if (!key) return true;
  if (keys.includes(key)) return true;
  const parent = key.split("/").slice(0, 2).join("/");
  return parent !== key && keys.includes(parent);
}
