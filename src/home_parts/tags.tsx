
import { useState } from "react"
import LocationFilter from "./filter/LocationFilter"
import PriceFilter from "./filter/PriceFilter"
import CategoryFilter from "./filter/CategoryFilter"
import TimeFilter from "./filter/TimeFilter"

type TabKey = '지역' | '가격' | '분류' | '작업 시간';

const FILTER_COMPONENTS: Record<TabKey, React.FC> = {
  '지역': LocationFilter,
  '가격': PriceFilter,
  '분류': CategoryFilter,
  '작업 시간': TimeFilter,
};

export default function MenuTabs() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('지역');
  const FilterComponent = FILTER_COMPONENTS[selectedTab];

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
      <div className="w-full h-full p-6 flex justify-center">
        <FilterComponent />
      </div>
    </div>
  )
}
