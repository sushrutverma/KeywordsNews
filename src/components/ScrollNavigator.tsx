import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const navigatorRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Throttled scroll handler for better performance
  const updateScrollState = useCallback(() => {
    const position = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (position / maxScroll) * 100 : 0;
    
    setShowButtons(position > 100);
    setScrollProgress(progress);
    setIsAtTop(position < 10);
    setIsAtBottom(position >= maxScroll - 10);
  }, []);

  // Throttle scroll events
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollState, 16);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [updateScrollState]);

  // Enhanced auto-scroll with easing
  const startAutoScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    let startTime: number | null = null;
    const baseSpeed = 3;
    let currentSpeed = baseSpeed;
    
    const scroll = (timestamp: number) => {
      if (!isScrolling) return;
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      currentSpeed = Math.min(baseSpeed + (elapsed / 1000) * 2, 15);
      
      const currentPosition = window.scrollY;
      const step = direction === 'up' ? -currentSpeed : currentSpeed;
      const newPosition = currentPosition + step;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (
        (direction === 'up' && newPosition > 0) ||
        (direction === 'down' && newPosition < maxScroll)
      ) {
        window.scrollTo({
          top: newPosition,
          behavior: 'auto'
        });
        scrollAnimationRef.current = requestAnimationFrame(scroll);
      } else {
        setIsScrolling(false);
        scrollAnimationRef.current = null;
      }
    };
    
    scrollAnimationRef.current = requestAnimationFrame(scroll);
  }, [isScrolling]);

  const stopAutoScroll = useCallback(() => {
    setIsScrolling(false);
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    });
  };

  const handleButtonPress = useCallback((direction: 'up' | 'down') => {
    const scrollAmount = window.innerHeight * 0.8;
    window.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    const timer = setTimeout(() => {
      startAutoScroll(direction);
    }, 300);
    
    setLongPressTimer(timer);
  }, [startAutoScroll]);

  const handleButtonRelease = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <AnimatePresence>
      {showButtons && (
        <motion.div
          ref={navigatorRef}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.9, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed right-6 bottom-32 z-50 touch-none select-none"
          drag
          dragConstraints={{ 
            left: -100, 
            right: 50, 
            top: -300, 
            bottom: 300 
          }}
          dragElastic={0.2}
          whileHover={{ scale: 1.05 }}
          whileDrag={{ scale: 1.1, rotate: 2 }}
        >
          {/* Main circular container */}
          <div className="relative w-14 h-14 rounded-full backdrop-blur-lg bg-white/20 dark:bg-black/30 border border-white/30 dark:border-gray-600/40 shadow-xl overflow-hidden">
            
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300/30 dark:text-gray-600/30"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-blue-500 dark:text-blue-400 transition-all duration-300"
                style={{
                  strokeDasharray: `${2 * Math.PI * 24}`,
                  strokeDashoffset: `${2 * Math.PI * 24 * (1 - scrollProgress / 100)}`
                }}
              />
            </svg>

            {/* Button container */}
            <div className="absolute inset-1 flex flex-col rounded-full">
              
              {/* Up button - top half */}
              <button
                onMouseDown={() => handleButtonPress('up')}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonPress('up');
                }}
                onTouchEnd={handleButtonRelease}
                onDoubleClick={scrollToTop}
                disabled={isAtTop}
                className={`
                  flex-1 flex items-end justify-center pb-1 transition-all duration-200 rounded-t-full
                  ${isAtTop 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10'
                  }
                `}
                aria-label="Scroll up"
              >
                {isScrolling ? (
                  <ArrowUp size={11} className="animate-bounce" />
                ) : (
                  <ChevronUp size={11} />
                )}
              </button>
              
              {/* Divider */}
              <div className="h-px bg-gray-300/30 dark:bg-gray-600/30 mx-3"></div>
              
              {/* Down button - bottom half */}
              <button
                onMouseDown={() => handleButtonPress('down')}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonPress('down');
                }}
                onTouchEnd={handleButtonRelease}
                onDoubleClick={scrollToBottom}
                disabled={isAtBottom}
                className={`
                  flex-1 flex items-start justify-center pt-1 transition-all duration-200 rounded-b-full
                  ${isAtBottom 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10'
                  }
                `}
                aria-label="Scroll down"
              >
                {isScrolling ? (
                  <ArrowDown size={11} className="animate-bounce" />
                ) : (
                  <ChevronDown size={11} />
                )}
              </button>
            </div>

            {/* Center dot indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400/50 rounded-full"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;