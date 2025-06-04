import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Mic, MicOff, BookOpen, Bookmark, Trash2, AlertCircle, MessageSquare } from 'lucide-react';
import { useNews } from '../contexts/NewsContext';
import { Article } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { aiService } from '../services/aiService';

interface ArticleCardProps {
  article: Article;
  index: number;
  keyword: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, index, keyword }) => {
  const { user } = useAuth();
  const { speakText, stopSpeaking, speakingArticleId, saveArticle, unsaveArticle, savedArticles, deleteArticleHistory, articleHistories } = useNews();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const summaryButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSpeaking(speakingArticleId === article.id);
  }, [speakingArticleId, article.id]);

  useEffect(() => {
    if (user) {
      setIsSaved(savedArticles.some(sa => sa.article_id === article.id && sa.user_id === user.id));
    } else {
      setIsSaved(false);
    }
  }, [savedArticles, article.id, user]);
  
  const isViewed = useMemo(() => {
    if (!user) return false;
    return articleHistories.some(ah => ah.article_id === article.id && ah.user_id === user?.id && ah.is_viewed);
  }, [articleHistories, article.id, user]);

  const handleSpeak = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(article.title + ". " + (article.description || ""), article.id);
    }
  };

  const formatContent = (content: string | null | undefined): string => {
    if (!content) return 'Content not available.';
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      // Further clean up: remove script and style tags
      Array.from(tempDiv.querySelectorAll('script, style')).forEach(el => el.remove());
      return tempDiv.textContent || tempDiv.innerText || 'Content not available.';
    } catch (error) {
      console.error("Error formatting content:", error);
      return content || 'Content not available.'; // Fallback to original content if error
    }
  };

  const highlightKeyword = (text: string | null | undefined, keyword: string): React.ReactNode => {
    if (!text) return text;
    if (!keyword) return text;
    try {
      const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === keyword.toLowerCase() ? (
              <span key={i} className="bg-yellow-200 dark:bg-yellow-600">
                {part}
              </span>
            ) : (
              part
            )
          )}
        </>
      );
    } catch (error) {
      console.warn("Error highlighting keyword:", error);
      return text; // Fallback to original text if regex is invalid
    }
  };
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (summaryButtonRef.current && summaryButtonRef.current.contains(e.target as Node)) {
      // Click was on the summary button, don't open the article
      return;
    }
    if (article.link) {
      window.open(article.link, '_blank', 'noopener,noreferrer');
      if (user && article.id) {
        // Log view history
        supabase
          .from('article_history')
          .upsert({ 
            user_id: user.id, 
            article_id: article.id,
            is_viewed: true,
            viewed_at: new Date().toISOString(),
            keyword: keyword || undefined
          }, { onConflict: 'user_id, article_id' })
          .then(({ error }) => {
            if (error) console.error('Error logging view history:', error);
          });
      }
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user || !article.id) {
      alert("Please log in to save articles.");
      return;
    }
    if (isSaved) {
      await unsaveArticle(article.id, user.id);
    } else {
      // Pass the full article object for saving, ensure it matches SavedArticleInsert type
      const articleToSave = {
        article_id: article.id,
        user_id: user.id,
        title: article.title,
        link: article.link,
        description: article.description,
        pubDate: article.pubDate,
        source_id: article.source?.id || article.source_id, // Handle potential missing source object
        source_name: article.source?.name || article.source_name,
        image_url: article.imageUrl,
        saved_at: new Date().toISOString(),
        keyword: keyword || undefined
      };
      await saveArticle(articleToSave);
    }
  };
  
  const handleDeleteHistory = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (user && article.id) {
      const success = await deleteArticleHistory(article.id, user.id);
      if (success) {
        // Optionally, provide user feedback
        console.log("Article history deleted successfully");
      }
    }
  };

  const handleSummaryClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    setShowSummary(true);
    if (summary) return; // Already have summary

    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const articleTextToSummarize = `${article.title}. ${formatContent(article.description || article.content)}`;
      const { summary: generatedSummary } = await aiService.summarize(articleTextToSummarize);
      setSummary(generatedSummary);
    } catch (error) {
      console.error("Error summarizing article:", error);
      setSummaryError(error instanceof Error ? error.message : "Failed to generate summary.");
      setSummary(null); // Clear any previous summary
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    if (showSummary) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to restore scrolling when component unmounts or showSummary changes
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showSummary]);


  const formattedDate = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date not available';

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden ${isSpeaking ? 'ring-2 ring-blue-500' : ''} ${isViewed ? 'opacity-70 dark:opacity-60' : ''} touch-pan-y`}
      onClick={handleCardClick}
      style={{ transformOrigin: 'top center' }}
    >
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-48 object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {article.source?.name || article.source_name || 'Unknown Source'} - {formattedDate}
          </span>
          <div className="flex space-x-2">
            {user && articleHistories.some(ah => ah.article_id === article.id && ah.user_id === user?.id && ah.is_viewed) && (
              <button
                onClick={handleDeleteHistory}
                title="Remove from viewed history"
                className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={handleSaveToggle}
              title={isSaved ? 'Unsave Article' : 'Save Article'}
              className={`p-1 ${isSaved ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400'} transition-colors`}
            >
              <Bookmark size={16} filled={isSaved} />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {highlightKeyword(article.title, keyword)}
        </h3>
        
        {article.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {highlightKeyword(formatContent(article.description), keyword)}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            <button
              onClick={handleSpeak}
              title={isSpeaking ? 'Stop Speaking' : 'Read Aloud'}
              className={`p-2 rounded-full transition-colors ${
                isSpeaking 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {isSpeaking ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {article.link && (
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open Article in New Tab"
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <button
              ref={summaryButtonRef}
              onClick={handleSummaryClick}
              title="Summarize Article"
              className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      </div>

      {showSummary && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowSummary(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Article Summary</h4>
              <button 
                onClick={() => setShowSummary(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            {isSummarizing && <div className="text-center py-4 text-gray-600 dark:text-gray-300">Generating summary...</div>}
            {summaryError && (
              <div className="text-center py-4 text-red-500 dark:text-red-400 flex items-center justify-center">
                <AlertCircle size={20} className="mr-2"/> {summaryError}
              </div>
            )}
            {summary && !isSummarizing && (
              <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap article-summary-content">
                {summary}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ArticleCard;