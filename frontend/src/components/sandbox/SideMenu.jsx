import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Modal } from "antd";
import { UserOutlined, VideoCameraOutlined, UploadOutlined, AuditOutlined, CloudUploadOutlined, ProductOutlined } from "@ant-design/icons";
import { connect } from "react-redux";
import { fetchMe } from "@/util/getRoutes.js";
import "./index.css";

const { Sider } = Layout;

const iconMap = {
  "/home": <UserOutlined />,
  "/user-manage": <VideoCameraOutlined />,
  "/user-manage/list": <UserOutlined />,
  "/right-manage": <UploadOutlined />,
  "/right-manage/role/list": <UserOutlined />,
  "/right-manage/right/list": <UserOutlined />,
  "/audit-manage": <AuditOutlined />,
  "/publish-manage": <CloudUploadOutlined />,
  "/news-manage": <ProductOutlined />,
};

function toAntd(items) {
  return (items || [])
    .filter((n) => Number(n.is_show) === 1)
    .map((n) => ({
      key: n.key,
      label: n.title,
      icon: iconMap[n.key] || null,
      children: n.children?.length ? toAntd(n.children) : undefined,
    }));
}

function SideMenu(props) {
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchMe().then((me) => setMenu(toAntd(me.menus || []))).catch(() => setMenu([]));
  }, [location.pathname]);

  const onClick = (e) => {
    if (typeof window !== "undefined" && window.__NEWS_EDIT_DIRTY) {
      Modal.confirm({
        title: "当前内容未保存",
        content: "确定要离开吗？未保存内容将丢失。",
        okText: "仍要离开",
        cancelText: "取消",
        onOk: () => { window.__NEWS_EDIT_DIRTY = false; navigate(e.key); },
      });
      return;
    }
    navigate(e.key);
  };

  return (
    <Sider trigger={null} collapsible collapsed={props.isCollapsed} className="sider-container">
      <div className="sider-content">
        {props.isCollapsed ? (
          <div className="demo-logo-vertical demo-logo-vertical--placeholder" aria-hidden="true">&nbsp;</div>
        ) : (
          <div className="demo-logo-vertical" title="全球新闻发布管理系统">全球新闻发布管理系统</div>
        )}
        <div className="menu-scroll-container">
          <Menu
            onClick={onClick}
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={["/" + location.pathname.split("/")[1]]}
            items={menu}
          />
        </div>
      </div>
    </Sider>
  );
}

export default connect(({ CollapsedReducer: { isCollapsed } }) => ({ isCollapsed }))(SideMenu);
