import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from 'react-query';
import { fetchNewsProgressively } from '../services/newsService'; // Updated import
import { Article } from '../types';

interface NewsContextType {
  articles: Article[];
  filteredArticles: Article[];
  isLoading: boolean;
  isError: boolean;
  refreshNews: () => Promise<void>;
  searchArticles: (keyword: string) => void;
  savedArticles: Article[];
  saveArticle: (article: Article) => void;
  removeFromSaved: (articleId: string) => void;
  currentKeyword: string;
  isProgressiveLoading: boolean; // New state for progressive loading
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

interface NewsProviderProps {
  children: ReactNode;
}

export const NewsProvider = ({ children }: NewsProviderProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('savedArticles');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentKeyword, setCurrentKeyword] = useState('');

  // Updated useQuery with progressive loading
  const { data, isLoading, isError, refetch } = useQuery(
    'news', 
    () => {
      setIsProgressiveLoading(true);
      return fetchNewsProgressively((progressArticles, isComplete) => {
        console.log(`Progressive update: ${progressArticles.length} articles, complete: ${isComplete}`);
        
        // Update articles as they come in
        setArticles(progressArticles);
        setFilteredArticles(progressArticles);
        
        // Update progressive loading state
        if (isComplete) {
          setIsProgressiveLoading(false);
        }
      });
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
      cacheTime: 5 * 60 * 1000, // 5 minutes - cache duration
      refetchOnWindowFocus: false, // Don't refetch when window gets focus
      onSuccess: (data) => {
        setArticles(data);
        setFilteredArticles(data);
        setIsProgressiveLoading(false);
      },
      onError: () => {
        setIsProgressiveLoading(false);
      }
    }
  );

  useEffect(() => {
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  const refreshNews = async () => {
    setIsProgressiveLoading(true);
    try {
      await refetch();
      if (currentKeyword) {
        searchArticles(currentKeyword);
      }
    } finally {
      setIsProgressiveLoading(false);
    }
  };

  const searchArticles = (keyword: string) => {
    setCurrentKeyword(keyword);
    if (!keyword.trim()) {
      setFilteredArticles(articles);
      return;
    }
    const lowerKeyword = keyword.toLowerCase();
    const filtered = articles.filter(
      article => 
        article.title.toLowerCase().includes(lowerKeyword) || 
        (article.content && article.content.toLowerCase().includes(lowerKeyword))
    );
    setFilteredArticles(filtered);
  };

  const saveArticle = (article: Article) => {
    setSavedArticles(prev => {
      if (prev.some(a => a.id === article.id)) {
        return prev;
      }
      return [...prev, article];
    });
  };

  const removeFromSaved = (articleId: string) => {
    setSavedArticles(prev => prev.filter(a => a.id !== articleId));
  };

  return (
    <NewsContext.Provider value={{
      articles,
      filteredArticles,
      isLoading,
      isError,
      refreshNews,
      searchArticles,
      savedArticles,
      saveArticle,
      removeFromSaved,
      currentKeyword,
      isProgressiveLoading // New value available to components
    }}>
      {children}
    </NewsContext.Provider>
  );
};