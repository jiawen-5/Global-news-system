import NewsPublish from '@/components/sandbox/publish-manage/NewsPublish'
import usePublish from '@/components/sandbox/publish-manage/usePublish'
import { Button } from 'antd'

export default function Sunset() {
  const {dataSource,handleDelete} = usePublish(3)
  return (
    <div>
      <NewsPublish dataSource={dataSource} button={(id)=><Button danger onClick={()=>handleDelete(id)}>
        删除
      </Button>}></NewsPublish>
    </div>
  )
}
