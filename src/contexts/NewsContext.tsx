import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { fetchNewsProgressively, fetchPriorityNews } from '../services/newsService';
import { Article } from '../types';

interface NewsContextType {
  articles: Article[];
  filteredArticles: Article[];
  priorityArticles: Article[]; // New: Quick-loading priority articles
  isLoading: boolean;
  isError: boolean;
  refreshNews: () => Promise<void>;
  searchArticles: (keyword: string) => void;
  savedArticles: Article[];
  saveArticle: (article: Article) => void;
  removeFromSaved: (articleId: string) => void;
  currentKeyword: string;
  isProgressiveLoading: boolean;
  loadingProgress: number; // New: Loading progress percentage
  quickRefresh: () => Promise<void>; // New: Fast refresh for priority sources
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
  const [priorityArticles, setPriorityArticles] = useState<Article[]>([]);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const queryClient = useQueryClient();
  
  // Optimized saved articles with useMemo
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('savedArticles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Priority articles query for instant loading
  const { data: priorityData } = useQuery(
    'priority-news',
    fetchPriorityNews,
    {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setPriorityArticles(data);
        // Show priority articles immediately if no main articles
        if (articles.length === 0) {
          setArticles(data);
          setFilteredArticles(data);
        }
      }
    }
  );

  // Main articles query with progressive loading
  const { data, isLoading, isError, refetch } = useQuery(
    'news',
    () => {
      setIsProgressiveLoading(true);
      setLoadingProgress(0);
      
      return fetchNewsProgressively((progressArticles, isComplete) => {
        console.log(`Progressive update: ${progressArticles.length} articles, complete: ${isComplete}`);
        
        // Calculate progress
        const progress = isComplete ? 100 : Math.min(95, (progressArticles.length / 100) * 100);
        setLoadingProgress(progress);
        
        // Update articles
        setArticles(progressArticles);
        if (!currentKeyword) {
          setFilteredArticles(progressArticles);
        } else {
          // Re-apply search filter
          searchArticles(currentKeyword);
        }
        
        // Update loading state
        if (isComplete) {
          setIsProgressiveLoading(false);
          setLoadingProgress(100);
        }
      });
    },
    {
      staleTime: 90 * 1000, // 1.5 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      onSuccess: (data) => {
        setArticles(data);
        if (!currentKeyword) {
          setFilteredArticles(data);
        }
        setIsProgressiveLoading(false);
        setLoadingProgress(100);
      },
      onError: () => {
        setIsProgressiveLoading(false);
        setLoadingProgress(0);
      }
    }
  );

  // Optimized localStorage save with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
      } catch (error) {
        console.warn('Failed to save articles to localStorage');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [savedArticles]);

  // Quick refresh for priority sources only
  const quickRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries('priority-news');
      const freshPriority = await queryClient.fetchQuery('priority-news', fetchPriorityNews);
      setPriorityArticles(freshPriority);
    } catch (error) {
      console.error('Quick refresh failed:', error);
    }
  }, [queryClient]);

  // Full refresh
  const refreshNews = useCallback(async () => {
    setIsProgressiveLoading(true);
    setLoadingProgress(0);
    
    try {
      // Invalidate all caches
      queryClient.invalidateQueries('news');
      queryClient.invalidateQueries('priority-news');
      
      await refetch();
      
      if (currentKeyword) {
        searchArticles(currentKeyword);
      }
    } finally {
      setIsProgressiveLoading(false);
    }
  }, [refetch, currentKeyword, queryClient]);

  // Optimized search with debouncing and memoization
  const searchArticles = useCallback((keyword: string) => {
    setCurrentKeyword(keyword);
    
    if (!keyword.trim()) {
      setFilteredArticles(articles);
      return;
    }
    
    const lowerKeyword = keyword.toLowerCase();
    const filtered = articles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(lowerKeyword);
      const contentMatch = article.content && article.content.toLowerCase().includes(lowerKeyword);
      const sourceMatch = article.source.toLowerCase().includes(lowerKeyword);
      
      return titleMatch || contentMatch || sourceMatch;
    });
    
    setFilteredArticles(filtered);
  }, [articles]);

  // Optimized save article
  const saveArticle = useCallback((article: Article) => {
    setSavedArticles(prev => {
      if (prev.some(a => a.id === article.id)) {
        return prev;
      }
      return [article, ...prev]; // Add to beginning for recency
    });
  }, []);

  // Optimized remove from saved
  const removeFromSaved = useCallback((articleId: string) => {
    setSavedArticles(prev => prev.filter(a => a.id !== articleId));
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    articles,
    filteredArticles,
    priorityArticles,
    isLoading,
    isError,
    refreshNews,
    searchArticles,
    savedArticles,
    saveArticle,
    removeFromSaved,
    currentKeyword,
    isProgressiveLoading,
    loadingProgress,
    quickRefresh
  }), [
    articles,
    filteredArticles,
    priorityArticles,
    isLoading,
    isError,
    refreshNews,
    searchArticles,
    savedArticles,
    saveArticle,
    removeFromSaved,
    currentKeyword,
    isProgressiveLoading,
    loadingProgress,
    quickRefresh
  ]);

  return (
    <NewsContext.Provider value={contextValue}>
      {children}
    </NewsContext.Provider>
  );
};