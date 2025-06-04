import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SearchHistoryContextType {
  searchHistory: string[];
  addToHistory: (keyword: string) => void;
  clearHistory: () => void;
  removeFromHistory: (keyword: string) => void;
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error('useSearchHistory must be used within a SearchHistoryProvider');
  }
  return context;
};

interface SearchHistoryProviderProps {
  children: ReactNode;
}

export const SearchHistoryProvider = ({ children }: SearchHistoryProviderProps) => {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToHistory = (keyword: string) => {
    if (!keyword.trim()) return;
    
    setSearchHistory(prev => {
      // Remove the keyword if it already exists (to move it to the top)
      const filtered = prev.filter(k => k !== keyword);
      // Add to the beginning of the array (most recent first)
      return [keyword, ...filtered].slice(0, 10); // Keep only 10 most recent
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const removeFromHistory = (keyword: string) => {
    setSearchHistory(prev => prev.filter(k => k !== keyword));
  };

  return (
    <SearchHistoryContext.Provider value={{
      searchHistory,
      addToHistory,
      clearHistory,
      removeFromHistory
    }}>
      {children}
    </SearchHistoryContext.Provider>
  );
};