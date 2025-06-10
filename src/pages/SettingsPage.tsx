import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Trash2, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import { useNews } from '../contexts/NewsContext';
import { news_sources } from '../services/newsSources';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { searchHistory, clearHistory } = useSearchHistory();
  const { refreshNews } = useNews();

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Settings className="text-indigo-600 dark:text-indigo-400 mr-2" size={24} />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {theme === 'dark' ? (
                <Moon className="text-indigo-600 dark:text-indigo-400 mr-3" size={24} />
              ) : (
                <Sun className="text-indigo-600 dark:text-indigo-400 mr-3" size={24} />
              )}
              <h3 className="text-xl font-semibold">Dark Mode</h3>
            </div>

            <div
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              onClick={toggleTheme}
            >
              <motion.div
                className="bg-white w-5 h-5 rounded-full shadow-md"
                animate={{ x: theme === 'dark' ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* News Sources */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">News Sources</h2>
          <ul className="space-y-3">
            {news_sources.map((source, index) => (
              <li key={index} className="flex items-center">
                <Globe className="text-indigo-600 dark:text-indigo-400 mr-3" size={20} />
                <div>
                  <span className="text-lg font-semibold">{source.name}</span>
                  {source.category && (
                    <span className="ml-2 text-sm px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {source.category}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={() => refreshNews()}
            className="mt-8 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={20} className="mr-3" />
            Refresh All News Sources
          </button>
        </div>

        {/* Data & Privacy */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">Data & Privacy</h2>
          <button
            onClick={() => {
              if (searchHistory.length > 0 && window.confirm('Are you sure you want to clear your search history?')) {
                clearHistory();
              }
            }}
            className={`w-full flex items-center justify-center px-6 py-3 ${
              searchHistory.length > 0
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            } text-white rounded-lg transition-colors`}
            disabled={searchHistory.length === 0}
          >
            <Trash2 size={20} className="mr-3" />
            Clear Search History
            {searchHistory.length > 0 && (
              <span className="ml-3 bg-white bg-opacity-20 px-3 py-1 rounded-full text-lg">
                {searchHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">About</h2>
          <h3 className="font-bold text-2xl mb-2 flex items-center">
            Keywords <span className="ml-3 text-lg px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">v1.0.0</span>
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            A modern news aggregator that helps you follow topics that matter to you.
          </p>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
              This app is part of Sushrut Verma AI Project
            </p>
            <a
              href="https://www.linkedin.com/in/sushrutverma/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Connect on LinkedIn
              <ExternalLink size={18} className="ml-2" />
            </a>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-6">
              © 2025 Keywords. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
