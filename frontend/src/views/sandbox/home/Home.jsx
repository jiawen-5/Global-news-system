import { Card, Col, Row,List,Avatar,Drawer } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import groupBy from 'lodash/groupBy';
import request from '../../../util/request';
import { ThemeProvider } from '../../../context/ThemeContext';
import { useTheme } from '@/context/ThemeContext.jsx';
const { Meta } = Card;

const getList = (res) => Array.isArray(res.data) ? res.data : (res.data?.list || []);
const getTitle = (item, categoriesMap) => {
  if (item.category?.title) return item.category.title;
  if (item.categoryId && categoriesMap[item.categoryId]) return categoriesMap[item.categoryId];
  return '未分类';
};

export default function Home() {
  const { isDarkMode,appStyles } = useTheme();
  const [viewList,setViewList] = useState([])
  const [starList,setStarList] = useState([])
  const [allList,setAllList] = useState([])
  const [categoriesMap, setCategoriesMap] = useState({})
  const [open, setOpen] = useState(false);
  const barRef = useRef()
  const pieRef = useRef()
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // 所有接口只请求一次：合并到单个 effect，空依赖，StrictMode 下用 cancelled 守卫
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      request.get('/categories').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
      request.get(`/news?publishState=2&_sort=-view&_order=desc&_limit=6`).then(getList).catch(() => []),
      request.get(`/news?publishState=2&_sort=-star&_order=desc&_limit=6`).then(getList).catch(() => []),
      request.get(`/news?publishState=2`).then(getList).catch(() => []),
    ]).then(([categories, views, stars, all]) => {
      if (cancelled) return;
      const map = {};
      categories.forEach(cat => { if (cat?.id) map[cat.id] = cat.title || cat.value || '未分类'; });
      setCategoriesMap(map);
      setViewList(views);
      setStarList(stars);
      setAllList(all);
    });
    return () => { cancelled = true; };
  }, []);

  // 安全获取用户信息，处理 SSR 环境
  const userStr = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user');
  }, [])

  const token = useMemo(() => {
    if (!userStr) return {};
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return {};
    }
  }, [userStr])

  // 未登录时显示默认值
  const username = useMemo(() => token?.username || '游客', [token])
  const region = useMemo(() => token?.region || '全球', [token])
  const roleName = useMemo(() => token?.role?.roleName || '游客', [token])
  const isLogin = useMemo(() => !!userStr, [userStr])

  // 柱状图：纯渲染 effect，只依赖数据，不依赖 chart 实例，不再触发请求
  useEffect(() => {
    if (!barRef.current || allList.length === 0) return;
    if (!barChartRef.current) {
      barChartRef.current = echarts.getInstanceByDom(barRef.current) || echarts.init(barRef.current);
    }
    const myChart = barChartRef.current;
    const grouped = groupBy(allList, item => getTitle(item, categoriesMap));
    const keys = Object.keys(grouped);
    const values = Object.values(grouped).map(item => item.length);
    if (keys.length === 0) { keys.push('暂无数据'); values.push(0); }
    myChart.setOption({
      title: { text: '新闻分类图示' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['数量'] },
      xAxis: { data: keys, axisLabel: { rotate: keys.some(k => k.length > 6) ? -15 : 0 } },
      yAxis: { minInterval: 1, type: 'value' },
      series: [{ name: '数量', type: 'bar', data: values, itemStyle: { color: '#1890ff' } }]
    });
    const onResize = () => myChart.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [allList, categoriesMap]);

  useEffect(() => () => {
    barChartRef.current?.dispose();
    barChartRef.current = null;
    pieChartRef.current?.dispose();
    pieChartRef.current = null;
  }, []);

  const renderPieView = () => {
    if (!pieRef.current) return;
    const safeAllList = Array.isArray(allList) ? allList : []
    let currentList = safeAllList;
    if (isLogin) {
      const mine = safeAllList.filter(item => item.author === username);
      currentList = mine.length > 0 ? mine : safeAllList;
    }
    const groupObj = groupBy(currentList, item => getTitle(item, categoriesMap));
    const list = Object.entries(groupObj).map(([name, v]) => ({ name, value: v.length }));
    if (!pieChartRef.current) {
      pieChartRef.current = echarts.getInstanceByDom(pieRef.current) || echarts.init(pieRef.current);
    }
    const myChart = pieChartRef.current;
    myChart.setOption({
      title: {
        text: !isLogin
          ? '请登录后查看个人新闻分类'
          : (currentList.length === safeAllList.length ? '全部新闻分类图示' : '当前用户新闻分类图示'),
        left: 'center'
      },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{ name: '发布数量', type: 'pie', radius: '50%', data: list,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
    });
  };

  useEffect(() => {
    if (open && allList.length > 0) {
      const timer = setTimeout(renderPieView, 0);
      return () => clearTimeout(timer);
    }
    if (!open && pieChartRef.current) {
      pieChartRef.current.dispose();
      pieChartRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allList, categoriesMap, username, isLogin]);

  return (
    <ThemeProvider>
    <div style={isDarkMode?appStyles.card: {}}>
      <Row gutter={16}>
        <Col span={8}>
          <Card title={
            <div style={isDarkMode ? { color: '#fff' } : {}}>
              用户点赞最多
            </div>
          } variant="outlined" style={isDarkMode?appStyles.card: {}}>
            <List
              style={isDarkMode?appStyles.card: {}}
              size="small"
              // bordered
              dataSource={Array.isArray(starList) ? starList : []}
              renderItem={item => <List.Item>
                <a href={`/detail/${item.id}`}>{item.title}</a>
              </List.Item>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={
            <div style={isDarkMode ? { color: '#fff' } : {}}>
              用户浏览最多
            </div>
          } variant="outlined" style={isDarkMode?appStyles.card: {}}>
            <List
              style={isDarkMode?appStyles.card: {}}
              size="small"
              // bordered
              dataSource={Array.isArray(viewList) ? viewList : []}
              renderItem={item => <List.Item>
                <a href={`/detail/${item.id}`}>{item.title}</a>
              </List.Item>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={isDarkMode?appStyles.card: {}}
            cover={
              <img
                alt="example"
                src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
              />
            }
            actions={[
              <SettingOutlined key="setting" onClick={()=>{
                  setOpen(true)
              }}/>,
              <EditOutlined key="edit" />,
              <EllipsisOutlined key="ellipsis" />,
            ]}
          >
            <Meta
              style={isDarkMode?appStyles.card: {}}
              avatar={<Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />}
              title={username}
              description={
                <div style={isDarkMode?appStyles.card: {}}>
                  <b>{region?region : '全球'}</b>
                  <span style={{paddingLeft:'30px'}}>{roleName}</span>
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        width='500px'
        title="个人新闻分类"
        closable={{ 'aria-label': 'Close Button' }}
        onClose={()=>{
          setOpen(false)
        }}
        open={open}
      >
        <div ref={pieRef} style={{
        height:"400px",
        marginTop:'30px'
      }}></div>
      </Drawer>

      <div ref={barRef}
        style={isDarkMode?{height:"400px",marginTop:'30px',color:'white'}: {height:"400px",marginTop:'30px'}}
      ></div>
    </div>
    </ThemeProvider>
  )
}
