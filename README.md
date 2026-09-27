# 🗞️ 全球新闻发布管理系统

> 基于 RBAC 权限模型的新闻采编发布平台，前端 React + 后端 FastAPI + MySQL

一个面向多角色协作场景的新闻管理系统。系统把「写稿 → 送审 → 审核 → 发布 → 下线」这条内容流水线拆成明确的权限边界：超级管理员管全局，区域管理员管本区域，区域编辑只管自己的稿子，每个角色登录后看到的菜单、能调的接口、能看到的数据行都不一样。

相比单纯的增删改查练习，这个项目更强调**权限模型落到每一层的完整性**：菜单渲染、路由过滤、接口鉴权、行级数据隔离，四处口径统一到 `permission.key` 这一个标识上，不会出现「前端藏了按钮但接口没拦」这种常见漏洞。同时，本轮迭代重点补上了**凭证存储与富文本安全**，把存储型 XSS 和 token 窃取这两条最典型的前端攻击链一起切断。

## 📝 最近更新

<details>
<summary><strong>查看版本更新记录（最新：2026-09-28）</strong></summary>

- `2026-09-28`
  - 安全｜凭证存储：登录态从 `localStorage` 迁移到 **JWT + HttpOnly Cookie**，前端不再持有 token，新增 `/api/auth/logout` 让服务端真正失效会话。
  - 安全｜XSS 防御：新增富文本白名单过滤，后端 `bleach` 负责入库清洗、前端 `DOMPurify` 负责渲染兜底，堵住存储型 XSS 与凭证窃取的组合攻击链。
  - 性能｜首页请求：4 个接口合并为一次并发请求，修复「图表实例写进 state 触发 effect 自循环」导致的重复请求（原先同一接口最多被请求 6 次）。
  - 体验｜排版统一：新闻详情页与后台预览页统一为阅读型排版，抽出共用样式 `news-article.css`；首页三张卡片等高对齐。
  - 修复｜用户管理：补齐缺失的 `PATCH / DELETE /api/users/{id}`，编辑与删除用户不再返回 404；区域管理员录入用户时区域可正常选择。
  - 修复｜数据可见性：已上线新闻（`publishState=2`）对所有角色公开，首页榜单与图表不再因行级隔离而空白。
- `2026-09`｜架构重构：以 FastAPI + MySQL 替换原 Node `json-server` 假接口；权限唯一口径收敛为 `permission.key`；删除前端硬编码菜单与未登录只读兜底。

</details>

## 📸 效果展示

### 登录页

粒子动效背景 + 单表单登录，凭证由后端写入 HttpOnly Cookie。

![登录页](./test_pic/01-login-page.png)

### 首页仪表盘

点赞榜、浏览榜、用户卡片，下方为新闻分类柱状图。

![首页仪表盘](./test_pic/02-home-dashboard.jpeg)

### 撰写新闻

draft-js 富文本编辑器，支持标题、列表、引用、图片、代码块等排版。

![撰写新闻 1](./test_pic/03-news-editor-1.png)

![撰写新闻 2](./test_pic/04-news-editor-2.png)

### 草稿箱

按作者隔离，只能看到自己的稿子，支持预览、修改、送审、删除。

![草稿箱](./test_pic/05-draft-box.png)

### 审核管理

超级管理员审核全站稿件，区域管理员只审核本区域编辑的稿件。

![审核新闻](./test_pic/06-audit-news.png)

### 个人新闻分类图表

抽屉内按分类聚合当前用户的稿件数量。

![用户新闻饼图](./test_pic/07-user-news-pie-chart.png)

### 新闻详情页

阅读型排版，正文经过白名单过滤后渲染。

![新闻详情页](./test_pic/08-news-detail.jpeg)

### 用户列表

超管可见全量用户，区域管理员只可见本区域编辑。

![用户列表](./test_pic/09-user-list.png)

### 角色权限配置

树形权限勾选，保存后即时影响该角色登录后可见的菜单与接口。

![角色权限](./test_pic/10-role-permission.png)

---

## ✨ 项目亮点

- 🔐 **完整 RBAC 闭环**：菜单渲染、前端路由过滤、接口鉴权、行级数据隔离四处共用同一个 `permission.key` 口径
- 🍪 **HttpOnly Cookie 凭证**：JWT 只存在于 HttpOnly Cookie 中，JS 读不到，XSS 无法窃取；登出由服务端清除
- 🧼 **双层 XSS 防御**：后端 `bleach` 白名单入库 + 前端 `DOMPurify` 白名单渲染，编辑器产出的 HTML 不再原样入库
- 👥 **三种角色行级隔离**：超管全量 / 区域管理员本区域 / 区域编辑仅本人，已上线内容对所有人公开
- 🌳 **服务端菜单树**：菜单由后端按角色计算并直接下发给前端渲染，不再有本地硬编码菜单
- ✍️ **富文本采编**：draft-js 可视化编辑器，草稿 → 送审 → 审核 → 发布/驳回 → 下线全流程
- 📊 **数据看板**：ECharts 分类柱状图 + 个人稿件分类饼图 + 双维度排行榜
- 🌗 **明暗双主题**：顶栏一键切换，覆盖管理后台与文章阅读页
- 🖼️ **统一阅读排版**：详情页与后台预览页共用一套文章样式，标题、正文、引用、代码块、表格都有完整排版
- 🔗 **接口脱敏返回**：列表接口统一返回 `{ total, list }`，登录响应不再包含 token 字段

---

## 🏗️ 技术架构

### 技术栈

| 层 | 选型 |
| :--- | :--- |
| 前端框架 | React 18 + Vite 7 |
| UI 组件 | Ant Design 5 + antd-style |
| 路由 / 状态 | React Router 6 + Redux Toolkit |
| 富文本 | draft-js + react-draft-wysiwyg + draftjs-to-html |
| 图表 | Apache ECharts |
| 表格请求 | Axios（`withCredentials`） |
| 内容安全 | DOMPurify（前端） |
| 后端框架 | FastAPI + Pydantic |
| ORM / 数据库 | SQLAlchemy 2 + MySQL 8（PyMySQL 驱动） |
| 认证 / 加密 | PyJWT + bcrypt |
| 内容安全 | bleach（后端） |

### 核心架构分层

| 层级 | 关键文件 | 职责 |
| :--- | :--- | :--- |
| 页面层 | `frontend/src/views/` | 登录注册、新闻门户、详情页、后台各管理页 |
| 组件层 | `frontend/src/components/` | 侧边菜单、顶栏、富文本编辑器、预览组件、发布表格 |
| 路由与权限 | `frontend/src/router/`、`src/util/` | 路由表、权限判定、请求封装、登录态、内容过滤 |
| 接口层 | `backend/app/main.py` | 全部路由、鉴权依赖、Cookie 下发 |
| 权限层 | `backend/app/rbac.py` | 角色权限集合、菜单树构建 |
| 安全层 | `backend/app/sanitize.py` | 富文本白名单过滤 |
| 数据层 | `backend/app/models.py`、`app/db.py` | 7 张表的 ORM 定义与连接会话 |

### 系统数据流

```mermaid
flowchart TD
    Browser(("浏览器"))

    subgraph FE["前端 React SPA"]
        Router["IndexRouter.jsx<br/>路由 + 权限过滤"]
        Pages["views/ 页面层"]
        Req["request.js<br/>axios withCredentials"]
        Purify["sanitize.js<br/>DOMPurify"]
    end

    subgraph BE["后端 FastAPI"]
        Main["main.py<br/>路由 + 鉴权依赖"]
        RBAC["rbac.py<br/>菜单树 + 权限集合"]
        San["sanitize.py<br/>bleach 白名单"]
    end

    DB[("MySQL<br/>news / users / roles<br/>permission / role_permission<br/>categories / regions")]
    Cookie[["JWT<br/>HttpOnly Cookie"]]

    Browser --> Router
    Router --> Pages
    Pages --> Req
    Req -->|"Cookie: news_token"| Main
    Main --> RBAC
    Main --> San
    San --> DB
    RBAC --> DB
    Main --> DB
    Main -.->|"Set-Cookie"| Cookie
    Cookie -.-> Req
    Pages -.->|"渲染正文"| Purify

    classDef fe fill:#eef2ff,stroke:#818cf8,color:#111;
    classDef be fill:#fffbea,stroke:#facc15,color:#111;
    classDef data fill:#f0fdf4,stroke:#4ade80,color:#111;
    classDef auth fill:#fff1f2,stroke:#fb7185,color:#111;

    class Router,Pages,Req,Purify fe;
    class Main,RBAC,San be;
    class DB data;
    class Cookie auth;
```

