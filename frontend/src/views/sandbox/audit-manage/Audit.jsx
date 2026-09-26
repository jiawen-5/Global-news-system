import request from '@/util/request.js'
import React,{useState,useEffect} from 'react'
import { Table,Button } from 'antd'
import { createStyles } from 'antd-style';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

export default function Audit() {
  const [dataSource,setDataSource] = useState([])
  const { styles } = useStyle();
  const navigate = useNavigate()
  const location = useLocation()
  const isLogin = checkLogin()
  const token = isLogin ? getUser() : null
  const roleId = token?.roleId || null
  const region = token?.region || ''
  const username = token?.username || ''

  useEffect(()=>{
    // 未登录或区域编辑不显示审核列表
    if (!isLogin || roleId === '3') {
      setDataSource([])
      return
    }
    
    request.get('/news', { params: { auditState: 1 } }).then(res=>{
      // 后端可能返回 { total, list } 或数组格式
      const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      
      let filtered = []
      if (roleId === '1') {
        // 超级管理员：不能审核自己的新闻，其它所有新闻都可以
        filtered = data.filter(item => item.author !== username)
      } else if (roleId === '2') {
        // 区域管理员：只能审核本区域的区域编辑的新闻
        filtered = data.filter(item => item.region === region && item.roleId === '3')
      }
      
      setDataSource(filtered)
    })
    .catch(err => {
      console.error('获取审核列表失败:', err)
      setDataSource([])
    })
  },[roleId,region,username,isLogin])

  const handleAudit = (item,auditState,publishState) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    setDataSource(dataSource.filter(data=>data.id !== item.id))
    request.patch(`/news/${item.id}`, { auditState })
      .then(() => {
        if (publishState !== undefined) {
          return request.patch(`/news/${item.id}`, { publishState })
        }
        return null
      })
      .catch(err => {
        console.error('审核操作失败:', err)
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
      render:(value, record)=>{
        return <div>{record.category?.title || value}</div>
      }
    },
    {
      title: '操作',
      render:(item) => {
        return <div>
          <Button type='primary' onClick={()=>handleAudit(item,2,1)}>通过</Button> 
          <Button danger onClick={()=>handleAudit(item,3,0)}>驳回</Button> 
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
