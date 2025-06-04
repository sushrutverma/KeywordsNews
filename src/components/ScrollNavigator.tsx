import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
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

  // Motion values for dragging
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.3, 0.8, 0.3]);

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
      timeoutId = setTimeout(updateScrollState, 16); // ~60fps
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState(); // Initial call
    
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
      
      // Gradually increase speed
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
          behavior: 'auto' // Use auto for smoother custom animation
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

  // Quick scroll functions
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
    // Single click scroll
    const scrollAmount = window.innerHeight * 0.8;
    window.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    // Start long press timer
    const timer = setTimeout(() => {
      startAutoScroll(direction);
    }, 300); // Reduced delay for better UX
    
    setLongPressTimer(timer);
  }, [startAutoScroll]);

  const handleButtonRelease = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    y.set(0);
  };

  const handleDrag = (event: any, info: any) => {
    const scrollSpeed = info.velocity.y * 0.3; // Reduced sensitivity
    window.scrollBy({
      top: scrollSpeed,
      behavior: 'auto'
    });
  };

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
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 0.85, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          style={{ opacity }}
          className="fixed right-4 bottom-40 z-50 touch-none select-none"
          drag
          dragConstraints={{ 
            top: -window.innerHeight / 2, 
            right: 0, 
            bottom: window.innerHeight / 2, 
            left: -100 
          }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
          whileHover={{ scale: 1.05 }}
        >
          <div className="relative flex flex-col gap-1 backdrop-blur-md rounded-2xl p-2 bg-white/20 dark:bg-black/20 border border-white/20 dark:border-gray-700/30 shadow-2xl">
            {/* Progress indicator */}
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-gray-300/30 dark:bg-gray-600/30 rounded-full overflow-hidden">
              <motion.div
                className="w-full bg-blue-500 dark:bg-blue-400 rounded-full"
                style={{ height: `${scrollProgress}%` }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              />
            </div>

            {/* Scroll to top button */}
            <motion.button
              onMouseDown={() => handleButtonPress('up')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={(e) => {
                e.preventDefault();
                handleButtonPress('up');
              }}
              onTouchEnd={handleButtonRelease}
              onDoubleClick={scrollToTop}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.8)' }}
              whileTap={{ scale: 0.95 }}
              disabled={isAtTop}
              className={`
                relative p-3 ml-2 rounded-xl transition-all duration-200
                ${isAtTop 
                  ? 'bg-gray-400/30 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-800/60 dark:bg-gray-200/60 text-white dark:text-gray-900 hover:bg-blue-500/60'
                }
                shadow-lg backdrop-blur-sm border border-white/10 dark:border-gray-600/20
              `}
              aria-label="Scroll up (hold for continuous scroll, double-click for top)"
              title="Click: Page up | Hold: Continuous scroll | Double-click: Go to top"
            >
              {isScrolling && !isDragging ? (
                <ArrowUp size={18} className="animate-bounce" />
              ) : (
                <ChevronUp size={18} />
              )}
            </motion.button>
            
            {/* Scroll to bottom button */}
            <motion.button
              onMouseDown={() => handleButtonPress('down')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={(e) => {
                e.preventDefault();
                handleButtonPress('down');
              }}
              onTouchEnd={handleButtonRelease}
              onDoubleClick={scrollToBottom}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.8)' }}
              whileTap={{ scale: 0.95 }}
              disabled={isAtBottom}
              className={`
                relative p-3 ml-2 rounded-xl transition-all duration-200
                ${isAtBottom 
                  ? 'bg-gray-400/30 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-800/60 dark:bg-gray-200/60 text-white dark:text-gray-900 hover:bg-blue-500/60'
                }
                shadow-lg backdrop-blur-sm border border-white/10 dark:border-gray-600/20
              `}
              aria-label="Scroll down (hold for continuous scroll, double-click for bottom)"
              title="Click: Page down | Hold: Continuous scroll | Double-click: Go to bottom"
            >
              {isScrolling && !isDragging ? (
                <ArrowDown size={18} className="animate-bounce" />
              ) : (
                <ChevronDown size={18} />
              )}
            </motion.button>

            {/* Drag indicator */}
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 bg-black/50 dark:bg-white/50 px-2 py-1 rounded whitespace-nowrap"
              >
                Drag to scroll
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;