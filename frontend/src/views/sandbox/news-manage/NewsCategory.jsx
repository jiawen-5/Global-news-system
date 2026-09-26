import { Button, Table,Modal,Form, Input } from "antd";
import request from '@/util/request.js'
import React,{ useState,useEffect,useRef,useContext } from "react";
import { DeleteOutlined,ExclamationCircleFilled } from '@ant-design/icons'
import { createStyles } from 'antd-style';
import { checkLogin } from '@/util/checkLogin';
import { showLoginModal } from '@/components/common/LoginModal';
import { useNavigate } from 'react-router-dom';
const { confirm } = Modal;
const EditableContext = React.createContext(null);
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

export default function NewsCategory() {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const [dataSource,setDataSource] = useState([])
  const isLogin = checkLogin()

  useEffect(()=>{
    request.get('/categories').then(res=>{
      // 后端可能返回数组或 { total, list } 格式
      const data = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      setDataSource(data)
    }).catch(err => {
      console.error('获取分类列表失败:', err)
      setDataSource([])
    })
  },[])

  const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};
const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    // 检查是否登录
    if (!checkLogin()) {
      showLoginModal(navigate, window.location.pathname);
      return;
    }
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const deleteMethod = (item) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, window.location.pathname);
      return;
    }
    
    setDataSource(dataSource.filter(data => data.id !== item.id))
    request.delete(`/categories/${item.id}`)
  }

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

  const handleSave = (record) => {
    // 检查是否登录
    if (!isLogin) {
      showLoginModal(navigate, window.location.pathname);
      return;
    }
    
    console.log(record);
    setDataSource(dataSource.map(item=>{
      if(item.id === record.id){
        return {
          id:item.id,
          title:record.title,
          value:record.title
        }
      }
      return item
    }))
    request.patch(`/categories/${record.id}`,{
      title: record.title,
      value: record.title
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      render:(id) => {
        return <b>{id}</b>
      },
    },
    {
      title: '栏目名称',
      dataIndex: 'title',
      onCell: record => ({
        record,
        editable: true,
        dataIndex: 'title',
        title: '栏目名称',
        handleSave: handleSave,
      }),
    },
    {
      title: '操作',
      render:(item) => {
        return <div>
          <Button danger shape="circle" icon={<DeleteOutlined/>} onClick={()=>showConfirm(item)}/>
        </div>
      }
    },
  ];

  return (
    <Table 
      components={components}
      className={styles.customTable}
      dataSource={dataSource} 
      columns={columns} 
      pagination={{ pageSize: 5 }}
      scroll={{ y: 50 * 6 }}
      rowKey={(item)=>item.id}
    />
  )
}
