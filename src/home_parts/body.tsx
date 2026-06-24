import SearchBox from "./searchbox"
import MenuTabs from "./tags"
import BusinessList from "./BusinessList"
export default function Body(){
    return(
        <div className="w-full h-full items-center justify-center flex flex-col px-4 sm:px-0">
            <div className="text-[14px] sm:text-[18px] md:text-2xl lg:text-3xl font-medium text-slate-900 text-center whitespace-nowrap">
                쉽고 빠른 특수 청소 업체 매칭 서비스
            </div>
            <div className="w-full h-full items-center justify-center flex pt-4 flex-col gap-6">
                
                <SearchBox/>
                <MenuTabs/>
                <BusinessList/>
            </div>
        </div>
    )
}