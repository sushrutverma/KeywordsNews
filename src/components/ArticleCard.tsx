import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Bookmark, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  X, 
  Clock,
  Eye,
  AlertCircle,
  Download,
  RefreshCw,
  Heart,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { Article } from '../types';
import { useNews } from '../contexts/NewsContext';
import { aiService } from '../services/aiService';

interface ArticleCardProps {
  article: Article;
  keyword?: string;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onView?: (articleId: string) => void;
  onShare?: (article: Article) => void;
  className?: string;
}

interface SummaryState {
  content: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  keyword, 
  variant = 'default',
  showActions = true,
  onView,
  onShare,
  className = '' 
}) => {
  const { savedArticles, saveArticle, removeFromSaved } = useNews();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryState, setSummaryState] = useState<SummaryState>({
    content: '',
    isLoading: false,
    error: null,
    lastUpdated: null
  });
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [readTime, setReadTime] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const summaryCache = useRef<Map<string, SummaryState>>(new Map());

  // Memoized values
  const isBookmarked = useMemo(() => 
    savedArticles?.some((a) => a.id === article.id) || false,
    [savedArticles, article.id]
  );

  const formattedDate = useMemo(() => {
    if (!article.pubDate) return 'Unknown date';
    try {
      const date = typeof article.pubDate === 'string' ? parseISO(article.pubDate) : article.pubDate;
      return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Unknown date';
    } catch {
      return 'Unknown date';
    }
  }, [article.pubDate]);

  const formattedContent = useMemo(() => {
    if (!article.content) return '';
    try {
      // More robust HTML stripping
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      return text.trim();
    } catch {
      return article.content.replace(/<[^>]*>/g, '').trim();
    }
  }, [article.content]);

  // Calculate reading time
  useEffect(() => {
    if (formattedContent) {
      const wordsPerMinute = 200;
      const wordCount = formattedContent.split(/\s+/).length;
      setReadTime(Math.max(1, Math.ceil(wordCount / wordsPerMinute)));
    }
  }, [formattedContent]);

  // Intersection Observer for visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onView?.(article.id);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [article.id, isVisible, onView]);

  // Modal management
  useEffect(() => {
    if (showSummary) {
      document.body.style.overflow = 'hidden';
      // Focus management for accessibility
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showSummary]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary && e.key === 'Escape') {
        setShowSummary(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSummary]);

  // Validation
  if (!article || !article.id) {
    return (
      <div className="article-card glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <AlertCircle size={20} className="mr-2" />
          <span>Invalid article data</span>
        </div>
      </div>
    );
  }

  const highlightKeyword = useCallback((text: string, searchKeyword?: string) => {
    if (!searchKeyword || !text) return text;
    try {
      const escapedKeyword = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark 
              key={index} 
              className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch {
      return text;
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (onShare) {
        onShare(article);
        return;
      }

      const shareData = {
        title: article.title || 'News Article',
        text: `${article.title || 'Check out this article'}\n\n${formattedContent.substring(0, 100)}...`,
        url: article.link || window.location.href,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(article.link || window.location.href);
        // You might want to show a toast notification here
        console.log('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(article.link || window.location.href);
        console.log('Link copied to clipboard as fallback!');
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
      }
    }
  }, [article, formattedContent, onShare]);

  const handleBookmarkToggle = useCallback(() => {
    if (!article?.id) return;
    
    try {
      if (isBookmarked) {
        removeFromSaved(article.id);
      } else {
        saveArticle(article);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }, [article, isBookmarked, removeFromSaved, saveArticle]);

  const handleSummarize = useCallback(async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    // Check cache first
    const cachedSummary = summaryCache.current.get(article.id);
    if (cachedSummary && cachedSummary.lastUpdated) {
      const isRecent = Date.now() - cachedSummary.lastUpdated.getTime() < 5 * 60 * 1000; // 5 minutes
      if (isRecent) {
        setSummaryState(cachedSummary);
        setShowSummary(true);
        return;
      }
    }

    if (!formattedContent) {
      const errorState = {
        content: '',
        isLoading: false,
        error: 'No content available to summarize.',
        lastUpdated: new Date()
      };
      setSummaryState(errorState);
      setShowSummary(true);
      return;
    }

    setSummaryState(prev => ({ ...prev, isLoading: true, error: null }));
    setShowSummary(true);

    try {
      const result = await aiService.summarize(formattedContent);
      const newState = {
        content: result?.summary || 'No summary available.',
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      };
      
      setSummaryState(newState);
      summaryCache.current.set(article.id, newState);
    } catch (error) {
      const errorState = {
        content: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary.',
        lastUpdated: new Date()
      };
      setSummaryState(errorState);
    }
  }, [article.id, formattedContent, showSummary]);

  const handleModalBackdropClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      setShowSummary(false);
    }
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const getCardClasses = () => {
    const base = "article-card glass-card rounded-xl overflow-hidden mb-6 relative transition-all duration-300 hover:shadow-lg";
    const variants = {
      default: "",
      compact: "mb-4",
      featured: "mb-8 border-2 border-accent/20 dark:border-accent-dark/20"
    };
    return `${base} ${variants[variant]} ${className}`;
  };

  const shouldShowImage = article.image && !imageError;
  const imageHeight = variant === 'compact' ? 'h-32' : variant === 'featured' ? 'h-64' : 'h-48';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={getCardClasses()}
      style={{ touchAction: 'pan-y' }}
      role="article"
      aria-label={`Article: ${article.title}`}
    >
      {shouldShowImage && (
        <div className={`w-full ${imageHeight} overflow-hidden relative group`}>
          <img
            src={article.image}
            alt={article.title || 'Article image'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={handleImageError}
          />
          {variant === 'featured' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/90 text-white">
                <TrendingUp size={12} className="mr-1" />
                Featured
              </span>
            </div>
          )}
        </div>
      )}

      <div className={variant === 'compact' ? 'p-4' : 'p-6'}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark">
              {article.source || 'Unknown'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock size={12} className="mr-1" />
              {formattedDate}
            </span>
          </div>
          {readTime > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Eye size={12} className="mr-1" />
              {readTime} min read
            </span>
          )}
        </div>

        <Link to={`/article/${article.id}`} className="block group">
          <h2 className={`font-playfair font-bold mb-3 text-primary dark:text-primary-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors ${
            variant === 'compact' ? 'text-lg' : variant === 'featured' ? 'text-2xl' : 'text-xl'
          }`}>
            {highlightKeyword(article.title || 'Untitled', keyword)}
          </h2>
        </Link>

        {formattedContent && variant !== 'compact' && (
          <p className="font-source-serif text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {highlightKeyword(formattedContent, keyword)}
          </p>
        )}

        {showActions && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/article/${article.id}`}
                className="fab whitespace-nowrap px-4 py-2 rounded-full text-white text-sm font-medium flex items-center hover:opacity-90 transition-opacity"
              >
                Read more <ExternalLink size={14} className="ml-2" />
              </Link>

              <button
                onClick={handleSummarize}
                disabled={summaryState.isLoading}
                className="whitespace-nowrap px-4 py-2 rounded-full bg-accent/10 text-accent dark:bg-accent-dark/10 dark:text-accent-dark text-sm font-medium flex items-center disabled:opacity-50 hover:bg-accent/20 dark:hover:bg-accent-dark/20 transition-colors"
                aria-label="Generate AI summary"
              >
                {summaryState.isLoading ? (
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                ) : (
                  <Sparkles size={14} className="mr-2" />
                )}
                {summaryState.isLoading ? 'Loading...' : 'AI Summary'}
              </button>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={handleShare} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Share article"
              >
                <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isBookmarked ? 'text-accent dark:text-accent-dark' : 'text-gray-600 dark:text-gray-400'
                }`}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-title"
          >
            <motion.div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={handleModalBackdropClick}
              onTouchEnd={handleModalBackdropClick}
            />
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card relative max-w-lg w-full p-6 rounded-2xl max-h-[80vh] overflow-y-auto touch-pan-y overscroll-contain"
              tabIndex={-1}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Sparkles className="text-accent dark:text-accent-dark mr-2" size={20} />
                  <h3 id="summary-title" className="text-lg font-semibold gradient-text">
                    AI Summary
                  </h3>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="Close summary"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {summaryState.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent dark:border-accent-dark"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Generating summary...</span>
                </div>
              ) : summaryState.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-3 text-red-500 dark:text-red-400" size={32} />
                  <p className="text-red-500 dark:text-red-400 mb-4">{summaryState.error}</p>
                  <button
                    onClick={handleSummarize}
                    className="px-4 py-2 bg-accent/10 text-accent dark:bg-accent-dark/10 dark:text-accent-dark rounded-full hover:bg-accent/20 dark:hover:bg-accent-dark/20 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {summaryState.content}
                  </p>
                  {summaryState.lastUpdated && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 border-t pt-3">
                      Generated on {format(summaryState.lastUpdated, 'MMM dd, yyyy \'at\' HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArticleCard;