import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown, Move } from 'lucide-react';

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-50, 0, 50], [0.3, 1, 0.3]);
  const scrollAnimationRef = useRef(null);

  const updateScrollState = useCallback(() => {
    const position = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (position / maxScroll) * 100 : 0;
    setShowButtons(position > 100);
    setScrollProgress(progress);
    setIsAtTop(position < 10);
    setIsAtBottom(position >= maxScroll - 10);
  }, []);

  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollState, 16);
    };
    window.addEventListener('scroll', handleScroll);
    updateScrollState();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [updateScrollState]);

  const startAutoScroll = useCallback((direction) => {
    if (isScrolling) return;
    setIsScrolling(true);
    let startTime = null;
    let speed = 3;
    const scroll = (timestamp) => {
      if (!isScrolling) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      speed = Math.min(3 + (elapsed / 1000) * 2, 20);
      const current = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const step = direction === 'up' ? -speed : speed;
      const next = current + step;
      if ((direction === 'up' && next > 0) || (direction === 'down' && next < maxScroll)) {
        window.scrollTo({ top: next, behavior: 'auto' });
        scrollAnimationRef.current = requestAnimationFrame(scroll);
      } else {
        setIsScrolling(false);
      }
    };
    scrollAnimationRef.current = requestAnimationFrame(scroll);
  }, [isScrolling]);

  const stopAutoScroll = useCallback(() => {
    setIsScrolling(false);
    if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
    if (longPressTimer) clearTimeout(longPressTimer);
    scrollAnimationRef.current = null;
    setLongPressTimer(null);
  }, [longPressTimer]);

  const handleButtonPress = useCallback((direction) => {
    const scrollAmount = window.innerHeight * 0.8;
    window.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    const timer = setTimeout(() => startAutoScroll(direction), 300);
    setLongPressTimer(timer);
  }, [startAutoScroll]);

  const handleButtonRelease = useCallback(() => stopAutoScroll(), [stopAutoScroll]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {showButtons && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          style={{ x, y, opacity }}
          className="fixed right-6 bottom-28 z-50"
          drag
          dragConstraints={{ top: -200, bottom: 200, left: -80, right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/80 to-blue-700/80 shadow-2xl backdrop-blur-lg border border-white/30">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" strokeWidth="3" className="text-white/20" fill="none" stroke="currentColor" />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-white"
                fill="none"
                style={{
                  strokeDasharray: `${2 * Math.PI * 28}`,
                  strokeDashoffset: `${2 * Math.PI * 28 * (1 - scrollProgress / 100)}`
                }}
              />
            </svg>
            <div className="absolute inset-2 flex flex-col rounded-full">
              <button
                className={`flex-1 flex items-center justify-center rounded-t-full transition-colors duration-200 ${isAtTop ? 'text-gray-300 cursor-not-allowed' : 'hover:text-white text-white'}`}
                onMouseDown={() => handleButtonPress('up')}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={(e) => { e.preventDefault(); handleButtonPress('up'); }}
                onTouchEnd={handleButtonRelease}
                onDoubleClick={scrollToTop}
                aria-label="Scroll Up"
              >
                {isScrolling ? <ArrowUp size={16} className="animate-bounce" /> : <ChevronUp size={16} />}
              </button>
              <div className="h-px bg-white/20 mx-2"></div>
              <button
                className={`flex-1 flex items-center justify-center rounded-b-full transition-colors duration-200 ${isAtBottom ? 'text-gray-300 cursor-not-allowed' : 'hover:text-white text-white'}`}
                onMouseDown={() => handleButtonPress('down')}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={(e) => { e.preventDefault(); handleButtonPress('down'); }}
                onTouchEnd={handleButtonRelease}
                onDoubleClick={scrollToBottom}
                aria-label="Scroll Down"
              >
                {isScrolling ? <ArrowDown size={16} className="animate-bounce" /> : <ChevronDown size={16} />}
              </button>
            </div>
            {isDragging && (
              <motion.div className="absolute top-1 left-1 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Move size={12} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigator;
