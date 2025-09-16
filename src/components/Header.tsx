import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogIn, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-dark font-unifraktur">Keywords</h1>
      </div>
      <div className="flex items-center space-x-2">
        {/* Info Button */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInfo(!showInfo)}
            className="fab p-2 rounded-full"
            title="Developer Info"
          >
            <Info className="text-white" size={20} />
          </motion.button>
          
          {/* Tooltip/Popup */}
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-max"
            >
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-medium">Developed by</div>
                <div className="mt-1">Sushrut Verma</div>
                <a 
                  href="https://www.linkedin.com/in/sushrutverma" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-1 block"
                >
                  linkedin.com/in/sushrutverma
                </a>
              </div>
              {/* Arrow pointing up */}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
            </motion.div>
          )}
        </div>

        {user ? (
          <Link to="/settings">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="fab p-2 rounded-full"
            >
              <Settings className="text-white" size={20} />
            </motion.button>
          </Link>
        ) : (
          <Link to="/login">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="fab px-4 py-2 rounded-full text-white text-sm font-medium flex items-center"
            >
              <LogIn size={16} className="mr-2" />
              Sign In
            </motion.button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;