数据流路径：前端进入受保护路由 → 携带 Cookie 调 `GET /api/auth/me` 取回菜单与权限集合 → 前端据此过滤可访问路由并渲染侧边菜单 → 用户操作时请求接口，后端 `cur_user` 校验身份、`need(key)` 校验权限、查询层叠加行级隔离 → 写新闻时 `bleach` 先清洗再落库 → 前端渲染正文时再经 `DOMPurify` 过滤一次。

---

## 🔐 权限模型（RBAC）

### 数据表

| 表 | 说明 |
| :--- | :--- |
| `users` | 用户，`roleId` 关联角色，`region` 决定数据可见范围 |
| `roles` | 角色，`roleType` 区分 1 超管 / 2 区域管理员 / 3 区域编辑 |
| `permission` | 权限菜单自关联表，`parent_id` 构树，`type` 区分 1 菜单 / 2 按钮 |
| `role_permission` | 角色-权限多对多中间表，联合唯一约束 `uk_role_perm` |
| `news` | 新闻主表，含 `auditState` / `publishState` / `star` / `view` |
| `categories` | 新闻分类字典 |
| `regions` | 地区字典 |

字段级定义见 [`字段说明.txt`](./字段说明.txt)。

### 四层权限口径

权限的唯一标识是 `permission.key`，四层都指向它，避免出现口径分裂：

| 层 | 实现位置 | 做法 |
| :--- | :--- | :--- |
| 菜单渲染 | `rbac.py: get_user_menus` | 只返回 `type=1 且 is_show=1` 且该角色已授权的节点，构树后下发 |
| 前端路由 | `IndexRouter.jsx` | 用 `LocalRouterMap` 与 `keys` 求交集，无权路由不注册 |
| 按钮级 | `getRoutes.js: hasPerm` | 支持父级回退：`/a/b/c` 命中 `/a/b` 即视为有权 |
| 接口鉴权 | `main.py: need(key)` | 服务端再校验一次，前端藏按钮不等于接口安全 |

### 行级数据隔离

`list_news` 按角色类型叠加过滤条件：

| 角色 | roleType | 可见数据 |
| :--- | :--- | :--- |
| 超级管理员 | 1 | 全量 |
| 区域管理员 | 2 | 本 region 的稿件 + 自己写的稿件 |
| 区域编辑 | 3 | 仅自己写的稿件 |

已上线新闻（`publishState=2`）是公开内容，任何角色都可读——这条规则保证首页榜单、分类图表、访客详情页对所有人都有数据。

审核环节还有一层业务约束：超管不能审核自己写的稿子；区域管理员只能审核本区域编辑（`roleId=3`）投递的稿子。

---

## 📁 项目结构

