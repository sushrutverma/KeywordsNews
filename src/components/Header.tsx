import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogIn, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6 relative">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-dark font-unifraktur">
          Keywords
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {/* Info button */}
        <div className="relative">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            <Info className="text-white" size={20} />
          </button>

          {showInfo && (
            <div className="absolute right-0 mt-2 w-max bg-gray-800 text-white text-xs rounded px-2 py-1 shadow">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/sushrutverma/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                Sushrut Verma
              </a>
            </div>
          )}
        </div>

        {/* Settings/Login */}
        {user ? (
          <Link to="/settings">
            <motion.button whileTap={{ scale: 0.95 }} className="fab p-2 rounded-full">
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
