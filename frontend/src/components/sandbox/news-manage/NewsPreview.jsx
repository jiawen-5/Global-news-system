import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, Result, Tag } from 'antd'
import {
  ClockCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  HeartTwoTone,
  UserOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import { useTheme } from '@/context/ThemeContext.jsx'
import request from '@/util/request.js'
import sanitizeHtml from '@/util/sanitize.js'
import '@/styles/news-article.css'

const auditList = ['未审核', '审核中', '已通过', '未通过']
const publishList = ['未发布', '待发布', '已上线', '已下线']
const auditColor = ['default', 'processing', 'success', 'error']
const publishColor = ['default', 'warning', 'success', 'default']

export default function NewsPreview() {
  const [newsInfo, setNewsInfo] = useState(null)
  const [categoryTitle, setCategoryTitle] = useState('')
  const [error, setError] = useState(null)
  const { id } = useParams()
  const { isDarkMode } = useTheme()

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
        // 分类 id 是数字，换成中文标题展示
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

  if (error) {
    return (
      <Result
        status={error === '新闻不存在' ? '404' : 'error'}
        title={error}
        style={{ paddingTop: 48 }}
      />
    )
  }

  if (!newsInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="article-loading">
          <Spin size="large" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  const formatTime = (time) => {
    if (!time && time !== 0) return '-'
    const num = Number(time)
    if (Number.isNaN(num)) return '-'
    return moment(num).format('YYYY/MM/DD HH:mm')
  }

  const contentHtml = sanitizeHtml(newsInfo.content)

  return (
    <div className={isDarkMode ? 'article-dark' : ''}>
      <article className="article-card">
        <header>
          {categoryTitle && <span className="article-tag">{categoryTitle}</span>}
          <h1 className="article-title">{newsInfo.title}</h1>

          <div className="article-meta">
            <span><UserOutlined />{newsInfo.author || '佚名'}</span>
            <span><ClockCircleOutlined />{formatTime(newsInfo.createTime)}</span>
            {newsInfo.region && <span><GlobalOutlined />{newsInfo.region}</span>}
          </div>

          <div className="article-stats">
            <span><EyeOutlined />{newsInfo.view || 0}</span>
            <span>
              <HeartTwoTone twoToneColor="#eb2f96" />{newsInfo.star || 0}
            </span>
          </div>
        </header>

        <div className="article-divider" />

        {/* 后台预览独有的审核 / 发布状态信息 */}
        <div className="article-status">
          <div className="article-status-item">
            <span className="article-status-label">审核状态</span>
            <Tag color={auditColor[newsInfo.auditState] || 'default'} style={{ marginInlineEnd: 0 }}>
              {auditList[newsInfo.auditState] || '未知'}
            </Tag>
          </div>
          <div className="article-status-item">
            <span className="article-status-label">发布状态</span>
            <Tag color={publishColor[newsInfo.publishState] || 'default'} style={{ marginInlineEnd: 0 }}>
              {publishList[newsInfo.publishState] || '未知'}
            </Tag>
          </div>
          <div className="article-status-item">
            <span className="article-status-label">发布时间</span>
            <span className="article-status-value">{formatTime(newsInfo.publishTime)}</span>
          </div>
        </div>

        {contentHtml
          ? <div className="article-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          : <div className="article-empty">暂无正文内容</div>}
      </article>
    </div>
  )
}
