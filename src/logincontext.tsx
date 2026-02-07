import { createContext,useContext, type ReactNode } from "react";
import { useState } from "react";
interface logintype {
    id:String,
    setid:React.Dispatch<React.SetStateAction<String>>
}
const logincontext = createContext<logintype|undefined>(undefined)
export function AuthProvider({children}:{children:ReactNode}){
    const [id,setid] = useState<String>("")
    return(
        <logincontext.Provider value={{id,setid}}>
            {children}
        </logincontext.Provider>
    )
}
export function useAuth(){
    const ctx = useContext(logincontext)
    if(!ctx){
        throw new Error('auth error')
    }
    return ctx
}