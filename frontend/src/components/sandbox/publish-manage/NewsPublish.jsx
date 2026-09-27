import { Table } from "antd";
import { createStyles } from 'antd-style';
import { Link } from 'react-router-dom';
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

export default function NewsPublish(props) {
  const { styles } = useStyle();

  const columns = [
    {
      title: '新闻标题',
      dataIndex: 'title',
      render:(title,item) => {
        return <Link to={`/news-manage/preview/${item.id}`}>{title}</Link>
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
    },
    {
      title: '新闻分类',
      dataIndex: 'categoryId',
      render:(value) => {
        const categoryList = ['','时事新闻','环球经济','科学科技','军事世界','世界体育','生活理财']
        return <div>{categoryList[value] || '-'}</div>
      }
    },
    {
      title: '操作',
      render:(item) => {
        return <div>
          {props.button(item.id)}
        </div>
      }
    },
  ];

  return (
    <Table 
      className={styles.customTable}
      dataSource={props.dataSource} 
      columns={columns} 
      pagination={{ pageSize: 5 }}
      scroll={{ y: 50 * 6 }}
      rowKey={item=>item.id}
    />
  )
}
