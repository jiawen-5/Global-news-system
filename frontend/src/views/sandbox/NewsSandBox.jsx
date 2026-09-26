import SideMenu from "../../components/sandbox/SideMenu";
import TopHeader from "../../components/sandbox/TopHeader";
import "./NewsSandBox.css";
import { Outlet } from "react-router-dom";
import { Layout, theme, Spin } from "antd";
import { connect } from "react-redux";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";

const { Content } = Layout;

// 把使用 useTheme 的部分放到 ThemeProvider 内部
const NewsContent = ({ isLoading }) => {
  const { isDarkMode } = useTheme();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const contentStyle = isDarkMode
    ? {
        margin: "16px",
        padding: 24,
        minHeight: "calc(100vh - 64px - 32px)",
        overflow: "initial",
        background: "#2d2d2d",
        borderRadius: borderRadiusLG,
      }
    : {
        margin: "16px",
        padding: 24,
        minHeight: "calc(100vh - 64px - 32px)",
        overflow: "initial",
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      };

  return (
    <Content style={contentStyle}>
      <Spin size="large" spinning={isLoading}>
        <Outlet />
      </Spin>
    </Content>
  );
};

const NewsSandBox = (props) => {
  return (
    <ThemeProvider>
      <Layout style={{ minHeight: "100vh" }}>
        <SideMenu />
        <Layout>
          <TopHeader />
          <NewsContent isLoading={props.isLoading} />
        </Layout>
      </Layout>
    </ThemeProvider>
  );
};

const mapStateToProps = ({ LoadingReducer: { isLoading } }) => ({
  isLoading,
});

export default connect(mapStateToProps)(NewsSandBox);
