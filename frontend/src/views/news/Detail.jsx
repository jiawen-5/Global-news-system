import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spin, Result, Button } from 'antd'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  HeartTwoTone,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import request from '@/util/request.js'
import sanitizeHtml from '@/util/sanitize.js'
import '@/styles/news-article.css'
import './Detail.css'

export default function Detail() {
  const [newsInfo, setNewsInfo] = useState(null)
  const [categoryTitle, setCategoryTitle] = useState('')
  const [error, setError] = useState(null)
  const { id } = useParams()

  useEffect(() => {
    if (!id) {
      setError('ID 参数缺失')
      return
    }

    let isMounted = true

    request.get(`/news/${id}`)
      .then(res => {
        if (!isMounted) return
        const raw = res.data?.news || res.data || {}
        setNewsInfo(raw)
        setError(null)
        // 分类 id 是数字，直接显示不好看，换成中文标题
        if (raw?.category?.title) {
          setCategoryTitle(raw.category.title)
        } else if (raw?.categoryId) {
          request.get('/categories')
            .then(cat => {
              if (!isMounted) return
              const list = Array.isArray(cat.data) ? cat.data : []
              const hit = list.find(c => String(c.id) === String(raw.categoryId))
              setCategoryTitle(hit?.title || hit?.value || '')
            })
            .catch(() => { /* 拿不到分类就不展示标签 */ })
        }
      })
      .catch(err => {
        if (!isMounted) return
        console.error('获取新闻详情失败:', err)
        setError(err.response?.status === 404 ? '新闻不存在' : '加载失败，请稍后重试')
        setNewsInfo(null)
      })

    return () => { isMounted = false }
  }, [id])

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

  if (error) {
    return (
      <div className="detail-page">
        <div className="detail-state">
          <Result
            status={error === '新闻不存在' ? '404' : 'error'}
            title={error}
            extra={<Link to="/news"><Button type="primary">返回新闻列表</Button></Link>}
          />
        </div>
      </div>
    )
  }

  if (!newsInfo) {
    return (
      <div className="detail-page">
        <div className="detail-state">
          <div className="article-loading">
            <Spin size="large" />
            <span>加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  const publishText = newsInfo.publishTime
    ? moment(newsInfo.publishTime).format('YYYY/MM/DD HH:mm')
    : '-'

  const contentHtml = sanitizeHtml(newsInfo.content)

  return (
    <div className="detail-page">
      <article className="article-card">
        <Link to="/news" className="detail-back">
          <ArrowLeftOutlined /> 返回新闻列表
        </Link>

        <header>
          {categoryTitle && <span className="article-tag">{categoryTitle}</span>}
          <h1 className="article-title">{newsInfo.title}</h1>

          <div className="article-meta">
            <span><UserOutlined />{newsInfo.author || '佚名'}</span>
            <span><ClockCircleOutlined />{publishText}</span>
            {newsInfo.region && <span><GlobalOutlined />{newsInfo.region}</span>}
          </div>

          <div className="article-stats">
            <span><EyeOutlined />{newsInfo.view || 0}</span>
            <span><MessageOutlined />0</span>
            <span
              className="article-star"
              onClick={handleStar}
              title="点赞"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStar() }}
            >
              <HeartTwoTone twoToneColor="#eb2f96" />{newsInfo.star || 0}
            </span>
          </div>
        </header>

        <div className="article-divider" />

        {contentHtml
          ? <div className="article-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          : <div className="article-empty">暂无正文内容</div>}
      </article>
    </div>
  )
}
