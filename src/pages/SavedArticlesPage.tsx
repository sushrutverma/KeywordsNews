import React from 'react';
import { motion } from 'framer-motion';
import { useNews } from '../contexts/NewsContext';
import ArticleCard from '../components/ArticleCard';
import { Bookmark, Trash2 } from 'lucide-react';

const SavedArticlesPage = () => {
  const { savedArticles, removeFromSaved } = useNews();

  const clearAllSaved = () => {
    if (window.confirm('Are you sure you want to remove all saved articles?')) {
      savedArticles.forEach(article => removeFromSaved(article.id));
    }
  };

  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bookmark className="text-indigo-600 dark:text-indigo-400 mr-2" size={24} />
            <h1 className="text-2xl font-bold">Saved Articles</h1>
          </div>
          
          {savedArticles.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearAllSaved}
              className="flex items-center text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} className="mr-1" />
              Clear All
            </motion.button>
          )}
        </div>

        {savedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No saved articles</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Articles you save will appear here for offline reading.
            </p>
          </div>
        ) : (
          <div>
            {savedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SavedArticlesPage;