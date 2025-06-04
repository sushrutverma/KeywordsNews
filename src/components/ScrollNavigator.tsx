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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const navigatorRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Motion values for dragging with constraints
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-50, 0, 50], [0.4, 0.9, 0.4]);

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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    
    // Snap back to bounds if dragged too far
    const bounds = {
      left: -80,
      right: 0,
      top: -200,
      bottom: 200
    };
    
    // Get current position
    const currentX = info.point.x - info.offset.x;
    const currentY = info.point.y - info.offset.y;
    
    // Reset motion values smoothly
    x.set(0);
    y.set(0);
    
    // Update position state to keep track
    setPosition({ x: Math.max(bounds.left, Math.min(bounds.right, currentX)), y: Math.max(bounds.top, Math.min(bounds.bottom, currentY)) });
  };

  const handleDrag = (event: any, info: any) => {
    // Only scroll if dragging vertically with some threshold
    if (Math.abs(info.velocity.y) > Math.abs(info.velocity.x) && Math.abs(info.velocity.y) > 100) {
      const scrollSpeed = info.velocity.y * 0.2;
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'auto'
      });
    }
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
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
          style={{ 
            opacity,
            x,
            y
          }}
          className="fixed right-6 bottom-32 z-50 touch-none select-none cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ 
            left: -80, 
            right: 0, 
            top: -200, 
            bottom: 200 
          }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
          whileHover={{ scale: 1.1 }}
          whileDrag={{ scale: 1.05, rotate: 5 }}
        >
          {/* Main circular container */}
          <div className="relative w-16 h-16 rounded-full backdrop-blur-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-gray-600/30 shadow-2xl overflow-hidden">
            
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300/30 dark:text-gray-600/30"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-blue-500 dark:text-blue-400"
                style={{
                  strokeDasharray: `${2 * Math.PI * 28}`,
                  strokeDashoffset: `${2 * Math.PI * 28 * (1 - scrollProgress / 100)}`
                }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              />
            </svg>

            {/* Button container */}
            <div className="absolute inset-2 flex flex-col rounded-full overflow-hidden">
              
              {/* Up button - top half */}
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
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                disabled={isAtTop}
                className={`
                  flex-1 flex items-center justify-center transition-all duration-200 rounded-t-full
                  ${isAtTop 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                  }
                `}
                aria-label="Scroll up"
              >
                {isScrolling && !isDragging ? (
                  <ArrowUp size={12} className="animate-bounce" />
                ) : (
                  <ChevronUp size={12} />
                )}
              </motion.button>
              
              {/* Divider */}
              <div className="h-px bg-gray-300/20 dark:bg-gray-600/20 mx-2"></div>
              
              {/* Down button - bottom half */}
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
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                disabled={isAtBottom}
                className={`
                  flex-1 flex items-center justify-center transition-all duration-200 rounded-b-full
                  ${isAtBottom 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                  }
                `}
                aria-label="Scroll down"
              >
                {isScrolling && !isDragging ? (
                  <ArrowDown size={12} className="animate-bounce" />
                ) : (
                  <ChevronDown size={12} />
                )}
              </motion.button>
            </div>

            {/* Drag indicator dot */}
            {isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
          </div>

          {/* Floating tooltip */}
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap pointer-events-none"
            >
              Drag to move
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;