```text
新闻管理系统/
├── backend/                              # FastAPI 后端
│   ├── app/
│   │   ├── main.py                       # 应用入口：路由、鉴权依赖、Cookie 下发
│   │   ├── models.py                     # 7 张表的 SQLAlchemy 定义
│   │   ├── db.py                         # 引擎、会话与 get_db 依赖
│   │   ├── rbac.py                       # 角色权限集合、菜单树构建
│   │   └── sanitize.py                   # bleach 富文本白名单过滤
│   ├── .env                              # DATABASE_URL / JWT_SECRET
│   └── requirements.txt
├── frontend/                             # React + Vite 前端
│   ├── src/
│   │   ├── router/
│   │   │   └── IndexRouter.jsx           # 路由注册、权限过滤、登录态同步
│   │   ├── util/
│   │   │   ├── request.js                # axios 实例（withCredentials、401 处理）
│   │   │   ├── getRoutes.js              # fetchMe 缓存与 hasPerm 判定
│   │   │   ├── checkLogin.js             # 登录态与本地用户缓存
│   │   │   ├── routeConfig.js            # 路由表，与 permission.key 一一对应
│   │   │   └── sanitize.js               # DOMPurify 白名单（与后端对齐）
│   │   ├── components/
│   │   │   ├── sandbox/
│   │   │   │   ├── SideMenu.jsx          # 侧边菜单（服务端菜单树直渲染）
│   │   │   │   ├── TopHeader.jsx         # 顶栏：折叠、主题切换、退出
│   │   │   │   ├── news-manage/
│   │   │   │   │   ├── NewsEditor.jsx    # draft-js 富文本编辑器
│   │   │   │   │   └── NewsPreview.jsx   # 后台新闻预览
│   │   │   │   ├── user-manage/UserForm.jsx
│   │   │   │   └── publish-manage/       # 发布管理表格与 hook
│   │   │   └── common/LoginModal.jsx     # 未登录操作拦截弹窗
│   │   ├── views/
│   │   │   ├── login/                    # 登录、注册
│   │   │   ├── news/                     # 新闻门户、详情页
│   │   │   └── sandbox/                  # 后台首页、用户、权限、新闻、审核、发布
│   │   ├── context/ThemeContext.jsx      # 明暗主题
│   │   ├── redux/                        # 折叠状态、加载状态
│   │   ├── styles/news-article.css       # 详情页与预览页共用的文章排版
│   │   └── App.jsx / main.jsx
│   ├── vite.config.js                    # dev server 与 /api 代理到 8000
│   └── package.json
├── test_pic/                             # README 展示截图
├── 字段说明.txt                          # 数据表与字段字典
└── README.md
```

### 关键文件职责

**后端**

- `backend/app/main.py`
  全部接口定义，以及三个核心依赖：`cur_user`（Cookie/Header 双通道取身份）、`need(key)`（按 `permission.key` 鉴权）、`set_auth_cookie`（HttpOnly Cookie 下发）。
- `backend/app/rbac.py`
  `get_role_permission_keys` 取角色权限 key 集合；`build_menu_tree` 把扁平的 `parent_id` 结构拼成树；`get_user_menus` 按角色输出可见菜单。
- `backend/app/sanitize.py`
  `sanitize_html` 用于正文，`sanitize_text` 用于标题；白名单只放行排版标签与安全属性，并额外整体删除 `script/style/iframe` 等标签及其内容。
- `backend/app/models.py`
  7 张表的 ORM 映射，字段语义与 `字段说明.txt` 一致。

**前端**

- `frontend/src/router/IndexRouter.jsx`
  登录态同步与路由注册；`/auth/me` 只在无缓存时请求一次，切页面复用缓存。
- `frontend/src/util/getRoutes.js`
  `fetchMe` 带模块级缓存，`hasPerm` 支持父级权限回退，`clearMeCache` 供登录/登出时失效缓存。
- `frontend/src/util/request.js`
  axios 实例，`withCredentials: true` 让浏览器自动携带 Cookie；401 时清本地用户缓存并回登录页。
- `frontend/src/util/sanitize.js`
  与后端保持一致的白名单，并在 `afterSanitizeAttributes` 钩子里给 `target=_blank` 的链接补 `rel="noopener noreferrer"`。
- `frontend/src/util/routeConfig.js`
  `LocalRouterMap` 把路由路径映射到组件，路径与后端 `permission.key` 完全对应。
- `frontend/src/views/sandbox/home/Home.jsx`
  首页仪表盘，4 个接口并发拉取一次，图表实例存 `ref` 而非 `state`，避免自触发。
- `frontend/src/styles/news-article.css`
  详情页与后台预览页共用的文章排版，改一处两页同步。

---

## 🚀 启动项目

需要本机已安装 **Node.js 18+**、**Python 3.10+**、**MySQL 8**。

### 1. 初始化数据库

```sql
CREATE DATABASE news_system DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;
```

表结构由后端启动时 `Base.metadata.create_all` 自动创建，但**初始数据需要自行导入**（角色、权限、分类、地区、用户）。表与字段定义见 [`字段说明.txt`](./字段说明.txt)。

初始数据至少要包含：

