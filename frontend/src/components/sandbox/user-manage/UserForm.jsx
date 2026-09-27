import { Form, Input, Select} from "antd";
import { useState,useContext,useEffect  } from "react";
import { FormContext } from "antd/es/form/context";
import { getUser } from '@/util/checkLogin';

const UserForm = (props) => {
  const {roleId,region} = getUser() || {}
  
  const [isDisabled,setIsDisabled] = useState(false)
  // 在组件内部先获取正确的表单实例
  const { form: formInstance } = useContext(FormContext) || {}; // 关键：解构出form实例


  // 接收父组件传递的禁用状态（编辑超级管理员时用）
  useEffect(() => {
    setIsDisabled(!!props.isUpdateDisabled); // 强制转为布尔值，避免undefined
  }, [props.isUpdateDisabled]);

  // 区域管理员新增用户时，区域默认填自己所在区域（避免为空提交失败）
  useEffect(() => {
    if (!props.isUpdate && String(roleId) !== '1' && region && formInstance) {
      formInstance.setFieldsValue({ region });
    }
  }, [props.isUpdate, roleId, region, formInstance]);


  // 角色选择联动：选择超级管理员时禁用区域（兼容类型和上下文问题）
  const handleRoleChange = (value) => {
    const roleId = Number(value); // 统一类型
    
    if (roleId === 1) {
      setIsDisabled(true);
      // 关键：用解构出的formInstance调用setFieldsValue
      if (formInstance && typeof formInstance.setFieldsValue === 'function') {
        formInstance.setFieldsValue({ region: '' }); // 清空区域值
      }
    } else {
      setIsDisabled(false);
    }
  };

  const checkRegionDisabled = (item) => {
    if(props.isUpdate){
      if(String(roleId) === '1'){
        console.log('item.value:', item.value, 'region:', region)
        console.log(item.value !== region);
        return false
      }else{

        return item.value !== region
      }
    }else{
      if(String(roleId) === '1'){
        return false
      }else{
        // 区域管理员新增用户：只允许选择自己所在区域，其他区域禁用
        // （之前这里直接 return true，把所有选项都禁掉了，导致区域为空无法提交）
        return item.value !== region
      }
    }    
  }

  const getRegionOptions = () => {
    return props.regionList.map(item => {
      return {
        ...item,
        disabled: checkRegionDisabled(item)
      }
    })
  }

  const checkRoleDisabled = (item) => {
    if(props.isUpdate){
      if(String(roleId) === '1'){
        return false
      }else{
        return true
      }
    }else{
      if(String(roleId) === '1'){
        return false
      }else{
        return String(item.value) !== '3'
      }
    }
  }

  const getRoleOptions = () => {
    return props.roleList.map(item => {
      return {
        ...item,
        disabled: checkRoleDisabled(item)
      }
    })
  }

  return (
    <div>
      <Form.Item
        name="username"
        label="用户名"
        rules={[{ required: true, message: 'Please input the title of collection!' }]}
      >
        <Input />
      </Form.Item>
      {/* 更新用户时不展示密码项，只有新增用户时展示 */}
      {!props.isUpdate && (
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: 'Please input the title of collection!' }]}
        >
          <Input type="password" />
        </Form.Item>
      )}
      <Form.Item 
        name="region" 
        label="区域"
        rules={isDisabled?[]:[{ required: true, message: 'Please input the title of collection!' }]}
      >
        <Select
          options={getRegionOptions()}
          disabled={isDisabled}
        />
      </Form.Item>
      <Form.Item 
        name="roleId" 
        label="角色"
        rules={[{ required: true, message: 'Please input the title of collection!' }]}
      >
        <Select
          onChange={handleRoleChange}
          options={getRoleOptions()}
        />
      </Form.Item>
    </div>
  )
}

export default UserForm

