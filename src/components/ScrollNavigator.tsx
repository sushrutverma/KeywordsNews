import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const navigatorRef = useRef<HTMLDivElement>(null);

  // Motion values for dragging
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.3, 0.7, 0.3]);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setShowButtons(position > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const startAutoScroll = (direction: 'up' | 'down') => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    const step = direction === 'up' ? -50 : 50;
    const targetPosition = direction === 'up' ? 0 : document.documentElement.scrollHeight;
    
    const scroll = () => {
      if (!isScrolling) return;
      
      const currentPosition = window.scrollY;
      const newPosition = currentPosition + step;
      
      if (
        (direction === 'up' && newPosition > 0) ||
        (direction === 'down' && newPosition < document.documentElement.scrollHeight)
      ) {
        window.scrollTo({
          top: newPosition,
          behavior: 'smooth'
        });
        requestAnimationFrame(scroll);
      } else {
        setIsScrolling(false);
      }
    };
    
    requestAnimationFrame(scroll);
  };

  const stopAutoScroll = () => {
    setIsScrolling(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleButtonPress = (direction: 'up' | 'down') => {
    const timer = setTimeout(() => {
      startAutoScroll(direction);
    }, 500); // Start auto-scroll after 500ms press
    
    setLongPressTimer(timer);
  };

  const handleButtonRelease = () => {
    stopAutoScroll();
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    y.set(0);
  };

  const handleDrag = (event: any, info: any) => {
    const scrollSpeed = info.velocity.y * 0.5;
    window.scrollBy({
      top: scrollSpeed,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {showButtons && (
        <motion.div
          ref={navigatorRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.7, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{ opacity }}
          className="fixed right-4 bottom-40 z-50 touch-none"
          drag
          dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
        >
          <div className="flex flex-col gap-2 backdrop-blur-sm rounded-full p-2 bg-gray-900/30 dark:bg-gray-100/30">
            <motion.button
              onMouseDown={() => handleButtonPress('up')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('up')}
              onTouchEnd={handleButtonRelease}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll up"
            >
              <ChevronUp size={20} />
            </motion.button>
            
            <motion.button
              onMouseDown={() => handleButtonPress('down')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('down')}
              onTouchEnd={handleButtonRelease}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg backdrop-blur-sm"
              aria-label="Scroll down"
            >
              <ChevronDown size={20} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;