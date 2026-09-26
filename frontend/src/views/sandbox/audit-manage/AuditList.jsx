import request from '@/util/request.js'
import { Button, Table,Tag,notification  } from "antd";
import React, { useEffect,useState } from 'react'
import { createStyles } from 'antd-style';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { checkLogin, getUser } from '@/util/checkLogin';
import { showLoginModal } from '@/components/common/LoginModal';

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

export default function AuditList() {
  const { styles } = useStyle();
  const navigate = useNavigate()
  const location = useLocation()
  const [dataSource,setDataSource] = useState([])
  const isLogin = checkLogin()
  const user = isLogin ? getUser() : null
  const username = user?.username || ''

  useEffect(()=>{
    // 未登录用户不显示审核列表
    if (!isLogin) {
      setDataSource([])
      return
    }
    
    request.get('/news', { params: { author: username, auditState_ne: 0, publishState_lte: 1 } })
      .then(res=>{
        // 后端可能返回 { total, list } 或数组格式
        const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        setDataSource(data)
      })
      .catch(err => {
        console.error('获取审核列表失败:', err)
        setDataSource([])
      })
  },[username, isLogin])

  const handleRevert = (item) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    setDataSource(dataSource.filter(data=>data.id !== item.id))
    request.patch(`/news/${item.id}`,{
      auditState: 0
    }).then(res=>{
      notification.info({
        message: `通知`,
        description:
          '您可到草稿箱中查看您的新闻',
        placement: 'bottomRight',
      });
    })
  }
  
  const handleUpdate = (item) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    navigate(`/news-manage/update/${item.id}`)
  }

  const handlePublish = (item) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    request.patch(`/news/${item.id}`,{
      publishState: 2,
      publishTime: Date.now()
    }).then(res=>{
      navigate(`/publish-manage/published`)
      notification.info({
        message: `通知`,
        description:
          '您可到【发布管理/已发布】中查看您的新闻',
        placement: 'bottomRight',
      });
    })
  }

  const columns = [
    {
      title: '新闻标题',
      dataIndex: 'title',
      render:(title,item) => {
        return <Link to={`/news-manage/preview/${item.id}`}>{title}</Link>
      },
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
      title: '审核状态',
      dataIndex: 'auditState',
      render:(auditState) => {
        const state = Number(auditState)
        const colorList = ['','orange','green','red']
        const auditList = ['草稿箱','审核中','已通过','未通过']
        return <Tag color={colorList[state]}>{auditList[state]}</Tag>
      }
    },
    {
      title: '操作',
      render:(item) => {
        const state = Number(item.auditState)
        return <div>
          {
            state === 1 && <Button type='primary' onClick={()=>handleRevert(item)}>撤销</Button>
          }
          {
            state === 2 && <Button type='primary'  onClick={()=>handlePublish(item)}>发布</Button>
          }
          {
            state === 3 && <Button type='primary' onClick={()=>handleUpdate(item)}>更新</Button>
          }
        </div>
      }
    },
  ];

  return (
    <div>
      <Table 
        className={styles.customTable}
        dataSource={dataSource} 
        columns={columns} 
        pagination={{ pageSize: 5 }}
        scroll={{ y: 50 * 6 }}
        rowKey={(item)=>item.id}
      />
    </div>
  )
}
