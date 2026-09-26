import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import Login from "../views/login/Login.jsx";
import Register from "../views/login/Register.jsx";
import NewsSandBox from "../views/sandbox/NewsSandBox.jsx";
import NoPermission from "../views/sandbox/nopermission/NoPermission.jsx";
import News from "@/views/news/News.jsx";
import Detail from "@/views/news/Detail.jsx";
import { checkLogin } from "@/util/checkLogin.js";
import { fetchMe, hasPerm, clearMeCache } from "@/util/getRoutes.js";
import { LocalRouterMap, ALWAYS_OPEN } from "@/util/routeConfig.js";

// 放在 BrowserRouter 内部：监听路由变化，每次跳页面都重新同步登录态 + 拉菜单
function AppRoutes() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => checkLogin());
  const [menus, setMenus] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const login = checkLogin();
    setIsLogin(login);
    if (!login) {
      clearMeCache();
      setMenus([]);
      setKeys([]);
      setLoading(false);
      return;
    }
    // 只在无缓存时请求 /auth/me，切路由复用缓存，避免每次 pathname 变化都强制刷新
    setLoading(true);
    NProgress.start();
    fetchMe(false)
      .then((me) => {
        setMenus(me.menus || []);
        setKeys(me.keys || []);
      })
      .catch(() => {
        clearMeCache();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLogin(false);
      })
      .finally(() => {
        setLoading(false);
        NProgress.done();
      });
  }, [location.pathname]);

  // 登录页：已登录直接进首页，避免停留在 /login
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    NProgress.done();
  });

  if (loading) return null;

  const allowed = Object.keys(LocalRouterMap).filter((k) => {
    if (!isLogin) return false;
    if (ALWAYS_OPEN.includes(k)) return true;
    const base = k.replace(/\/:id$/, "");
    return hasPerm(keys, base) || hasPerm(keys, k);
  });

  return (
    <Routes>
      <Route
        path="/login"
        element={isLogin ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route path="/register" element={<Register />} />
      <Route path="/news" element={<News />} />
      <Route path="/detail/:id" element={<Detail />} />
      <Route path="/" element={isLogin ? <NewsSandBox /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/home" replace />} />
        {allowed.map((k) => {
          const C = LocalRouterMap[k];
          const path = k.startsWith("/") ? k.slice(1) : k;
          return <Route key={k} path={path} element={<C />} />;
        })}
        <Route path="*" element={<NoPermission />} />
      </Route>
    </Routes>
  );
}

export default function IndexRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}
