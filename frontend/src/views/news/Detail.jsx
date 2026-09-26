import React, { useEffect, useState } from 'react'
import { Descriptions } from 'antd';
import { useParams  } from 'react-router-dom';
import request from '@/util/request.js';
import moment from 'moment';
import {HeartTwoTone} from '@ant-design/icons';

export default function Detail() {
  const [newsInfo,setNewsInfo] = useState(null)
  const [error, setError] = useState(null)
  const { id } = useParams();

  useEffect(()=>{
    if (!id) {
      setError('ID 参数缺失')
      return
    }

    request.get(`/news/${id}`)
      .then(res=>{
        const raw = res.data?.news || res.data || {}
        setNewsInfo(raw)
        setError(null)
      })
      .catch(err => {
        console.error('获取新闻详情失败:', err)
        setError(err.response?.status === 404 ? '新闻不存在' : '加载失败，请稍后重试')
        setNewsInfo(null)
      })
  },[id])

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>错误：{error}</div>
  }

  if (!newsInfo) {
    return <div>加载中...</div>; // 显示加载状态
  }

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
      key: '3',
      label: '发布时间',
      children: newsInfo.publishTime
        ? <span>{moment(newsInfo.publishTime).format('YYYY/MM/DD HH:mm:ss')}</span>
        : '-',
    },
    {
      key: '4',
      label: '区域',
      children: <span>{newsInfo.region}</span>,
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

  const handleStar = () => {
    setNewsInfo(prev => ({
      ...prev,
      star: (prev?.star || 0) + 1
    }))
    // 如需与后端同步点赞数，可在后端增加专门接口后再打开下面的请求
    // request.put(`/news/${id}/star`, {
    //   star: (newsInfo?.star || 0) + 1
    // })
  }

  return (
    <div>
      <Descriptions 
        title={newsInfo?.title} 
        items={items} 
        style={{margin:'30px'}} 
        extra={<HeartTwoTone twoToneColor="#eb2f96" onClick={handleStar}/>}
      />

      <div
        dangerouslySetInnerHTML={{ __html: newsInfo.content || '' }}
        style={{marginLeft:'30px',border:'1px solid gray'}}
      >
      </div>
    </div>
  )
}
