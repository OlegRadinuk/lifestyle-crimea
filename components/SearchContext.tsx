'use client';

import { createContext, useContext, useState } from 'react';

export type SearchParams = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

type SearchContextType = {
  search: SearchParams | null;
  setSearch: (params: SearchParams) => void;
  clearSearch: () => void;
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [search, setSearchState] = useState<SearchParams | null>(null);

  const setSearch = (params: SearchParams) => {
    setSearchState(params);
  };

  const clearSearch = () => {
    setSearchState(null);
  };

  return (
    <SearchContext.Provider
      value={{
        search,
        setSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used inside SearchProvider');
  }
  return ctx;
}
