import { Button, Table,Modal,Switch,Form } from "antd";
import request from '@/util/request.js'
import UserForm from "../../../components/sandbox/user-manage/UserForm";
import { useState,useEffect,useRef } from "react";
import { DeleteOutlined,EditOutlined,ExclamationCircleFilled } from '@ant-design/icons'
import { createStyles } from 'antd-style';
import { useTheme } from "@/context/ThemeContext.jsx";
import { getUser } from '@/util/checkLogin';
const { confirm } = Modal;
const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token;
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});

const roleObj = {
    '1': 'superadmin',
    '2': 'admin',
    '3': 'editor'
  }

export default function UserList() {
  const { isDarkMode,appStyles } = useTheme();
  const { styles } = useStyle();
  const [form] = Form.useForm();
  const [dataSource,setDataSource] = useState([])
  const [roleList,setRoleList] = useState([])
  const [regionList,setRegionList] = useState([])
  const [open, setOpen] = useState(false);
  const [update,setUpdate] = useState(false)
  // const [formValues, setFormValues] = useState();
  // const [selectOptions, setSelectOptions] = useState([]);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(false)
  const [current, setCurrent] = useState(null)
  const addForm = useRef(null)
  const updateForm = useRef(null)

  const {roleId,region,username} = getUser() || {}

  useEffect(()=>{
    // 取足够大的 pageSize，避免默认分页漏掉后面新注册的用户
    request.get('/users')
      .then(res=>{
        // 后端可能返回 { total, list } 或数组格式
        const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        const filtered = roleObj[roleId] === 'superadmin'
          ? list
          : [
              ...list.filter(item=>item.username === username),
              ...list.filter(item=>item.region === region && roleObj[item.roleId]=== 'editor'),
            ]
        setDataSource(Array.isArray(filtered) ? filtered : [])
      })
      .catch(err => {
        console.error('获取用户列表失败：', err)
        setDataSource([])
      })
  },[roleId,region,username])

  useEffect(()=>{
    request.get('/regions')
      .then(res=>{
        const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        setRegionList(list)
      })
      .catch(err => {
        console.error('获取区域列表失败：', err)
        setRegionList([])
      })
  },[])

  useEffect(()=>{
    request.get('/roles')
      .then(res=>{
        const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])

      // 将角色数据转换为Select需要的格式（label和value）
      const options = list.map(role => ({
        // label是下拉框中显示的文字
        label: role.roleName, 
        // value是选中后表单实际提交的值（通常用id）
        value: role.id 
      }));
      
      setRoleList(options);
    })
      .catch(err => {
        console.error('获取角色列表失败：', err)
        setRoleList([])
      })
  },[])


  const deleteMethod = (item) => {
    // console.log(item);
    
    // // 当前页面同步状态 + 后端同步
    setDataSource(dataSource.filter(data => data.id !== item.id))
    request.delete(`/users/${item.id}`)
  }

  // 显示确认删除弹窗
  const showConfirm = (item) => {
    confirm({
      title: '你确定要删除吗？',
      icon: <ExclamationCircleFilled />,
      // content: 'Some descriptions',
      onOk() {
        // console.log('OK');
        deleteMethod(item)
      },
      onCancel() {
        // console.log('Cancel');
      },
    });
  };

  // 切换用户状态
  const handleChange = (item)=>{
    // console.log(item)
    const newState = !item.roleState
    setDataSource(prev => prev.map(data => 
      data.id === item.id ? { ...data, roleState: newState } : data
    ))

    request.patch(`/users/${item.id}`,{
      roleState:newState 
    })
  }

  // 点击编辑按钮
  const handleUpdate = (item) => {
    console.log('当前编辑项：', item);
    setCurrent(item);
    setUpdate(true);
    setIsUpdateDisabled(item.roleId === '1');
  }

  const fetchUserList = () => {
    request.get("/users")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        setDataSource(list); // 用最新数据覆盖原有列表
      })
      .catch(err => console.error('重新获取用户列表失败：', err));
  };

  // 新增用户表单提交
  const addFormOK = () => {
    if (!addForm.current) return; // 边界判断
    addForm.current.validateFields().then(value => {
      console.log(value)
      
      setOpen(false)
      addForm.current.resetFields()
      //post到后端，生成id，再设置 datasource, 方便后面的删除和更新
      request.post(`/users`, {
        ...value,
        "roleState": true,
        "default": false,
      }).then(res => { 
        console.log('新增用户成功');
        fetchUserList(); 
      })
      .catch(err => console.error('新增用户失败：', err));
    })
    .catch(err => console.error('表单验证失败：', err));
  }

  const updateFormOK = ()=>{
    if (!updateForm.current || !current) return; 
    updateForm.current.validateFields().then(value => {
      // console.log(value)
      setUpdate(false)
      setIsUpdateDisabled(!isUpdateDisabled)

      request.patch(`/users/${current.id}`,value).then(res => {
        console.log('用户更新成功');
        // 关键：更新成功后重新请求列表，确保数据最新
        fetchUserList(); 
      })
      .catch(err => {
        console.error('用户更新失败：', err);
        // 失败时也可重新请求，避免前端显示错误数据
        fetchUserList();
      });
    })
  }

  const columns = [
    {
      title: '区域',
      dataIndex: 'region',
      filters: [
        ...regionList.map(item => ({
          text: item.title,
          value: item.value
        })),
        {
          text: '全球',
          value: '全球'
        }
      ],
      onFilter:(value,item)=>{
        if(value==='全球'){
          return item.region === ''
        }
        return item.region === value
      },
      render:(region) => {
        return <b>{region===''?'全球':region}</b>
      },
    },
    {
      title: '角色名称',
      dataIndex: 'role',
      render: (role, item) => {
        // 优先使用后端返回的 role 对象，其次用本地 roleList 映射
        const fromBackend = role?.roleName;
        const fromLocal = roleList.find(r => r.value === item.roleId)?.label;
        return fromBackend || fromLocal || '-';
      }
    },
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: '用户状态',
      dataIndex: 'roleState',
      render:(roleState, item)=>{
        return <Switch checked={roleState} disabled={item.default} onChange={()=>handleChange(item)}></Switch>
      }
    },
    {
      title: '操作',
      render:(item) => {
        return <div>
          <Button 
            danger 
            shape="circle" 
            icon={<DeleteOutlined/>} 
            onClick={()=>showConfirm(item)} 
            disabled={item.default}
          />
          <Button 
            type="primary" 
            shape="circle" 
            icon={<EditOutlined/>} 
            disabled={item.default}
            onClick={()=>handleUpdate(item)}
          />
        </div>
      }
    },
  ];


  return (
    <div style={isDarkMode?appStyles.table:{}}>
      <Button type="primary" onClick={() => setOpen(true)}>添加用户</Button>
      <Table 
        className={styles.customTable}
        dataSource={Array.isArray(dataSource) ? dataSource : []} 
        columns={columns} 
        pagination={{ pageSize: 5 }}
        scroll={{ y: 50 * 5 }}
        rowKey={item=>item.id}
      />

      {/* <pre>{JSON.stringify(formValues, null, 2)}</pre> */}
      <Modal
        open={open}
        title="添加用户"
        okText="确定"
        cancelText="取消"
        okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        modalRender={dom => (
          <Form
            layout="vertical"
            form={form}
            ref={addForm}
            name="form_in_modal"
            initialValues={{ modifier: 'public' }}
            clearOnDestroy
            onFinish={addFormOK}
          >
            {dom}
          </Form>
        )}
      >
        <UserForm 
          roleList={roleList}
          regionList={regionList}
        />
      </Modal>

      <Modal
        open={update}
        title="更新用户"
        okText="更新"
        cancelText="取消"
        okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
        onCancel={() => {
          setUpdate(false)
          setIsUpdateDisabled(!isUpdateDisabled)
        }}
        destroyOnHidden
        modalRender={dom => (
          <Form
            layout="vertical"
            form={form}
            ref={updateForm}
            name="form_in_modal"
            initialValues={{ modifier: 'public' }}
            clearOnDestroy
            onFinish={updateFormOK}
          >
            {dom}
          </Form>
        )}
        afterOpenChange={(open) => {
          if (open && current && updateForm.current) {
            console.log('表单实例（弹窗打开后）：', updateForm.current);
            // 此时表单已渲染，可安全设置值
            updateForm.current.setFieldsValue(current);
            // 再次确认禁用状态（冗余保障）
            setIsUpdateDisabled(current.roleId === '1');
          }
        }}
      >
        <UserForm 
          roleList={roleList}
          regionList={regionList}
          isUpdateDisabled={isUpdateDisabled}
          isUpdate={true}
        />
      </Modal>
    </div>
  )
}
