# 新闻管理系统（重构版）

```
新闻管理系统/
├── frontend/          # React + Vite 前端
│   ├── src/
│   │   ├── components/sandbox/SideMenu.jsx   # 服务端菜单树直渲染
│   │   ├── router/IndexRouter.jsx            # 单次 /auth/me 鉴权+路由
│   │   ├── util/{request,checkLogin,getRoutes,routeConfig}.js
│   │   └── views/ ...
│   ├── index.html
│   ├── vite.config.js   # /api -> http://localhost:8000
│   └── package.json
├── backend-python/    # FastAPI 后端
│   └── app/{main,models,db,rbac}.py
└── package.json       # 根脚本（并发启动前后端）
```

## 启动

```bash
# 后端
cd backend-python
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload

# 前端
cd frontend
npm install
npm run dev
```

根目录：`npm run dev:all`（需先 `npm i -g concurrently` 或已安装）。

## RBAC

- 权限唯一口径：`permission.key`，关联 `role_permission(role_id,permission_id)`。
- 登录返回 `{token,user,menus,keys}`，后续只调 `GET /auth/me`。
- 菜单仅展示 `type=1 且 is_show=1`，按钮 `type=2` 只做 `hasPerm(keys,key)` 判定。
- 未登录直接跳 `/login`，删除 `getGuestRights` 只读兜底与默认全量路由。
- 行级隔离：超管全量 / 区管本region / 区编仅本人。

## 删除的冗余

- 旧 `backend/` Node 实现、`GET /rights|/children` 双接口、前端本地硬编码菜单。
- `getTokenInfo.js`（合并入 `checkLogin.getUser`）、`src\\util` 大小写重复文件。
- `vite.config.js` 中手写 spa-fallback 中间件（Vite 默认已支持）。
