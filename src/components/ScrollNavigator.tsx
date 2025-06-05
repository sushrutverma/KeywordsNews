import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

const ScrollNavigator = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const scrollAnimationRef = useRef<number | null>(null);

  // Motion values for vertical dragging
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.9, 0.3, 0.9]);
  const scale = useTransform(y, [-50, 0, 50], [1.1, 1, 1.1]);

  // Update scroll state
  const updateScrollState = useCallback(() => {
    const position = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (position / maxScroll) * 100 : 0;
    
    setScrollProgress(progress);
    setIsAtTop(position < 10);
    setIsAtBottom(position >= maxScroll - 10);
  }, []);

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

  // Auto-scroll functionality
  const startAutoScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    setScrollDirection(direction);
    let startTime: number | null = null;
    const baseSpeed = 4;
    let currentSpeed = baseSpeed;
    
    const scroll = (timestamp: number) => {
      if (!isScrolling) return;
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      currentSpeed = Math.min(baseSpeed + (elapsed / 1000) * 3, 20);
      
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
        setScrollDirection(null);
        scrollAnimationRef.current = null;
      }
    };
    
    scrollAnimationRef.current = requestAnimationFrame(scroll);
  }, [isScrolling]);

  const stopAutoScroll = useCallback(() => {
    setIsScrolling(false);
    setScrollDirection(null);
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Navigation functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    });
  };

  const handleSingleTap = () => {
    const scrollAmount = window.innerHeight * 0.8;
    
    if (scrollProgress < 50) {
      // Scroll down if in upper half
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
    } else {
      // Scroll up if in lower half
      window.scrollBy({
        top: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleLongPress = () => {
    if (scrollProgress < 50) {
      startAutoScroll('down');
    } else {
      startAutoScroll('up');
    }
  };

  // Touch and mouse handlers
  const handleTouchStart = useCallback(() => {
    setIsTouched(true);
    const timer = setTimeout(handleLongPress, 500);
    setLongPressTimer(timer);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTouched(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      if (!isScrolling) {
        handleSingleTap();
      }
      setLongPressTimer(null);
    }
    stopAutoScroll();
  }, [longPressTimer, isScrolling]);

  // Drag handlers
  const handleDragStart = () => {
    setIsDragging(true);
    setIsTouched(true);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDrag = (event: any, info: any) => {
    const dragY = info.offset.y;
    
    // Determine scroll direction based on drag (inverted)
    if (Math.abs(dragY) > 10) {
      const scrollSpeed = Math.abs(dragY) * 0.5;
      const direction = dragY > 0 ? 'up' : 'down'; // Inverted: drag down = scroll up
      
      window.scrollBy({
        top: direction === 'up' ? -scrollSpeed : scrollSpeed,
        behavior: 'auto'
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsTouched(false);
    
    // Animate back to center
    y.set(0);
  };

  // Double tap handler
  const handleDoubleClick = () => {
    if (scrollProgress < 50) {
      scrollToBottom();
    } else {
      scrollToTop();
    }
  };

  // Auto-hide touch state
  useEffect(() => {
    if (isTouched || isDragging) {
      const timer = setTimeout(() => {
        if (!isDragging) {
          setIsTouched(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTouched, isDragging]);

  // Cleanup
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

  const currentOpacity = isTouched || isDragging ? 0.9 : 0.2;

  return (
    <motion.div
      initial={{ opacity: 0.2, x: 20 }}
      animate={{ opacity: currentOpacity, x: 0 }}
      style={{ 
        y,
        opacity: isDragging ? opacity : currentOpacity,
        scale: isDragging ? scale : 1
      }}
      className="fixed right-3 top-1/2 transform -translate-y-1/2 z-50 touch-none select-none cursor-grab active:cursor-grabbing"
      drag="y"
      dragConstraints={{ top: -150, bottom: 150 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      whileHover={{ opacity: 0.8, scale: 1.05 }}
      transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.2 } }}
    >
      {/* Main container */}
      <div className="relative w-12 h-20 rounded-full backdrop-blur-md bg-gradient-to-b from-white/10 to-black/10 dark:from-black/20 dark:to-white/10 border border-white/20 dark:border-gray-600/30 shadow-2xl overflow-hidden">
        
        {/* Progress indicator */}
        <div className="absolute left-1 top-2 bottom-2 w-1 bg-gray-300/20 dark:bg-gray-600/20 rounded-full overflow-hidden">
          <motion.div
            className="w-full bg-blue-500 dark:bg-blue-400 rounded-full"
            style={{ height: `${scrollProgress}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          />
        </div>

        {/* Content area */}
        <div className="absolute inset-2 flex flex-col items-center justify-center">
          
          {/* Direction indicator */}
          <div className="flex flex-col items-center justify-center h-full">
            {isScrolling && scrollDirection === 'up' && (
              <ArrowUp size={14} className="text-blue-500 animate-bounce mb-1" />
            )}
            
            {scrollProgress < 50 ? (
              <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronUp size={16} className="text-gray-600 dark:text-gray-400" />
            )}
            
            {isScrolling && scrollDirection === 'down' && (
              <ArrowDown size={14} className="text-blue-500 animate-bounce mt-1" />
            )}
          </div>

          {/* Status dots */}
          <div className="absolute bottom-1 flex gap-1">
            <div className={`w-1 h-1 rounded-full transition-colors duration-200 ${isAtTop ? 'bg-green-500' : 'bg-gray-400/50'}`}></div>
            <div className={`w-1 h-1 rounded-full transition-colors duration-200 ${isAtBottom ? 'bg-red-500' : 'bg-gray-400/50'}`}></div>
          </div>
        </div>

        {/* Drag indicator */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap pointer-events-none"
          >
            Drag to scroll
          </motion.div>
        )}

        {/* Touch hint */}
        {isTouched && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap pointer-events-none"
          >
            Hold or double-tap
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ScrollNavigator;