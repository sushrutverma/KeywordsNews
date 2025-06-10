import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useNews } from '../contexts/NewsContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';

const SearchBar = () => {
  const [keyword, setKeyword] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { searchArticles } = useNews();
  const { searchHistory, addToHistory, removeFromHistory } = useSearchHistory();

  const handleSearch = (searchTerm: string = keyword) => {
    if (searchTerm.trim()) {
      searchArticles(searchTerm);
      addToHistory(searchTerm);
      setKeyword(searchTerm);
    }
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full mb-4" ref={searchRef}>
      <div className="glass-card rounded-full shadow-md overflow-hidden p-2">
        <div className="flex items-center">
          <Search className="ml-2 text-gray-500 dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search keywords..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onKeyDown={handleKeyDown}
            className="w-full py-2 px-3 bg-transparent focus:outline-none dark:text-white"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('');
                searchArticles('');
              }}
              className="mr-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch()}
            className="fab text-white rounded-full p-2 mr-1"
          >
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Recent Keywords Bubbles */}
      {searchHistory.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence>
            {searchHistory.map((term, index) => (
              <motion.div
                key={term}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="glass-card flex items-center px-3 py-1 rounded-full text-sm"
              >
                <button
                  onClick={() => handleSearch(term)}
                  className="gradient-text font-medium mr-2"
                >
                  {term}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(term);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={14} className="text-gray-500 dark:text-gray-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showHistory && searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-2 w-full glass-card rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Clock size={14} className="mr-1" /> Recent searches
              </span>
            </div>
            <ul>
              {searchHistory.map((item, index) => (
                <li key={index} className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <div 
                      className="flex-grow"
                      onClick={() => handleSearch(item)}
                    >
                      <span className="text-gray-800 dark:text-gray-200">{item}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;