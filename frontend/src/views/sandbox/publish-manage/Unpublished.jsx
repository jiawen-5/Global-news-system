import NewsPublish from '@/components/sandbox/publish-manage/NewsPublish'
import usePublish from '@/components/sandbox/publish-manage/usePublish'
import { Button } from 'antd'

export default function Unpublished() {
  const {dataSource,handlePublish} = usePublish(1)
  return (
    <div>
      <NewsPublish dataSource={dataSource} button={(id)=><Button type='primary' onClick={()=>handlePublish(id)}>
        发布
      </Button>}></NewsPublish>
    </div>
  )
}
