import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bookmark, Share2, ExternalLink, Sparkles, X } from 'lucide-react';
import { Article } from '../types';
import { useNews } from '../contexts/NewsContext';
import { aiService } from '../services/aiService';

interface ArticleCardProps {
  article: Article;
  keyword?: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, keyword }) => {
  const { savedArticles, saveArticle, removeFromSaved } = useNews();
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (showSummary) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showSummary]);

  if (!article) return null;

  const isBookmarked = savedArticles?.some((a) => a.id === article.id) || false;

  const formatContent = (content: string) => {
    try {
      const stripped = content.replace(/<[^>]*>/g, '');
      const decoded = stripped.replace(/&[^;]+;/g, (match) => {
        const div = document.createElement('div');
        div.innerHTML = match;
        return div.textContent || div.innerText || match;
      });
      return decoded;
    } catch {
      return content;
    }
  };

  const highlightKeyword = (text: string, keyword?: string) => {
    if (!keyword || !text) return text;
    try {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-primary/20 dark:bg-primary-dark/20">{part}</span>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: article.title || 'News Article',
          text: article.title || 'Check out this article',
          url: article.link,
        });
      } else {
        await navigator.clipboard.writeText(article.link || '');
        console.log('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleBookmarkToggle = () => {
    if (!article?.id) return;
    isBookmarked ? removeFromSaved(article.id) : saveArticle(article);
  };

  const handleSummarize = async () => {
    if (!showSummary) {
      if (!article.content) {
        setSummary('No content available to summarize.');
        setShowSummary(true);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.summarize(article.content);
        setSummary(result?.summary || 'No summary available.');
      } catch {
        setError('Failed to generate summary.');
      } finally {
        setIsLoading(false);
        setShowSummary(true);
      }
    } else {
      setShowSummary(false);
    }
  };

  const handleModalBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      setShowSummary(false);
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 'Unknown date' : format(d, 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const formattedContent = formatContent(article.content || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="article-card glass-card rounded-xl overflow-hidden mb-6 relative"
    >
      {article.image && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={article.image}
            alt={article.title || 'Article image'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center mb-3">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark">
            {article.source || 'Unknown'} • {formatDate(article.pubDate)}
          </span>
        </div>

        <Link to={`/article/${article.id}`}>
          <h2 className="text-xl font-playfair font-bold mb-3 text-primary dark:text-primary-dark">
            {highlightKeyword(article.title || 'Untitled', keyword)}
          </h2>
        </Link>

        {formattedContent && (
          <p className="font-source-serif text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {highlightKeyword(formattedContent, keyword)}
          </p>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex space-x-3">
            <Link
              to={`/article/${article.id}`}
              className="fab px-4 py-2 rounded-full text-white text-sm font-medium flex items-center"
            >
              Read more <ExternalLink size={14} className="ml-2" />
            </Link>

            <button
              onClick={handleSummarize}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-accent/10 text-accent dark:bg-accent-dark/10 dark:text-accent-dark text-sm font-medium flex items-center disabled:opacity-50"
            >
              <Sparkles size={14} className="mr-2" />
              {isLoading ? 'Loading...' : 'AI Summary'}
            </button>
          </div>

          <div className="flex space-x-2">
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isBookmarked ? 'text-accent dark:text-accent-dark' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Sparkles className="text-accent dark:text-accent-dark mr-2" size={20} />
                  <h3 className="text-lg font-semibold gradient-text">AI Summary</h3>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent dark:border-accent-dark"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Generating summary...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 dark:text-red-400 text-center py-8">{error}</div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{summary}</p>
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