- `roles`：`roleType` 分别取 1 / 2 / 3 的三条角色
- `permission`：菜单与按钮权限，`key` 与 `frontend/src/util/routeConfig.js` 中的路径一致
- `role_permission`：给角色绑定权限
- `categories`、`regions`：分类与地区字典
- `users`：`password` 字段必须是 **bcrypt 密文**，不能存明文

### 2. 启动后端

```powershell
cd backend
pip install -r requirements.txt
# 编辑 .env，填写数据库连接与 JWT 密钥
uvicorn app.main:app --reload --port 8000
```

`backend/.env` 示例：

```env
DATABASE_URL=mysql+pymysql://root:你的密码@localhost:3306/news_system?charset=utf8mb4
JWT_SECRET=换成一段足够随机的长字符串
```

可选环境变量：

| 变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `COOKIE_SECURE` | `false` | HTTPS 部署时必须设为 `true`，否则浏览器不会发送 Cookie |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 允许携带凭证的跨域来源白名单 |

后端启动后可访问：

```text
API:      http://127.0.0.1:8000
API 文档: http://127.0.0.1:8000/docs
健康检查: http://127.0.0.1:8000/health
```

### 3. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

前端地址：`http://localhost:5173`。开发环境下 `vite.config.js` 已把 `/api` 代理到 `http://localhost:8000`，因此浏览器侧是同源请求，Cookie 正常工作。

生产构建：

```powershell
npm run build     # 产物输出到 frontend/dist
npm run preview   # 本地预览构建产物
```

> 如果不用代理、直接让前端访问后端域名，需要设置 `VITE_API_BASE_URL`，同时保证后端 `CORS_ORIGINS` 包含前端的实际来源。

---

## 📡 核心接口

### 认证

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | 登录，成功后通过 `Set-Cookie` 下发 HttpOnly JWT，响应体不含 token |
| `POST` | `/api/auth/logout` | 登出，清除 Cookie |
| `GET` | `/api/auth/me` | 取当前用户信息、菜单树与权限 key 集合 |
| `POST` | `/api/auth/register` | 注册区域编辑账号 |

### 权限

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/menus` | 当前用户可见菜单 |
| `GET` | `/api/permissions` | 全部权限（树 + 列表），用于权限配置页 |
| `GET` | `/api/roles` | 角色列表 |
| `GET` | `/api/roles/{rid}/permissions` | 某角色的权限 key 集合 |
| `PUT` | `/api/roles/{rid}/permissions` | 覆盖式保存角色权限，需 `/right-manage/role/list` 权限 |

### 新闻

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/news` | 列表，支持 `auditState`/`publishState`/`author`/`region`/`categoryId`/`q` 过滤与 `_sort`/`_order`/`_limit` 排序分页 |
| `POST` | `/api/news` | 新建，标题与正文入库前经 `bleach` 过滤 |
| `GET` | `/api/news/{id}` | 详情 |
| `PATCH` | `/api/news/{id}` | 更新，同样经过白名单过滤 |
| `DELETE` | `/api/news/{id}` | 删除 |

