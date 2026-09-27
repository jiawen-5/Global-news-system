import { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim"; 
import './Login.css'
import request from '@/util/request.js';

export default function Register() {
  const [init, setInit] = useState(false);
  const [regionList, setRegionList] = useState([]);
  const navigate = useNavigate()

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  useEffect(() => {
    // 获取区域列表
    request.get('/regions').then(res => {
      const list = Array.isArray(res.data) ? res.data : [];
      setRegionList(list);
    }).catch(err => {
      console.error('获取区域列表失败:', err);
      setRegionList([]);
    });
  }, []);

  const particlesLoaded = (container) => {
    // console.log(container);
  };

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "#0d47a1",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 6,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 200,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  const onFinish = async (values) => {
    try {
      // 调用后端注册接口
      const res = await request.post('/auth/register', {
        username: values.username,
        password: values.password,
        region: values.region,
        roleId: "3" // 区域编辑
      });
      
      if (res.data && (res.data.ok || res.data.message === '注册成功')) {
        message.success('注册成功！请登录');
        // 延迟跳转到登录页
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        message.error('注册失败，请重试');
      }
    } catch (error) {
      console.error('注册失败:', error);
      const errorMsg = error.response?.data?.message || '注册失败，请稍后重试';
      message.error(errorMsg);
    }
  };

  return (
    <div style={{background:'rgb(35,39,65)',height:'100vh'}}>
      {/* 粒子组件背景 */}
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={options}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}
        />
      )}
      <div className='fromContainer2'>
        <div className='logintitle'>用户注册</div>
        <Form
          name="register"
          style={{ maxWidth: 360 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符!' },
              { max: 20, message: '用户名最多20个字符!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" style={{width:'500px'}}/>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符!' }
            ]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="密码" style={{width:'500px'}}/>
          </Form.Item>
          <Form.Item
            name="region"
            rules={[{ required: true, message: '请选择区域!' }]}
          >
            <Select 
              placeholder="请选择区域" 
              style={{width:'500px'}}
            >
              {regionList.map(item => (
                <Select.Option key={item.id} value={item.value || item.title}>
                  {item.title || item.value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button block type="primary" htmlType="submit" style={{width:'500px'}}>
              注册
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="link"
              htmlType="button"
              onClick={() => navigate('/login')}
              style={{width:'500px', textAlign:'center'}}
            >
              已有账号？去登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

