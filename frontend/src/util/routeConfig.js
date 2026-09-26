import Home from "@/views/sandbox/home/Home.jsx";
import UserList from "@/views/sandbox/user-manage/UserList.jsx";
import RightList from "@/views/sandbox/right-manage/RightList.jsx";
import RoleList from "@/views/sandbox/right-manage/RoleList.jsx";
import NewsAdd from "@/views/sandbox/news-manage/NewsAdd.jsx";
import NewsDraft from "@/views/sandbox/news-manage/NewsDraft.jsx";
import NewsCategory from "@/views/sandbox/news-manage/NewsCategory.jsx";
import NewsPreview from "@/components/sandbox/news-manage/NewsPreview.jsx";
import NewsUpdate from "@/components/sandbox/news-manage/NewsUpdate.jsx";
import Audit from "@/views/sandbox/audit-manage/Audit.jsx";
import AuditList from "@/views/sandbox/audit-manage/AuditList.jsx";
import Unpublished from "@/views/sandbox/publish-manage/Unpublished.jsx";
import Published from "@/views/sandbox/publish-manage/Published.jsx";
import Sunset from "@/views/sandbox/publish-manage/Sunset.jsx";

export const LocalRouterMap = {
  "/home": Home,
  "/user-manage/list": UserList,
  "/right-manage/role/list": RoleList,
  "/right-manage/right/list": RightList,
  "/news-manage/add": NewsAdd,
  "/news-manage/draft": NewsDraft,
  "/news-manage/category": NewsCategory,
  "/news-manage/preview/:id": NewsPreview,
  "/news-manage/update/:id": NewsUpdate,
  "/audit-manage/audit": Audit,
  "/audit-manage/list": AuditList,
  "/publish-manage/unpublished": Unpublished,
  "/publish-manage/published": Published,
  "/publish-manage/sunset": Sunset,
};

export const ALWAYS_OPEN = ["/news-manage/preview/:id", "/news-manage/update/:id"];
