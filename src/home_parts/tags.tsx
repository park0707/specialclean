
import { useState } from "react"

export default function MenuTabs() {
  const [selectedTab, setSelectedTab] = useState<'지역'|'가격'|'분류'|'작업 시간'>('지역');
  return (
    <div className="w-full flex justify-center z-30 flex-col items-center">
      <div className="flex justify-center items-center gap-4">
        <div className={`${selectedTab === '지역' ? 'tag_on' : 'tag_out'}`} onClick={() => setSelectedTab('지역')}>
          지역
        </div>
        <div className={`${selectedTab === '가격' ? 'tag_on' : 'tag_out'}`} onClick={() => setSelectedTab('가격')}>
          가격
        </div>
        <div className={`${selectedTab === '분류' ? 'tag_on' : 'tag_out'}`} onClick={() => setSelectedTab('분류')}>
          분류
        </div>
        <div className={`${selectedTab === '작업 시간' ? 'tag_on' : 'tag_out'}`} onClick={() => setSelectedTab('작업 시간')}>
          작업 시간
        </div>
      </div>
      <div className="w-full h-full p-6">
        내용 들어가는 영역
      </div>
      
    </div>
  )
}
