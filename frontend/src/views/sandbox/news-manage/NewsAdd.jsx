import { Breadcrumb,Button,Steps,Form,Input,Select, message,notification } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import style from './News.module.css'
import request from '@/util/request.js'
import NewsEditor from '../../../components/sandbox/news-manage/NewsEditor'
import { useTheme } from '../../../context/ThemeContext';
import '../../../components/sandbox/news-manage/NewsPreview.css';
import { checkLogin, getUser } from '@/util/checkLogin';
import { showLoginModal } from '@/components/common/LoginModal';
import { useLocation } from 'react-router-dom';

const { useForm } = Form

export default function NewsAdd() {
  const [current,setCurrent] = useState(0)
  const [categoryList,setCategoryList] = useState([])
  const [fromInfo,setFormInfo] = useState({})
  const [content,setContent] = useState('')
  const [form] = useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode } = useTheme();
  
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
    
    request.post('/news',{
      ...fromInfo,
      'content': content,
      "region": user.region? user.region : '全球',
      "author": user.username,
      "roleId": user.roleId,
      "auditState": auditState,
      "publishState": 0,
      "createTime": Date.now(),
      "star": 0,
      "view": 0,
      // "publishTime":0
    }).then(res=>{
      // 确保数据已保存后再跳转
      if (res.data && (res.data.id || res.data.news?.id)) {
        if (typeof window !== 'undefined') {
          window.__NEWS_EDIT_DIRTY = false;
        }
        notification.info({
          message: `通知`,
          description:
            `您的新闻可在${auditState === 0 ? '草稿箱' : '审核列表'}中查看`,
          placement:'bottomRight',
        });
        // 延迟一小段时间确保后端数据已完全保存
        setTimeout(() => {
          navigate(auditState === 0 ? '/news-manage/draft' : '/audit-manage/list')
        }, 100);
      }
    }).catch(err => {
      console.error('保存失败：', err);
      notification.error({
        message: '保存失败',
        description: '请稍后重试',
        placement:'bottomRight',
      });
    })
  }

  return (
    <div className={`news-preview-content ${isDarkMode ? 'dark' : ''}`}>
      <Breadcrumb
        style={{height:'50px'}}
        items={[
          {title: '新闻管理'},
          {title: '撰写新闻'},
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
            style={{ maxWidth: 600,color:'black' }}
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
              <Input
                onClick={() => {
                  if (!isLogin) {
                    showLoginModal(navigate, location.pathname);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              label="新闻分类"
              name="categoryId"
              rules={[{ required: true, message: 'Please choose your news category !' }]}
            >
              <Select
                onClick={() => {
                  if (!isLogin) {
                    showLoginModal(navigate, location.pathname);
                  }
                }}
              >
                {
                  categoryList.map(item =>
                    <Select.Option value={item.id} key={item.id}>{item.title}</Select.Option>
                  )
                }
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
