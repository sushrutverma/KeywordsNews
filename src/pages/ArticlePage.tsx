import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowLeft, Share2, Bookmark, ExternalLink, Sparkles, AlertCircle, Clock, Eye } from 'lucide-react';
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
  const [readingTime, setReadingTime] = useState(0);
  const isBookmarked = article ? savedArticles.some(a => a.id === article.id) : false;

  useEffect(() => {
    if (id) {
      const foundArticle = articles.find(a => a.id === id);
      if (foundArticle) {
        setArticle(foundArticle);
        // Calculate reading time (average 200 words per minute)
        const wordCount = foundArticle.content?.split(' ').length || 0;
        setReadingTime(Math.ceil(wordCount / 200));
      } else {
        // Check if it's in savedArticles
        const savedArticle = savedArticles.find(a => a.id === id);
        if (savedArticle) {
          setArticle(savedArticle);
          const wordCount = savedArticle.content?.split(' ').length || 0;
          setReadingTime(Math.ceil(wordCount / 200));
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
      <p key={index} className="mb-6 leading-relaxed text-lg">{paragraph}</p>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section with Image */}
      {article.image && (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          
          {/* Floating Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-6 z-20"
          >
            <button
              onClick={() => navigate(-1)}
              className="backdrop-blur-md bg-white/20 dark:bg-black/20 p-3 rounded-full hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 shadow-lg"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-6 right-6 z-20 flex space-x-3"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="backdrop-blur-md bg-white/20 dark:bg-black/20 p-3 rounded-full hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 shadow-lg"
            >
              <Share2 size={18} className="text-white" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmarkToggle}
              className={`backdrop-blur-md p-3 rounded-full transition-all duration-300 shadow-lg ${
                isBookmarked 
                  ? 'bg-indigo-600/80 hover:bg-indigo-700/80' 
                  : 'bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30'
              }`}
            >
              <Bookmark 
                size={18} 
                className="text-white" 
                fill={isBookmarked ? 'currentColor' : 'none'} 
              />
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Content Container */}
      <div className="relative -mt-16 md:-mt-20 z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 sm:px-6"
        >
          {/* Article Card */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header Section */}
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700">
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium">
                  {article.source}
                </span>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Clock size={14} className="mr-1" />
                  <span>{format(new Date(article.pubDate), 'MMM dd, yyyy')}</span>
                </div>
                {readingTime > 0 && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Eye size={14} className="mr-1" />
                    <span>{readingTime} min read</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white leading-tight mb-6">
                {article.title}
              </h1>

              {/* AI Summary Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg mr-3">
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Summary</h2>
                </div>
                
                {isSummarizing ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Generating intelligent summary...</span>
                  </div>
                ) : summaryError ? (
                  <div className="flex items-center text-red-500 dark:text-red-400 py-3">
                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                    <span>{summaryError}</span>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {summary}
                  </p>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 md:p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {article.content ? (
                  <div className="font-source-serif text-gray-800 dark:text-gray-200">
                    {formatContent(article.content)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="text-gray-400 dark:text-gray-500" size={24} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No content available for this article.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Want to read the complete article with all details?
                </div>
                <motion.a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  Read Full Article
                  <ExternalLink size={16} className="ml-2" />
                </motion.a>
              </div>
            </div>
          </div>

          {/* No Image Fallback Header */}
          {!article.image && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigate(-1)}
                  className="p-3 rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                >
                  <ArrowLeft className="text-gray-600 dark:text-gray-400" size={20} />
                </button>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-3 rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                  >
                    <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBookmarkToggle}
                    className={`p-3 rounded-full transition-colors backdrop-blur-sm ${
                      isBookmarked 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ArticlePage;