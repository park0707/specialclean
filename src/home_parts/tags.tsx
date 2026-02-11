//선택된 상단 탭에 따라 모양 달라져야 하고, 탭 클릭 시 내용도 바뀌어야 함
//선택되지 않은 탭은 밑에 테두리 있어야 하고
import { useState } from "react"

export default function MenuTabs() {
  const [selectedTab, setSelectedTab] = useState<'지역'|'가격'|'분류'|'작업 시간'>('지역');
  return (
    <div className="w-full flex justify-center">
      <div className="relative w-[700px] h-[400px] bg-gray-200 border border-gray-400 rounded-b-lg rounded-tr-lg">
        {/* 큰 왼쪽 탭 */}
        <div className="absolute -top-10 -ml-[0.1px] flex">
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

        {/* 콘텐츠 영역 */}
        <div className="w-full h-full p-6">
          내용 들어가는 영역
        </div>
      </div>
    </div>
  )
}
