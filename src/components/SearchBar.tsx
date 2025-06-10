import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Filter, TrendingUp, Calendar } from 'lucide-react';

const SearchBar = () => {
  const [keyword, setKeyword] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // search, history, filter
  const [searchType, setSearchType] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('7 days');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDays, setCustomDays] = useState('');
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  
  // Mock data and functions - replace with your actual implementations
  const [searchHistory, setSearchHistory] = useState(['AI Technology', 'Climate Change', 'Space Exploration']);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchArticles = (params) => {
    setIsLoading(true);
    console.log('Searching with params:', params);
    // Replace with your actual search implementation
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  const addToHistory = (term) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== term);
      return [term, ...filtered].slice(0, 10);
    });
  };
  
  const removeFromHistory = (term) => {
    setSearchHistory(prev => prev.filter(item => item !== term));
  };
  
  const clearHistory = () => {
    setSearchHistory([]);
  };
  
  const updateDurationFilter = (duration) => {
    console.log('Duration filter updated:', duration);
    // Replace with your actual implementation
  };

  const durations = [
    { value: '1 day', label: '1D' },
    { value: '3 days', label: '3D' },
    { value: '7 days', label: '1W' },
    { value: '14 days', label: '2W' },
    { value: '30 days', label: '1M' },
    { value: 'custom', label: 'Custom' }
  ];

  const searchTypes = [
    { value: 'all', label: 'All' },
    { value: 'headlines', label: 'Headlines' },
    { value: 'content', label: 'Content' }
  ];

  const handleSearch = (searchTerm = keyword) => {
    if (searchTerm.trim()) {
      searchArticles({ term: searchTerm, type: searchType, duration: selectedDuration });
      addToHistory(searchTerm);
      setKeyword(searchTerm);
    }
    setIsExpanded(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  const handleDurationChange = async (duration) => {
    setSelectedDuration(duration);
    if (duration === 'custom') {
      setShowCustomDuration(true);
      return;
    }
    setShowCustomDuration(false);
    updateDurationFilter(duration);
  };

  const handleCustomDuration = () => {
    if (customDays && parseInt(customDays) > 0) {
      const customDuration = `${customDays} days`;
      setSelectedDuration(customDuration);
      updateDurationFilter(customDuration);
      setShowCustomDuration(false);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    searchArticles({ term: '', type: searchType, duration: selectedDuration });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto" ref={searchRef}>
      {/* Main Search Bar */}
      <motion.div
        layout
        className={`bg-white dark:bg-gray-800 rounded-full shadow-md transition-all duration-300 ${
          isExpanded ? 'shadow-xl' : 'shadow-md hover:shadow-lg'
        }`}
        style={{ 
          borderRadius: isExpanded ? '28px 28px 28px 28px' : '28px',
          overflow: 'hidden'
        }}
      >
        {/* Search Input Row */}
        <div className="flex items-center px-4 py-3">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search news..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400"
            disabled={isLoading}
          />
          
          {keyword && (
            <button
              onClick={clearSearch}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2"
            >
              <X size={18} className="text-gray-400" />
            </button>
          )}
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch()}
            disabled={isLoading || !keyword.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full p-2 transition-colors"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Search size={16} />
            )}
          </motion.button>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-t border-gray-100 dark:border-gray-700"
            >
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                {[
                  { id: 'search', label: 'Search', icon: Search },
                  { id: 'history', label: 'History', icon: Clock },
                  { id: 'filter', label: 'Filter', icon: Filter }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* Search Tab */}
                {activeTab === 'search' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Type
                      </label>
                      <div className="flex gap-2">
                        {searchTypes.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => setSearchType(value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              searchType === value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular Searches */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Popular Searches
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['AI Technology', 'Climate Change', 'Space Exploration'].map((term) => (
                          <button
                            key={term}
                            onClick={() => {
                              setKeyword(term);
                              handleSearch(term);
                            }}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recent Searches
                      </span>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="text-sm text-red-500 hover:text-red-600 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="space-y-2">
                        {searchHistory.map((term, index) => (
                          <div
                            key={`${term}-${index}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <button
                              onClick={() => {
                                setKeyword(term);
                                handleSearch(term);
                              }}
                              className="flex-1 text-left text-gray-700 dark:text-gray-300"
                            >
                              {term}
                            </button>
                            <button
                              onClick={() => removeFromHistory(term)}
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <X size={14} className="text-gray-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent searches</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Filter Tab */}
                {activeTab === 'filter' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Range
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {durations.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => handleDurationChange(value)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedDuration === value || (value === 'custom' && !durations.some(d => d.value === selectedDuration))
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Duration Input */}
                    <AnimatePresence>
                      {showCustomDuration && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Custom Duration (days)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={customDays}
                              onChange={(e) => setCustomDays(e.target.value)}
                              placeholder="Enter days"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <button
                              onClick={handleCustomDuration}
                              disabled={!customDays || parseInt(customDays) <= 0}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
                            >
                              Apply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Currently showing: <span className="font-medium">{selectedDuration}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SearchBar;