import React, { createContext,useContext,useState } from "react";

export type SortKey = 'bookmarkCount' | 'reviewCount';
export type SortDir = 'asc' | 'desc';

export interface FilterState {
    regionWide: string;
    regionDetail: string;
    categories: string[];       // tags OR services to match
    timeStart: number | null;   // 0-24
    timeEnd: number | null;     // 0-24
    only24h: boolean;
    priceMin: number | null;
    priceMax: number | null;
    sortKey: SortKey;
    sortDir: SortDir;
}

export const defaultFilter: FilterState = {
    regionWide: '',
    regionDetail: '',
    categories: [],
    timeStart: null,
    timeEnd: null,
    only24h: false,
    priceMin: null,
    priceMax: null,
    sortKey: 'bookmarkCount',
    sortDir: 'desc',
};

interface SearchContextType {
    text:string,
    setText: React.Dispatch<React.SetStateAction<string>>,
    tags:string[],
    setTags:React.Dispatch<React.SetStateAction<string[]>>,
    filter: FilterState,
    setFilter: React.Dispatch<React.SetStateAction<FilterState>>,
}

const SearchContext = createContext<SearchContextType|undefined>(undefined);

export function SearchProvider({children}:{children:React.ReactNode}){
    const [text, setText] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [filter, setFilter] = useState<FilterState>(defaultFilter);
    return(
        <SearchContext.Provider value={{text,setText,tags,setTags,filter,setFilter}}>
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