import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, Clock, ArrowRight, Loader2, Mic, Filter } from 'lucide-react';

const EnhancedSearchBar = ({ 
  onSearch, 
  searchHistory = [], 
  onAddToHistory, 
  onRemoveFromHistory,
  isSearching = false,
  searchError = null,
  getSuggestions 
}) => {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'week',
    source: 'all'
  });
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Auto-search on debounced keyword change
  useEffect(() => {
    if (debouncedKeyword.trim() && debouncedKeyword !== keyword) {
      handleSearch(debouncedKeyword, false);
    }
  }, [debouncedKeyword]);

  // Generate suggestions based on input
  const filteredSuggestions = useMemo(async () => {
    if (!keyword.trim()) return [];
    if (getSuggestions) {
      try {
        return await getSuggestions(keyword);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }
    }
    return [];
  }, [keyword, getSuggestions]);

  // Update suggestions when keyword changes
  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setSelectedIndex(-1);
  }, [filteredSuggestions]);

  const handleSearch = useCallback((searchTerm = keyword, addToHist = true) => {
    if (searchTerm.trim()) {
      onSearch?.(searchTerm, filters);
      if (addToHist && onAddToHistory) {
        onAddToHistory(searchTerm);
      }
      setKeyword(searchTerm);
    }
    setShowHistory(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [keyword, onSearch, onAddToHistory, filters]);

  const handleKeyDown = (e) => {
    const totalItems = showSuggestions ? suggestions.length : searchHistory.length;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selectedItem = showSuggestions ? suggestions[selectedIndex] : searchHistory[selectedIndex];
          handleSearch(selectedItem);
        } else {
          handleSearch();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowHistory(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    
    if (value.trim()) {
      setShowSuggestions(true);
      setShowHistory(false);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (!keyword.trim()) {
      setShowHistory(searchHistory.length > 0);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
      setShowHistory(false);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    setDebouncedKeyword('');
    onSearch?.('', filters);
    setShowHistory(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setKeyword(transcript);
        handleSearch(transcript);
      };
      
      recognition.start();
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowHistory(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayItems = showSuggestions ? suggestions : searchHistory;
  const showDropdown = (showHistory && searchHistory.length > 0) || (showSuggestions && suggestions.length > 0);

  return (
    <div className="w-full mb-4" ref={searchRef}>
      {/* Main Search Bar */}
      <div className="glass-card rounded-full shadow-md overflow-hidden p-2 relative" style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center">
          <Search className="ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" size={20} />
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, topics, keywords..."
            value={keyword}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full py-2 px-3 bg-transparent focus:outline-none dark:text-white text-sm sm:text-base"
            aria-label="Search articles"
            aria-describedby="search-help"
            role="searchbox"
            aria-expanded={showDropdown}
            aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
          />

          {/* Loading Spinner */}
          {isSearching && (
            <Loader2 className="animate-spin text-gray-500 dark:text-gray-400 mr-2" size={18} />
          )}

          {/* Voice Search Button */}
          {'webkitSpeechRecognition' in window && (
            <button
              onClick={startVoiceSearch}
              disabled={isListening}
              className={`p-2 rounded-full transition-colors mr-1 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              title="Voice search"
            >
              <Mic size={16} />
            </button>
          )}

          {/* Clear Button */}
          {keyword && (
            <button
              onClick={clearSearch}
              className="mr-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Clear search"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`mr-1 p-2 rounded-full transition-colors ${
              showFilters 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
            title="Search filters"
          >
            <Filter size={16} />
          </button>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full p-2 mr-1 disabled:opacity-50 transition-colors"
            title="Search"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded-lg">
            {searchError}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 rounded border bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="tech">Technology</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full p-2 rounded border bg-white dark:bg-gray-800 text-sm"
              >
                <option value="day">Last 24 hours</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
                <option value="year">Last year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                className="w-full p-2 rounded border bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="news">News Sites</option>
                <option value="blogs">Blogs</option>
                <option value="academic">Academic</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Recent Keywords Bubbles */}
      {searchHistory.length > 0 && !showDropdown && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchHistory.slice(0, 5).map((term, index) => (
            <div
              key={term}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center px-3 py-1 rounded-full text-sm"
            >
              <button
                onClick={() => handleSearch(term)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium mr-2 hover:underline"
              >
                {term}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromHistory?.(term);
                }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Remove from history"
              >
                <X size={12} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
          <div className="p-2 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              {showSuggestions ? (
                <>
                  <Search size={14} className="mr-1" /> Suggestions
                </>
              ) : (
                <>
                  <Clock size={14} className="mr-1" /> Recent searches
                </>
              )}
            </span>
            <span className="text-xs text-gray-400">
              {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <ul role="listbox">
            {displayItems.map((item, index) => (
              <li 
                key={`${showSuggestions ? 'suggestion' : 'history'}-${index}`}
                id={`search-item-${index}`}
                role="option"
                aria-selected={selectedIndex === index}
                className={`border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0 ${
                  selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between p-3 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <div 
                    className="flex-grow flex items-center"
                    onClick={() => handleSearch(item)}
                  >
                    {showSuggestions ? (
                      <Search size={14} className="mr-2 text-gray-400" />
                    ) : (
                      <Clock size={14} className="mr-2 text-gray-400" />
                    )}
                    <span className="text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                      {item}
                    </span>
                  </div>
                  {!showSuggestions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromHistory?.(item);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-2"
                      title="Remove from history"
                    >
                      <X size={14} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Screen reader help text */}
      <div id="search-help" className="sr-only">
        Use arrow keys to navigate suggestions, Enter to search, Escape to close
      </div>
    </div>
  );
};

export default EnhancedSearchBar;