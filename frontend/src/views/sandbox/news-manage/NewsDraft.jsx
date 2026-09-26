import { Button, Table,Modal,notification } from "antd";
import request from '@/util/request.js'
import { useState,useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DeleteOutlined,EditOutlined,ExclamationCircleFilled,UploadOutlined } from '@ant-design/icons'
import { createStyles } from 'antd-style';
import { checkLogin, getUser } from '@/util/checkLogin';
import { showLoginModal } from '@/components/common/LoginModal';
import { useLocation } from 'react-router-dom';

const { confirm } = Modal;
const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token;
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});

export default function NewsDraft() {
  const navigate = useNavigate()
  const location = useLocation()
  const { styles } = useStyle();
  const [dataSource,setDataSource] = useState([])
  const isLogin = checkLogin()
  const token = isLogin ? getUser() : null
  const username = token?.username || ''

  useEffect(()=>{
    // 未登录用户不显示草稿列表
    if (!isLogin) {
      setDataSource([])
      return
    }
    
    // 使用标记来跟踪组件是否已卸载
    let isMounted = true;
    
    request.get('/news', { params: { author: username, auditState: 0 } }).then(res=>{
      // 只有在组件仍然挂载时才更新状态
      if (isMounted) {
        // 后端可能返回 { total, list } 或数组格式
        const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        data.forEach(item => {
          if (item.children && item.children.length === 0) {
            item.children = null;
          }
        });
        setDataSource(data)
      }
    }).catch(err => {
      if (isMounted) {
        console.error('获取草稿列表失败：', err);
      }
    });
    
    // 清理函数：组件卸载时设置标记为 false
    return () => {
      isMounted = false;
    };
  },[username, isLogin])

  const deleteMethod = (item) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    setDataSource(dataSource.filter(data => data.id !== item.id))
    request.delete(`/news/${item.id}`)
  }

  const showConfirm = (item) => {
    confirm({
      title: '你确定要删除吗？',
      icon: <ExclamationCircleFilled />,
      // content: 'Some descriptions',
      onOk() {
        // console.log('OK');
        deleteMethod(item)
      },
      onCancel() {
        // console.log('Cancel');
      },
    });
  };

  const handleCheck = (id) =>{
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    request.patch(`/news/${id}`,{
      auditState: 1
    }).then(res=>{
      navigate('/audit-manage/list')
      notification.info({
        message: `通知`,
        description:
          `您可到审核列表中查看您的新闻`,
        placement: 'bottomRight',
      });
    }).catch(err => {
      console.error('提交审核失败:', err)
      notification.error({
        message: '提交失败',
        description: '提交审核失败，请稍后重试',
        placement: 'bottomRight',
      });
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      render:(id) => {
        return <b>{id}</b>
      },
    },
    {
      title: '新闻标题',
      dataIndex: 'title',
      render:(title,item)=>{
        return <Link to={`/news-manage/preview/${item.id}`}>{title}</Link>
      }
    },
    {
      title: '作者',
      dataIndex: 'author',
    },
    {
      title: '新闻分类',
      dataIndex: 'categoryId',
      render:(value, record) => {
        return <div>{record.category?.title || value}</div>
      }
    },
    {
      title: '操作',
      render:(item) => {
        return <div>
          <Button danger shape="circle" icon={<DeleteOutlined/>} onClick={()=>showConfirm(item)}/>
          <Button shape="circle" icon={<EditOutlined/>} 
            onClick={()=>{
              if (!isLogin) {
                showLoginModal(navigate, location.pathname);
                return;
              }
              navigate(`/news-manage/update/${item.id}`)
            }}/>
          <Button type="primary" shape="circle" icon={<UploadOutlined 
            onClick={()=>{
              handleCheck(item.id)
            }}
          />} />
        </div>
      }
    },
  ];

  return (
    <Table 
      className={styles.customTable}
      dataSource={dataSource} 
      columns={columns} 
      pagination={{ pageSize: 5 }}
      scroll={{ y: 50 * 6 }}
      rowKey={item=>item.id}
    />
  )
}
