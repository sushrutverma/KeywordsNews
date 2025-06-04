import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-dark font-unifraktur">Keywords</h1>
      </div>
      <div className="flex items-center space-x-2">
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