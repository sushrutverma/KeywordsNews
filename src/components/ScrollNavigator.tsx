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
  const opacity = useTransform(y, [-100, 0, 100], [0, 0, 0]); // Always invisible
  const scale = useTransform(y, [-50, 0, 50], [1, 1, 1]); // No scaling

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0 }} // Always invisible
      style={{ 
        y,
        opacity: 0, // Force invisible
        scale: 1 // No scaling
      }}
      className="fixed right-3 top-1/2 transform -translate-y-1/2 z-50 touch-none select-none cursor-default w-12 h-20"
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
    >
      {/* Invisible container - maintains hit area but shows nothing */}
      <div className="relative w-12 h-20 opacity-0">
        {/* All visual elements removed but structure maintained for functionality */}
      </div>
    </motion.div>
  );
};

