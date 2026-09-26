import React, { useEffect, useState } from 'react'
import { Descriptions } from 'antd';
import { useParams  } from 'react-router-dom';
import moment from 'moment';
import { useTheme } from '@/context/ThemeContext.jsx';
import './NewsPreview.css';
import request from '@/util/request.js'

export default function NewsPreview() {
  const [newsInfo,setNewsInfo] = useState(null)
  const [error, setError] = useState(null)
  const { id } = useParams();
  const { isDarkMode } = useTheme();

  const auditList = ['未审核','审核中','已通过','未通过']
  const publishList = ['未发布','待发布','已上线','已下线']
  const colorList = ['black','orange','green','red']

  useEffect(()=>{
    if (!id) {
      console.error('id 参数未定义')
      setError('ID 参数缺失')
      return
    }
    
    // 使用标记来跟踪组件是否已卸载
    let isMounted = true;
    
    request.get(`/news/${id}`).then(res=>{
      // 只有在组件仍然挂载时才更新状态
      if (isMounted) {
        setNewsInfo(res.data);
        setError(null)
      }
    }).catch(err=>{
      // 只有在组件仍然挂载时才更新状态
      if (isMounted) {
        console.error('请求失败：',err)
        setError(err.response?.status === 404 ? '新闻不存在' : '加载失败，请稍后重试')
        setNewsInfo(null)
      }
    });
    
    // 清理函数：组件卸载时设置标记为 false
    return () => {
      isMounted = false;
    };
  },[id])

  if (error) {
    return <div style={{padding: '20px', color: 'red'}}>错误：{error}</div>
  }

  if (!newsInfo) {
    return <div>加载中...</div>; // 显示加载状态
  }

  const formatTime = (time) => {
    if (!time && time !== 0) return '-';
    const num = Number(time);
    if (Number.isNaN(num)) return '-';
    return moment(num).format('YYYY/MM/DD HH:mm:ss');
  };

  const items = [
    {
      key: '1',
      label: '创建者',
      children: <span>{newsInfo.author}</span>,
    },
    {
      key: '10',
      label: '新闻类型',
      children: <span>{newsInfo.category?.title || newsInfo.categoryId || '-'}</span>,
    },
    {
      key: '2',
      label: '创建时间',
      children: <span>{formatTime(newsInfo.createTime)}</span>,
    },
    {
      key: '3',
      label: '发布时间',
      children: <span>{formatTime(newsInfo.publishTime)}</span>,
    },
    {
      key: '4',
      label: '区域',
      children: <span>{newsInfo.region}</span>,
    },
    {
      key: '5',
      label: '审核状态',
      children: <span style={{color:colorList[newsInfo.auditState]}}>{auditList[newsInfo.auditState]}</span>,
    },
    {
      key: '6',
      label: '发布状态',
      children: <span style={{color:colorList[newsInfo.publishState]}}>{publishList[newsInfo.publishState]}</span>,
    },
    {
      key: '7',
      label: '访问数量',
      children: <span>{newsInfo.view}</span>,
    },
    {
      key: '8',
      label: '点赞数量',
      children: <span>{newsInfo.star}</span>,
    },
    {
      key: '9',
      label: '评论数量',
      children: 0,
    },
  ];

  return (
    <div className={`news-preview-content ${isDarkMode ? 'dark' : ''}`}>
      <Descriptions title={newsInfo?.title} items={newsInfo?items:null} style={{margin:'30px'}}/>

      <div
        className={`news-preview-content ${isDarkMode ? 'dark' : ''}`}
        dangerouslySetInnerHTML={{
          __html:newsInfo.content
        }}
        style={{marginLeft:'30px',border:'1px solid gray'}}
      >

      </div>
    </div>
  )
}
