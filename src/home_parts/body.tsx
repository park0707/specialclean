import SearchBox from "./searchbox"
import MenuTabs from "./tags"
export default function Body(){
    return(
        <div className="w-full h-full items-center justify-center flex flex-col">
            <div className="text-3xl font-medium text-slate-900">
                쉽고 빠른 특수 청소 업체 매칭 서비스
            </div>
            <div className="w-full h-full items-center justify-center flex pt-4 flex-col gap-6">
                
                <SearchBox/>
                <MenuTabs/>
            </div>
        </div>
    )
}