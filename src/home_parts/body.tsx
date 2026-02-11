import SearchBox from "./searchbox"
import MenuTabs from "./tags"
export default function Body(){
    return(
        <div className="w-full h-full items-center justify-center flex pt-4 flex-col gap-20">
            <SearchBox/>
            <MenuTabs/>
        </div>
    )
}