### 用户与字典

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/users` | 用户列表，需 `/user-manage/list` 权限 |
| `POST` | `/api/users` | 新建用户，密码 bcrypt 加密后存储 |
| `PATCH` | `/api/users/{id}` | 更新用户，`password` 非空才改写 |
| `DELETE` | `/api/users/{id}` | 删除用户，禁止删除自己 |
| `GET` | `/api/categories` | 新闻分类列表 |
| `PATCH` / `DELETE` | `/api/categories/{id}` | 分类维护 |
| `GET` | `/api/regions` | 地区字典（公开接口，注册页使用） |
| `GET` | `/health` | 健康检查 |

---

## 🔒 安全设计

### 凭证存储：JWT + HttpOnly Cookie

原先 token 存在 `localStorage`，页面里任意一段 JS 都能读到——只要有一个 XSS 就能把凭证偷走。现在改为：

- 登录成功后后端用 `Set-Cookie` 下发 `news_token`，属性为 `HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`，HTTPS 环境下再加 `Secure`；
- 前端 `axios` 配置 `withCredentials: true`，浏览器自动携带，**前端代码里完全没有 token 变量**；
- 登出调 `POST /api/auth/logout`，由服务端清除 Cookie，而不是前端「假装」清一下；
- `cur_user` 仍保留读取 `Authorization` 头的能力，方便将来对接移动端，但 Web 端不再使用。

`localStorage` 里只剩 `user` 这类展示用的用户信息（用户名、角色名、菜单），这些不是凭证，即使泄露也不构成越权。

需要注意的是：改成 Cookie 后 CSRF 从「不存在」变成「需要防」，当前用 `SameSite=Lax` 兜底，写操作接口建议后续再补 `Origin/Referer` 校验。

### 富文本：后端 bleach + 前端 DOMPurify

富文本编辑器产出的是 HTML 字符串，如果直接入库再 `dangerouslySetInnerHTML` 渲染，就是典型的存储型 XSS。攻击者只要发一篇正文里藏着 `<img src=x onerror="...">` 的稿子，所有打开它的人（包括管理员）都会中招。

防御分两层：

**第一层｜入库过滤（`backend/app/sanitize.py`）**

- 标签白名单：只保留 `p/br/strong/em/u/h1~h6/ul/ol/li/a/img/blockquote/pre/code/table` 等排版标签；
- 属性白名单：只放行 `href/src/alt/title/rel/width/height/colspan/class`，所有 `on*` 事件属性直接丢弃；
- 协议白名单：只允许 `http/https/mailto`，`javascript:`、`data:`、`vbscript:` 全部拦截；
- 额外整体删除 `script/style/iframe/object/embed/form` 等标签**及其内容**，避免残留 CSS 或脚本正文；
- 标题字段走 `sanitize_text`，剥掉全部标签并截断。

**第二层｜渲染兜底（`frontend/src/util/sanitize.js`）**

后端过滤只对新写入生效，库里已有的历史数据管不到。前端在 `NewsPreview` 和访客详情页渲染前再跑一次 `DOMPurify`，白名单与后端对齐，并给 `target=_blank` 的链接补 `rel="noopener noreferrer"`。

两层的关系是：后端负责新数据不再变脏，前端负责兜住存量数据和任何绕过前端直连接口的写入。

### 其他

- 密码用 **bcrypt** 加盐哈希存储，不落明文；
- 接口鉴权统一走 `need(key)` 服务端校验，前端隐藏按钮只是体验优化，不作为安全边界；
- 行级数据隔离在查询层实现，越权读取会在 SQL 条件上被拦掉；
- CORS 使用显式来源白名单，不再用 `allow_origins=["*"]`。

---

## 🛠️ 常见问题

### 登录后接口仍然 401

排查顺序：

1. 后端是否重启过——新增的 Cookie 逻辑需要重启才生效；
2. `backend/.env` 的 `JWT_SECRET` 是否被改动过，改动后旧 token 会失效；
3. HTTPS 环境下 `COOKIE_SECURE` 是否为 `true`，HTTP 环境下是否为 `false`（配反了浏览器不会发送 Cookie）；
4. 浏览器里是否残留旧版本代码缓存的 `Authorization` 头，`Ctrl + Shift + R` 强刷一次。

### 编辑或删除用户报 404

早期版本后端缺少 `PATCH / DELETE /api/users/{id}` 路由。确认后端已更新到最新代码并重启。另外注意用户主键是 UUID 字符串而非自增数字，如果列表里出现 `id` 为纯数字的历史脏数据，说明数据库混入了旧种子数据，需要清理。

### 首页榜单、图表是空的

已上线新闻（`publishState=2`）应对所有角色公开。如果区域管理员登录后首页空白，检查后端 `list_news` 是否在 `publishState=2` 时跳过了行级隔离；如果确实没有已发布的新闻，先走一遍「撰写 → 送审 → 审核通过 → 发布」流程造数据。

### 区域管理员添加用户时区域选不了

区域管理员只能添加本区域编辑，下拉里只有自己所在区域可选、其余置灰，并会自动预填。如果整个下拉都不可选，检查 `UserForm.jsx` 里 `checkRegionDisabled` 的新增分支，以及 `roleId` 比较是否做了字符串归一化（后端可能返回数字 `1`）。

### 富文本样式在详情页丢失

确认 `frontend/src/styles/news-article.css` 已被引入。详情页与后台预览页共用这份样式，改动它会影响两个页面。

### 修改分类或地区后没生效

`GET /api/categories` 与 `GET /api/regions` 返回的是数据库实时数据，若前端有缓存或页面未刷新，强刷一次即可。

---

## ✅ 当前完成度

- ✅ **认证与凭证**：JWT + HttpOnly Cookie 登录、登出、注册，bcrypt 密码哈希，401 统一处理
- ✅ **RBAC 权限**：菜单树服务端下发、前端路由过滤、按钮级 `hasPerm`、接口 `need(key)` 校验，四层同一口径
- ✅ **行级隔离**：超管全量 / 区域管理员本区域 / 区域编辑仅本人，已上线内容公开
- ✅ **新闻全流程**：撰写（富文本）、草稿、送审、审核通过/驳回、发布、下线、删除
- ✅ **数据看板**：点赞榜、浏览榜、分类柱状图、个人稿件分类饼图
- ✅ **内容安全**：后端 bleach 入库白名单过滤 + 前端 DOMPurify 渲染兜底
- ✅ **阅读体验**：详情页与后台预览页统一阅读型排版，含图片、引用、代码块、表格完整样式
- ✅ **明暗主题**：顶栏一键切换，覆盖后台与阅读页
- ✅ **请求优化**：首页 4 接口并发一次拉取，`/auth/me` 带缓存不重复请求
- ⚠️ **数据初始化**：表结构自动创建，但初始的角色、权限、字典与用户数据需要自行导入
- ⚠️ **会话策略**：JWT 有效期 24 小时且无刷新机制，登出后旧 token 在自然过期前理论上仍有效，尚未引入 refresh token 或黑名单
- ⚠️ **CSRF**：目前依赖 `SameSite=Lax`，尚未对写操作补充 `Origin/Referer` 校验或双提交 token

---

## 🌱 后续优化方向

- 🚧 **登录注册加固**
  注册与登录接口补充频率限制（如按 IP 每分钟限次）、密码强度校验、登录失败锁定；登录失败统一返回「用户名或密码错误」，不再区分「用户不存在」和「密码错误」，避免用户名枚举。
- 🚧 **JWT 密钥强制校验**
  当前 `JWT_SECRET` 有默认兜底值，生产环境应改为未配置就拒绝启动，避免用默认密钥签发可被伪造的 token。
- 🚧 **Access / Refresh 双 token**
  access token 缩短到 15~30 分钟，配合 HttpOnly 的 refresh token 续期，登出或改密时让 refresh 失效，缩短凭证泄露的窗口期。
- 🚧 **CSRF 防护补齐**
  对发布、审核、改权限、删用户等写操作增加 `Origin/Referer` 校验，或引入双提交 CSRF token。
- 🚧 **历史数据批量清洗**
  写一个一次性脚本，把库里已有的 `news.content` 全量过一遍 `sanitize_html` 再回写，让存量数据也变干净，而不只是靠前端兜底。
- 🚧 **编辑器收敛攻击面**
  关闭编辑器的 Raw HTML 粘贴模式；图片改为上传转存站内地址，禁止外链图片，既防跟踪信标也避免外链失效。
- 🚧 **评论功能**
  当前详情页的评论数固定为 0，可补齐评论表、发表与审核接口，并把点赞从纯前端自增改为服务端计数。
- 🚧 **操作审计日志**
  记录谁在什么时间审核、发布、下线了哪篇稿子，以及权限变更历史，便于问题追溯。
- 🚧 **测试与工程化**
  补充后端接口测试（认证、RBAC、行级隔离、过滤）与前端关键流程测试；引入 CI 做 lint 与构建校验。
- 🚧 **部署方案**
  补充 Docker Compose 编排（后端 + Nginx 前端 + MySQL），把当前需要手工配置的环境变量、数据库初始化流程脚本化。
- 🚧 **性能与体验**
  列表接口已支持分页，前端可改为真正的服务端分页；补充骨架屏、错误边界与请求取消，提升弱网体验。
