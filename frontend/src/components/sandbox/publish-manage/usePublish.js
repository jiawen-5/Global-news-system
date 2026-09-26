import request from '@/util/request.js'
import {useEffect, useState} from 'react'
import {notification} from 'antd'
import { checkLogin, getUser } from '@/util/checkLogin';

function usePublish(type){
  const [dataSource,setDataSource] = useState([])
  const isLogin = checkLogin()
  const user = getUser()
  const username = user?.username || ''
  
  useEffect(()=>{
    // 未登录用户不显示发布列表
    if (!isLogin) {
      setDataSource([])
      return
    }
    
    request.get('/news', { params: { author: username, publishState: type } })
      .then(res=>{
        // 后端可能返回 { total, list } 或数组格式
        const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        setDataSource(data)
      })
      .catch(err => {
        console.error('获取发布列表失败:', err)
        setDataSource([])
      })
  },[username,type,isLogin])

  const handlePublish = (id) => {
    if (!isLogin) {
      return;
    }
    console.log(id);
    setDataSource(dataSource.filter(item=>item.id !== id))
    request.patch(`/news/${id}`,{
      publishState:2,
      publishTime: Date.now()
    }).then(res=>{
      notification.info({
        message: `通知`,
        description:
          '您可到[发布管理/已发布]中查看您的新闻的审核状态',
        placement: 'bottomRight',
      });
    })
  }

  const handleSunset = (id) => {
    if (!isLogin) {
      return;
    }
    console.log(id);
    setDataSource(dataSource.filter(item=>item.id !== id))
    request.patch(`/news/${id}`,{
      publishState:3
    }).then(res=>{
      notification.info({
        message: `通知`,
        description:
          '您可到[发布管理/已下线]中查看您的新闻的审核状态',
        placement: 'bottomRight',
      });
    })
  }

  const handleDelete = (id) => {
    if (!isLogin) {
      return;
    }
    console.log(id);
    setDataSource(dataSource.filter(item=>item.id !== id))
    request.delete(`/news/${id}`).then(res=>{
      notification.info({
        message: `通知`,
        description:
          '您已删除了已下线的新闻',
        placement: 'bottomRight',
      });
    })
  }

  return {
    dataSource,
    handlePublish,
    handleSunset,
    handleDelete
  }
}

export default usePublish