import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      setShowButtons(position > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (direction: 'up' | 'down') => {
    const currentPosition = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (direction === 'up') {
      window.scrollTo({
        top: Math.max(0, currentPosition - viewportHeight),
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: Math.min(documentHeight, currentPosition + viewportHeight),
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {showButtons && (
        <>
          {/* Left side navigator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.3, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ opacity: 0.8 }}
            className="fixed left-4 bottom-32 z-50 flex flex-col gap-2"
          >
            <button
              onClick={() => scrollTo('up')}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll up"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={() => scrollTo('down')}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll down"
            >
              <ChevronDown size={20} />
            </button>
          </motion.div>

          {/* Right side navigator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.3, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ opacity: 0.8 }}
            className="fixed right-4 bottom-32 z-50 flex flex-col gap-2"
          >
            <button
              onClick={() => scrollTo('up')}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll up"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={() => scrollTo('down')}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll down"
            >
              <ChevronDown size={20} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;