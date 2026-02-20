import { useEffect } from "react";
export function useSignUpLogic(id:string,pw:string,pwcon:string,
    setpwok:React.Dispatch<React.SetStateAction<number>>){
    

    useEffect(() => {
        if(!pw.trim())
            setpwok(1); //비밀번호 미입력
        else if(!pwcon.trim())
            setpwok(2); //비밀번호 확인 미입력
        else if(pw !== pwcon)
            setpwok(3); //비밀번호 불일치
        else
            setpwok(0); //문제 없음
    },[pw,pwcon])

}