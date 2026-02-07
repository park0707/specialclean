import { Mymenu } from "./mymenu"
export default function Header(){
    return(
        <div className="flex justify-between px-90 py-2">
            <div className="flex items-center gap-[2px] ">
                <img src="/images/로고.png" alt="로고" className="w-[60px] h-auto"/>
                <div className="logo_text text-[30px] text-[#1d4ed8]">클린 매칭</div>  
            </div>
            <Mymenu/>
        </div>
    )
}