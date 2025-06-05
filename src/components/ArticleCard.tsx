import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const SimpleScrollNavigator = () => {
  const [isUpPressed, setIsUpPressed] = useState(false);
  const [isDownPressed, setIsDownPressed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFeedback, setShowFeedback] = useState('');
  const scrollIntervalRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  const tapCountRef = useRef(0);
  const longPressTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  const showFeedbackMessage = useCallback((message) => {
    setShowFeedback(message);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback('');
    }, 1500);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showFeedbackMessage('Scrolled to top');
  }, [showFeedbackMessage]);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    showFeedbackMessage('Scrolled to bottom');
  }, [showFeedbackMessage]);

  const pageJump = useCallback((direction) => {
    const jumpAmount = window.innerHeight * 0.8; // 80% of viewport height
    const scrollAmount = direction === 'up' ? -jumpAmount : jumpAmount;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    showFeedbackMessage(`Page ${direction === 'up' ? 'up' : 'down'}`);
  }, [showFeedbackMessage]);

  const handleTap = useCallback((direction) => {
    tapCountRef.current += 1;
    
    if (tapCountRef.current === 1) {
      // Single tap - page jump
      tapTimeoutRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          pageJump(direction);
        }
        tapCountRef.current = 0;
      }, 300);
    } else if (tapCountRef.current === 2) {
      // Double tap - scroll to top/bottom
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      direction === 'up' ? scrollToTop() : scrollToBottom();
      tapCountRef.current = 0;
    }
  }, [pageJump, scrollToTop, scrollToBottom]);

  const startScrolling = useCallback((direction) => {
    if (scrollIntervalRef.current) return;
    
    setIsScrolling(true);
    const scrollAmount = direction === 'up' ? -16 : 16; // Increased from 8 to 16 (2x speed)
    
    const scroll = () => {
      window.scrollBy({ top: scrollAmount, behavior: 'auto' });
    };
    
    // Initial scroll
    scroll();
    
    // Continue scrolling
    scrollIntervalRef.current = setInterval(scroll, 16); // ~60fps
  }, []);

  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsScrolling(false);
    setIsUpPressed(false);
    setIsDownPressed(false);
  }, []);

  const handlePointerDown = useCallback((direction) => {
    // Set pressed state immediately
    direction === 'up' ? setIsUpPressed(true) : setIsDownPressed(true);
    
    // Start long press timer for continuous scrolling
    longPressTimeoutRef.current = setTimeout(() => {
      startScrolling(direction);
    }, 500); // 500ms for long press
  }, [startScrolling]);

  const handlePointerUp = useCallback((direction) => {
    if (longPressTimeoutRef.current) {
      // Short press - handle as tap
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
      
      if (!isScrolling) {
        handleTap(direction);
      }
    }
    
    stopScrolling();
  }, [isScrolling, handleTap, stopScrolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const isAnyButtonPressed = isUpPressed || isDownPressed;

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-[1000] select-none">
      {/* Feedback Message */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap backdrop-blur-sm"
        >
          {showFeedback}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0.7, x: 20 }}
        animate={{ 
          opacity: isAnyButtonPressed ? 0.4 : 0.7,
          x: 0 
        }}
        transition={{ duration: 0.2 }}
        role="group"
        aria-label="Scroll Navigator"
      >
        <div className="flex flex-col gap-3">
          {/* Up Button */}
          <motion.button
            className={`
              w-16 h-16 rounded-full backdrop-blur-sm border-2 flex items-center justify-center
              transition-all duration-200 touch-none relative
              ${isUpPressed 
                ? 'bg-blue-500/80 border-blue-400 text-white shadow-lg' 
                : 'bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400'
              }
            `}
            onPointerDown={() => handlePointerDown('up')}
            onPointerUp={() => handlePointerUp('up')}
            onPointerLeave={stopScrolling}
            onPointerCancel={stopScrolling}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll Up (Tap: Page Up, Double-tap: Top, Hold: Continuous)"
            title="Tap: Page Up | Double-tap: To Top | Hold: Continuous Scroll"
          >
            <ChevronUp size={28} strokeWidth={2.5} />
          </motion.button>

          {/* Down Button */}
          <motion.button
            className={`
              w-16 h-16 rounded-full backdrop-blur-sm border-2 flex items-center justify-center
              transition-all duration-200 touch-none relative
              ${isDownPressed 
                ? 'bg-blue-500/80 border-blue-400 text-white shadow-lg' 
                : 'bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400'
              }
            `}
            onPointerDown={() => handlePointerDown('down')}
            onPointerUp={() => handlePointerUp('down')}
            onPointerLeave={stopScrolling}
            onPointerCancel={stopScrolling}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll Down (Tap: Page Down, Double-tap: Bottom, Hold: Continuous)"
            title="Tap: Page Down | Double-tap: To Bottom | Hold: Continuous Scroll"
          >
            <ChevronDown size={28} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleScrollNavigator;