import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from 'react-query';
import { fetchNewsFromAllSources } from '../services/newsService';
import { Article } from '../types';

interface NewsContextType {
  articles: Article[];
  filteredArticles: Article[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refreshNews: () => Promise<void>;
  searchArticles: (keyword: string) => void;
  savedArticles: Article[];
  saveArticle: (article: Article) => void;
  removeFromSaved: (articleId: string) => void;
  currentKeyword: string;
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
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('savedArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved articles:', error);
      return [];
    }
  });
  const [currentKeyword, setCurrentKeyword] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery(
    'news', 
    fetchNewsFromAllSources, 
    {
      onSuccess: (data) => {
        console.log('Query success, received articles:', data?.length || 0);
        setArticles(data || []);
        setFilteredArticles(data || []);
      },
      onError: (error) => {
        console.error('Query error:', error);
      },
      retry: 2, // Retry failed requests
      retryDelay: 1000, // Wait 1 second between retries
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
    } catch (error) {
      console.error('Error saving articles to localStorage:', error);
    }
  }, [savedArticles]);

  // Debug logging
  useEffect(() => {
    console.log('NewsProvider state:', {
      articlesCount: articles.length,
      filteredCount: filteredArticles.length,
      isLoading,
      isError,
      hasError: !!error,
      currentKeyword
    });
  }, [articles.length, filteredArticles.length, isLoading, isError, error, currentKeyword]);

  const refreshNews = async () => {
    console.log('Refreshing news...');
    try {
      await refetch();
      if (currentKeyword) {
        searchArticles(currentKeyword);
      }
    } catch (error) {
      console.error('Error refreshing news:', error);
    }
  };

  const searchArticles = (keyword: string) => {
    console.log('Searching articles with keyword:', keyword);
    setCurrentKeyword(keyword);
    
    if (!keyword.trim()) {
      setFilteredArticles(articles);
      return;
    }

    try {
      const lowerKeyword = keyword.toLowerCase();
      const filtered = articles.filter(
        article => 
          article.title?.toLowerCase().includes(lowerKeyword) || 
          (article.content && article.content.toLowerCase().includes(lowerKeyword))
      );
      console.log(`Found ${filtered.length} articles matching "${keyword}"`);
      setFilteredArticles(filtered);
    } catch (error) {
      console.error('Error filtering articles:', error);
      setFilteredArticles(articles);
    }
  };

  const saveArticle = (article: Article) => {
    if (!article?.id) {
      console.warn('Cannot save article without ID');
      return;
    }
    
    setSavedArticles(prev => {
      if (prev.some(a => a.id === article.id)) {
        return prev;
      }
      return [...prev, article];
    });
  };

  const removeFromSaved = (articleId: string) => {
    if (!articleId) {
      console.warn('Cannot remove article without ID');
      return;
    }
    
    setSavedArticles(prev => prev.filter(a => a.id !== articleId));
  };

  return (
    <NewsContext.Provider value={{
      articles,
      filteredArticles,
      isLoading,
      isError,
      error: error as Error | null,
      refreshNews,
      searchArticles,
      savedArticles,
      saveArticle,
      removeFromSaved,
      currentKeyword
    }}>
      {children}
    </NewsContext.Provider>
  );
};