import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Bookmark, Settings } from 'lucide-react';

const Navbar = () => {
  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bottom-nav z-10 pb-safe-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `ripple flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-primary dark:text-primary-dark scale-110' 
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <span className="text-xs mt-1">Home</span>
          </NavLink>
          
          <NavLink 
            to="/saved" 
            className={({ isActive }) => 
              `ripple flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-primary dark:text-primary-dark scale-110' 
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <span className="text-xs mt-1">Saved</span>
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `ripple flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-primary dark:text-primary-dark scale-110' 
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <span className="text-xs mt-1">Settings</span>
          </NavLink>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;