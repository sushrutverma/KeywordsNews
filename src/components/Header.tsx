import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  LogIn, 
  Search, 
  Bell, 
  Menu, 
  X, 
  User,
  Bookmark,
  TrendingUp,
  Globe
} from 'lucide-react';

// Mock auth context for demo
const useAuth = () => ({
  user: { name: 'John Doe', avatar: null }
});

const Header = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Trending', icon: TrendingUp, id: 'trending' },
    { name: 'World', icon: Globe, id: 'world' },
    { name: 'Saved', icon: Bookmark, id: 'saved' },
  ];

  const handleNavClick = (id) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Logo Section */}
            <motion.div 
              className="flex items-center space-x-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => handleNavClick('home')}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-white font-bold text-lg">K</span>
                  </motion.div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white font-serif">
                    Keywords
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Stay Informed
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-2 transition-colors duration-200 font-medium px-3 py-2 rounded-lg ${
                      activeSection === item.id
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </button>
                </motion.div>
              ))}
            </nav>

            {/* Search Bar */}
            <motion.div 
              className="hidden md:flex items-center flex-1 max-w-md mx-8"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative w-full">
                <motion.div
                  className={`relative flex items-center transition-all duration-300 ${
                    searchFocused ? 'transform scale-105' : ''
                  }`}
                >
                  <Search 
                    className="absolute left-3 text-gray-400 z-10" 
                    size={18} 
                  />
                  <input
                    type="text"
                    placeholder="Search news, topics..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              
              {/* Mobile Search */}
              <motion.button
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                whileTap={{ scale: 0.95 }}
              >
                <Search size={20} />
              </motion.button>

              {user ? (
                <>
                  {/* Notifications */}
                  <motion.button
                    className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -2 }}
                  >
                    <Bell size={20} />
                    <motion.span
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.button>

                  {/* User Menu */}
                  <div className="hidden lg:flex items-center space-x-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleNavClick('settings')}
                      className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Settings size={20} />
                    </motion.button>
                    
                    <motion.div
                      className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNavClick('profile')}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </motion.div>
                  </div>
                </>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  onClick={() => handleNavClick('login')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-full text-white text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Sign In</span>
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform origin-left transition-transform duration-300" 
             style={{ transform: `scaleX(${isScrolled ? 1 : 0})` }} />
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              className="absolute top-16 right-4 left-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search news..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.1 }}
                    >
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors text-left ${
                          activeSection === item.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <item.icon size={20} className={activeSection === item.id ? 'text-blue-600' : 'text-gray-600'} />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </motion.div>
                  ))}
                </nav>

                {user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500">Manage your account</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavClick('settings')}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Content */}
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enhanced News Header Demo
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Active section: <span className="font-semibold text-blue-600">{activeSection}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Sample News Article {i}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This is a placeholder for news content. The header above demonstrates enhanced functionality.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;