import { Table, Tag } from "antd";
import request from '@/util/request.js'
import { useState, useEffect } from "react";
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

export default function RightList() {
  const { styles } = useStyle();
  const [dataSource, setDataSource] = useState([])

  useEffect(() => {
    request.get('/permissions')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
        setDataSource(list)
      })
      .catch((error) => {
        console.error('获取权限列表失败:', error)
        setDataSource([])
      })
  }, [])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      render: (id) => <b>{id}</b>,
    },
    {
      title: '权限名称',
      dataIndex: 'title',
    },
    {
      title: '权限路径',
      dataIndex: 'key',
      render: (key) => <Tag color="orange">{key}</Tag>,
    },
    {
      title: '层级',
      dataIndex: 'grade',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (t) => t === 1 ? '菜单' : '按钮',
    },
    {
      title: '是否展示',
      dataIndex: 'is_show',
      render: (v) => v === 1 ? '展示' : '隐藏',
    },
  ];

  return (
    <Table
      className={styles.customTable}
      dataSource={dataSource}
      columns={columns}
      pagination={{ pageSize: 10 }}
      scroll={{ y: 50 * 6 }}
      rowKey={(item) => item.id}
    />
  );
}
