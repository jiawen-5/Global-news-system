import { Breadcrumb,Button,Steps,Form,Input,Select, message,notification } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate,useParams } from 'react-router-dom';
import style from '@/views/sandbox/news-manage/News.module.css';
import request from '@/util/request.js'
import NewsEditor from './NewsEditor';
import { checkLogin, getUser } from '@/util/checkLogin';

import { showLoginModal } from '@/components/common/LoginModal';
import { useLocation } from 'react-router-dom';

export default function NewsUpdate() {
  const { id } = useParams();
  const [current,setCurrent] = useState(0)
  const [categoryList,setCategoryList] = useState([])
  const [fromInfo,setFormInfo] = useState({})
  const [content,setContent] = useState('')
  const [form] = Form.useForm();
  const navigate = useNavigate()
  const location = useLocation()
  
  // 检查是否登录
  const isLogin = checkLogin()
  const user = getUser()

  useEffect(()=>{
    request.get('/categories').then(res=>{
      // 后端可能返回数组或 { total, list } 格式
      const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      setCategoryList(data)
    }).catch(err => {
      console.error('获取分类列表失败:', err)
      setCategoryList([])
    })
  },[])

  useEffect(()=>{
    // console.log(id);
    request.get(`/news/${id}`).then(res=>{
      try {
        const newsData = res.data?.news || res.data
        let { title, categoryId, content } = newsData
        form.setFieldsValue({ title, categoryId })
        setContent(content || '')
      } catch(err) {
        console.error('加载新闻失败:', err)
      }
    })
  },[id,form])

  const handleNext = () => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    if(current === 0){
      form.validateFields().then(res=>{
        // console.log(res);
        setFormInfo(res)
        if (typeof window !== 'undefined') {
          window.__NEWS_EDIT_DIRTY = true;
        }
        setCurrent(current + 1)
      }).catch(error=>{
        console.log(error);
      })
    }else{
      if(content==='' || content.trim()=== '<p></p>'){
        message.error('新闻内容不能为空')
      }else{
        setCurrent(current + 1)
      }
    } 
  }
  const handlePrev = () => {
    setCurrent(current - 1)
  }

  const handleSave = (auditState) => {
    // 检查是否登录
    if (!isLogin || !user) {
      showLoginModal(navigate, location.pathname);
      return;
    }
    
    request.patch(`/news/${id}`,{
      ...fromInfo,
      'content': content,
      "auditState": auditState,
    }).then(res=>{
      if (typeof window !== 'undefined') {
        window.__NEWS_EDIT_DIRTY = false;
      }
      navigate(auditState === 0 ? '/news-manage/draft' : '/audit-manage/list')
      notification.info({
        message: `通知`,
        description:
          `您可到${auditState===0?'草稿箱':'审核列表'}中查看您的新闻`,
        placement: 'bottomRight',
      });
    })
  }

  return (
    <div>
      <Breadcrumb
        style={{height:'50px'}}
        items={[
          {
            href: '/news-manage/draft',
            title:( 
            <>
              <ArrowLeftOutlined />
              <span>新闻管理</span>
            </>)
          },
          {title: '更新新闻'},
        ]}
      />
      <Steps
        current={current}
        items={[
          {
            title: '基本信息',
            description: '新闻标题，新闻分类'
          },
          {
            title: '新闻内容',
            description: '新闻主体内容'
          },
          {
            title: '新闻提交',
            description: '保存草稿或者提交审核'
          },
        ]}
      />

      <div style={{marginTop:'30px'}}>
        <div className={current === 0 ? '': style.active}>
          <Form
            form={form}
            name="basic"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            // onFinish={onFinish}
            // onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="新闻标题"
              name="title"
              rules={[{ required: true, message: 'Please input your news title !' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="新闻分类"
              name="categoryId"
              rules={[{ required: true, message: 'Please input your news title !' }]}
            >
              <Select>
                {categoryList.map(item => (
                  <Select.Option value={item.id} key={item.id}>
                    {item.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>

        <div className={current === 1 ? '': style.active}>
          <NewsEditor 
            getContent={(value)=>{
              // console.log(value);
              setContent(value)
            }}
            content={content}
          />
        </div>

        <div className={current === 2 ? '': style.active}>

        </div>
      </div>

      <div style={current===1?{marginTop:'30px'}:{marginTop:'50px'}}>
        {
          current === 2 && 
          <span>
            <Button type='primary' onClick={()=>handleSave(0)}>保存草稿箱</Button>
            <Button danger onClick={()=>handleSave(1)}>提交审核</Button>
          </span>
        }
        {
          current<2 && <Button type='primary' onClick={handleNext}>下一步</Button>
        }
        {
          current>0 && <Button onClick={handlePrev}>上一步</Button>
        }
      </div>
    </div>
  )
}
