import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowLeft, Share2, Bookmark, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { useNews } from '../contexts/NewsContext';
import { Article } from '../types';
import { aiService } from '../services/aiService';

const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { articles, savedArticles, saveArticle, removeFromSaved } = useNews();
  const [article, setArticle] = useState<Article | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string>('');
  const isBookmarked = article ? savedArticles.some(a => a.id === article.id) : false;

  useEffect(() => {
    if (id) {
      const foundArticle = articles.find(a => a.id === id);
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        // Check if it's in savedArticles
        const savedArticle = savedArticles.find(a => a.id === id);
        if (savedArticle) {
          setArticle(savedArticle);
        } else {
          navigate('/');
        }
      }
    }
  }, [id, articles, navigate, savedArticles]);

  useEffect(() => {
    const generateSummary = async () => {
      if (article?.content) {
        setIsSummarizing(true);
        setSummaryError('');
        try {
          const result = await aiService.summarize(article.content);
          setSummary(result.summary);
        } catch (error) {
          setSummaryError('Failed to generate summary. Please try again later.');
          console.error('Summary generation error:', error);
        } finally {
          setIsSummarizing(false);
        }
      }
    };

    generateSummary();
  }, [article]);

  const formatContent = (content: string) => {
    // Remove HTML tags
    const strippedContent = content.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const decodedContent = strippedContent.replace(/&[^;]+;/g, match => {
      const div = document.createElement('div');
      div.innerHTML = match;
      return div.textContent || match;
    });
    // Format paragraphs
    return decodedContent.split('\n').filter(Boolean).map((paragraph, index) => (
      <p key={index} className="mb-4">{paragraph}</p>
    ));
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title,
          text: article?.title,
          url: article?.link,
        });
      } else {
        navigator.clipboard.writeText(article?.link || '');
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookmarkToggle = () => {
    if (!article) return;
    
    if (isBookmarked) {
      removeFromSaved(article.id);
    } else {
      saveArticle(article);
    }
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="article-container"
      >
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="text-gray-600 dark:text-gray-400" size={20} />
          </button>
          <h1 className="text-xl font-playfair font-bold ml-2">Article</h1>
        </div>

        {article.image && (
          <div className="w-full h-56 md:h-80 overflow-hidden rounded-lg mb-4">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {article.source} • {format(new Date(article.pubDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex space-x-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isBookmarked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              </motion.button>
            </div>
          </div>

          <h1 className="text-2xl font-playfair font-bold mb-4">{article.title}</h1>

          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center mb-2">
              <Sparkles className="text-indigo-600 dark:text-indigo-400 mr-2" size={18} />
              <h2 className="text-lg font-semibold">AI Summary</h2>
            </div>
            
            {isSummarizing ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Generating summary...</span>
              </div>
            ) : summaryError ? (
              <div className="flex items-center text-red-500 dark:text-red-400 py-2">
                <AlertCircle size={16} className="mr-2" />
                <span className="text-sm">{summaryError}</span>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{summary}</p>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {article.content ? (
              <div className="font-source-serif text-gray-700 dark:text-gray-300">
                {formatContent(article.content)}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No content available.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Read full article <ExternalLink size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ArticlePage;