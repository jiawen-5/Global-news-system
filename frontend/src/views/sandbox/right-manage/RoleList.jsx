import { Button, Table, Modal, Tree } from "antd";
import request from '@/util/request.js'
import { useState, useEffect } from "react";
import { UnorderedListOutlined } from '@ant-design/icons'
import { createStyles } from 'antd-style';

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

export default function RoleList() {
  const { styles } = useStyle();
  const [dataSource, setDataSource] = useState([])
  const [permList, setPermList] = useState([])
  const [currentKeys, setCurrentKeys] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);

  const handleOk = () => {
    setIsModalOpen(false);
    request.put(`/roles/${currentId}/permissions`, { permission_ids: currentKeys })
      .catch(err => console.error('分配权限失败:', err))
  };
  const handleCancel = () => setIsModalOpen(false);

  const onCheck = (checkedKeys) => {
    setCurrentKeys(Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked)
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      render: (id) => <b>{id}</b>,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
    },
    {
      title: '操作',
      render: (item) => (
        <div>
          <Button
            type="primary" shape="circle" icon={<UnorderedListOutlined />}
            onClick={async () => {
              showModal()
              setCurrentId(item.id)
              try {
                const res = await request.get(`/roles/${item.id}/permissions`)
                const keys = Array.isArray(res.data) ? res.data : []
                // 后端返回 key 数组，转成 permission id
                const ids = permList.filter(p => keys.includes(p.key)).map(p => p.id)
                setCurrentKeys(ids.length ? ids : keys)
              } catch {
                setCurrentKeys([])
              }
            }}
          />
        </div>
      ),
    },
  ]

  useEffect(() => {
    request.get('/roles').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      setDataSource(list)
    }).catch(() => setDataSource([]))
  }, [])

  useEffect(() => {
    request.get('/permissions').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      setPermList(list)
    }).catch(() => setPermList([]))
  }, [])

  const treeData = permList
    .filter(p => String(p.parent_id) === '0')
    .map(p => ({
      title: p.title,
      key: p.id,
      children: permList.filter(c => String(c.parent_id) === String(p.id))
        .map(c => ({ title: c.title, key: c.id })),
    }));

  return (
    <div>
      <Table
        className={styles.customTable}
        dataSource={dataSource}
        columns={columns}
        rowKey={(item) => item.id}
      />
      <Modal
        title="权限分配"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Tree
          checkable
          checkedKeys={currentKeys}
          treeData={treeData}
          onCheck={onCheck}
          checkStrictly={true}
        />
      </Modal>
    </div>
  )
}
