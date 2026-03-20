// src/searchcontext.tsx
import { createContext, useContext, useState } from 'react';

interface SearchState {
  query: string;
  region: string;
  selectedServices: string[];
  selectedTags: string[];
}

interface SearchContextValue extends SearchState {
  setQuery: (v: string) => void;
  setRegion: (v: string) => void;
  setSelectedServices: (v: string[] | ((prev: string[]) => string[])) => void;
  setSelectedTags: (v: string[] | ((prev: string[]) => string[])) => void;
  resetFilters: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resetFilters = () => {
    setQuery('');
    setRegion('');
    setSelectedServices([]);
    setSelectedTags([]);
  };

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        region,
        setRegion,
        selectedServices,
        setSelectedServices,
        selectedTags,
        setSelectedTags,
        resetFilters,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextValue => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
};
