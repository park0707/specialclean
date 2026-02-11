import React, { createContext,useContext,useState } from "react";
interface SearchContextType {
    text:String,
    setText: React.Dispatch<React.SetStateAction<String>>,
    tags:String[],
    setTags:React.Dispatch<React.SetStateAction<String[]>>
}

const SearchContext = createContext<SearchContextType|undefined>(undefined);

export function SearchProvider({children}:{children:React.ReactNode}){
    const [text, setText] = useState<String>("");
    const [tags, setTags] = useState<String[]>([]);
    return(
        <SearchContext.Provider value={{text,setText,tags,setTags}}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch(){
    const ctx = useContext(SearchContext);
    if(!ctx){
        throw new Error('Search context error');
    }
    return ctx;
}