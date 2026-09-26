import NewsPublish from '@/components/sandbox/publish-manage/NewsPublish'
import usePublish from '@/components/sandbox/publish-manage/usePublish'
import { Button } from 'antd'

export default function Published() {
  const {dataSource,handleSunset} = usePublish(2)
  return (
    <div>
      <NewsPublish dataSource={dataSource} button={(id)=><Button danger onClick={()=>handleSunset(id)}>
        下线
      </Button>}></NewsPublish>
    </div>
  )
}
