import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Trash2, RefreshCw, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import { useNews } from '../contexts/NewsContext';
import { news_sources } from '../services/newsSources';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { searchHistory, clearHistory } = useSearchHistory();
  const { refreshNews } = useNews();

  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-6">
          <Settings className="text-indigo-600 dark:text-indigo-400 mr-2" size={24} />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-1">Appearance</h2>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {theme === 'dark' ? (
                  <Moon className="text-indigo-600 dark:text-indigo-400 mr-3\" size={20} />
                ) : (
                  <Sun className="text-indigo-600 dark:text-indigo-400 mr-3" size={20} />
                )}
                <span>Dark Mode</span>
              </div>
              
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                onClick={toggleTheme}
              >
                <motion.div
                  className="bg-white w-4 h-4 rounded-full shadow-md"
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-1">News Sources</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">The app currently uses the following news sources:</p>
          </div>
          
          <div className="p-4">
            <ul className="space-y-2">
              {news_sources.map((source, index) => (
                <li key={index} className="flex items-start">
                  <Globe className="text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2 flex-shrink-0" size={16} />
                  <div>
                    <span className="font-medium">{source.name}</span>
                    {source.category && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">
                        {source.category}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => refreshNews()}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh All News Sources
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-1">Data & Privacy</h2>
          </div>
          
          <div className="p-4">
            <button
              onClick={() => {
                if (searchHistory.length > 0 && window.confirm('Are you sure you want to clear your search history?')) {
                  clearHistory();
                }
              }}
              className={`w-full flex items-center justify-center px-4 py-2 ${
                searchHistory.length > 0
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              } text-white rounded-lg transition-colors`}
              disabled={searchHistory.length === 0}
            >
              <Trash2 size={16} className="mr-2" />
              Clear Search History
              {searchHistory.length > 0 && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {searchHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-1">About</h2>
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-xl mb-1 flex items-center">
              Keywords <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">v1.0.0</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              A modern news aggregator that helps you follow topics that matter to you.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2025 Keywords. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;