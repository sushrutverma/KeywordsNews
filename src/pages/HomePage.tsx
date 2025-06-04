import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactPullToRefresh from 'react-pull-to-refresh';
import { useNews } from '../contexts/NewsContext';
import SearchBar from '../components/SearchBar';
import ArticleCard from '../components/ArticleCard';
import DurationFilter from '../components/DurationFilter';
import Header from '../components/Header';
import { RefreshCw, AlertCircle } from 'lucide-react';

const HomePage = () => {
  const { filteredArticles, isLoading, isError, refreshNews, currentKeyword } = useNews();

  useEffect(() => {
    refreshNews();
  }, []);

  const handleRefresh = async () => {
    await refreshNews();
    return Promise.resolve();
  };

  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header />
        <SearchBar />
        <DurationFilter />

        {currentKeyword && (
          <div className="mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredArticles.length} results for "{currentKeyword}"
            </span>
          </div>
        )}
      </motion.div>

      <ReactPullToRefresh
        onRefresh={handleRefresh}
        pullingContent={
          <div className="flex justify-center items-center py-2">
            <RefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400\" size={24} />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Pull to refresh...</span>
          </div>
        }
        refreshingContent={
          <div className="flex justify-center items-center py-2">
            <RefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
          </div>
        }
        className="ptr-container"
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4\" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Loading the latest news...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="text-red-500 mb-4" size={32} />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Failed to load news.</p>
              <button
                onClick={refreshNews}
                className="fab px-4 py-2 rounded-full text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {currentKeyword ? `No articles found for "${currentKeyword}"` : 'No articles available.'}
              </p>
              {currentKeyword && (
                <button
                  onClick={() => refreshNews()}
                  className="fab px-4 py-2 rounded-full text-white"
                >
                  Show All Articles
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredArticles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  keyword={currentKeyword}
                />
              ))}
            </div>
          )}
        </div>
      </ReactPullToRefresh>
    </div>
  );
};

export default HomePage;