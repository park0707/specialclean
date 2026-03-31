// src/searchcontext.tsx
import { createContext, useContext, useState } from 'react';
import type { GeoResult } from './lib/geocode';

interface SearchState {
  query: string;
  locationQuery: string;            // 유저가 입력한 원문 텍스트
  locationResult: GeoResult | null; // 카카오 API 확정 결과
  selectedServices: string[];
  selectedTags: string[];
}

interface SearchContextValue extends SearchState {
  setQuery: (v: string) => void;
  setLocationQuery: (v: string) => void;
  setLocationResult: (v: GeoResult | null) => void;
  setSelectedServices: (v: string[] | ((prev: string[]) => string[])) => void;
  setSelectedTags: (v: string[] | ((prev: string[]) => string[])) => void;
  resetFilters: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResult, setLocationResult] = useState<GeoResult | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resetFilters = () => {
    setQuery('');
    setLocationQuery('');
    setLocationResult(null);
    setSelectedServices([]);
    setSelectedTags([]);
  };

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        locationQuery,
        setLocationQuery,
        locationResult,
        setLocationResult,
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
