// import { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, Layout,theme,Dropdown,Avatar } from 'antd';
import { useNavigate } from 'react-router-dom'
import { connect  } from 'react-redux';
import { useTheme } from '@/context/ThemeContext.jsx';
import { checkLogin, getUser, logout } from '@/util/checkLogin';
const { Header } = Layout;


const TopHeader = (props) => {
  // console.log(props);
  
  // const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate()
  const isLogin = checkLogin()
  const token = getUser() || {}
  const roleName = token?.role?.roleName || ''
  const username = token?.username || ''
  const { isDarkMode, toggleDarkMode, appStyles } = useTheme();

  const changeCollapsed = () => {
    props.changeCollapsed()
  }

  const items = isLogin ? [
    {
      label: (
        <div>
          {roleName}
        </div>
      ),
      key: '0',
    },
    {
      label: (
        <div onClick={toggleDarkMode}>
          {isDarkMode ? '切换亮色模式':'切换暗色模式'}
        </div>
      ),
      key: '2',
    },
    {
      label: (
        <div onClick={()=>{ logout(); navigate('/login') }}>
          退出
        </div>
      ),
      key: '1',
      danger:true
    },
  ] : [
    {
      label: (
        <div onClick={() => navigate('/login')}>
          请登录
        </div>
      ),
      key: '0',
    },
    {
      label: (
        <div onClick={toggleDarkMode}>
          {isDarkMode ? '切换亮色模式':'切换暗色模式'}
        </div>
      ),
      key: '2',
    },
  ];

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Header style={isDarkMode?appStyles.header:{ padding: 0, background: colorBgContainer }}>
      <Button
        type="text"
        icon={props.isCollapsed ? <MenuUnfoldOutlined onClick={()=>changeCollapsed()}/> : <MenuFoldOutlined onClick={()=>changeCollapsed()}/>}
        // onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: '16px',
          width: 64,
          height: 64,
        }}
      />

      <div style={{float:'right'}}>
        {isLogin ? (
          <span style={{marginRight:'10px'}}>欢迎<span style={{color:'#1890ff'}}> {username} </span>回来</span>
        ) : (
          <span style={{marginRight:'10px'}}>请登录</span>
        )}

        <Dropdown menu={{ items }}>
            <Avatar size={40} icon={<UserOutlined />} style={{marginRight:'16px'}}/>
        </Dropdown>
      </div>
    </Header>
  )
}

const mapStateToProps = ({CollapsedReducer:{isCollapsed}}) => {
  // console.log(state);
  return {
    isCollapsed
  }
}

const mapDispatchToProps = {
  changeCollapsed(){
    return {
      type: 'change_collapsed'
    }
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(TopHeader)
