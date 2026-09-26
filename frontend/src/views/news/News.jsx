import request from '@/util/request.js'
import React,{useEffect, useState} from 'react'
import { Card, Col, Row,List } from 'antd';
import _ from 'lodash'

export default function News() {
  const [list,setList] = useState([])

  useEffect(()=>{
    request.get('/news', { params: { publishState: 2 } })
      .then(res=>{
        // 后端可能返回 { total, list } 或数组格式
        const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        // console.log(Object.entries(_.groupBy(data,item=>item.category?.title || item.categoryId)));
        setList(Object.entries(_.groupBy(data,item=>item.category?.title || item.categoryId)))
      })
      .catch(err => {
        console.error('获取新闻列表失败:', err)
        setList([])
      })
  },[])

  return (
    <div style={{
      width:'95%',
      margin:'0 auto'
    }}>
      <div>
        <h2 style={{float:'left',margin:'20px'}}>全球大新闻</h2>
        <span style={{lineHeight:'75px',color:'grey'}}>查看新闻</span>
      </div>

      <Row gutter={[16,16]} style={{marginTop:'8px'}}>
        {
          list.map(item=>
            <Col span={8} key={item[0]}>
              <Card title={item[0]} variant="outlined" hoverable='true'>
                <List
                  size="small"
                  dataSource={item[1]}
                  pagination={{pageSize:3}}
                  renderItem={data => <List.Item><a href={`/detail/${data.id}`}>{data.title}</a></List.Item>}
                />
              </Card>
            </Col>
          )
        }
      </Row>
    </div>
  )
}
