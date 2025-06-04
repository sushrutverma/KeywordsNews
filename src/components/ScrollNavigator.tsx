import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mouse, ChevronUp, ChevronDown } from 'lucide-react';

const MouseScrollNavigator = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('');
  const [showFeedback, setShowFeedback] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);
  const scrollIntervalRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const wheelRef = useRef(null);

  const showFeedbackMessage = useCallback((message) => {
    setShowFeedback(message);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback('');
    }, 1200);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showFeedbackMessage('🔝 Top');
  }, [showFeedbackMessage]);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    showFeedbackMessage('🔻 Bottom');
  }, [showFeedbackMessage]);

  const pageJump = useCallback((direction) => {
    const jumpAmount = window.innerHeight * 0.8;
    const scrollAmount = direction === 'up' ? -jumpAmount : jumpAmount;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    showFeedbackMessage(direction === 'up' ? '⬆️ Page Up' : '⬇️ Page Down');
  }, [showFeedbackMessage]);

  const startContinuousScroll = useCallback((direction) => {
    if (scrollIntervalRef.current) return;
    
    setIsScrolling(true);
    setScrollDirection(direction);
    const scrollAmount = direction === 'up' ? -12 : 12;
    
    const scroll = () => {
      window.scrollBy({ top: scrollAmount, behavior: 'auto' });
    };
    
    scroll();
    scrollIntervalRef.current = setInterval(scroll, 20); // Smooth scrolling
  }, []);

  const stopContinuousScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
    setScrollDirection('');
  }, []);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    const delta = event.deltaY;
    const direction = delta > 0 ? 'down' : 'up';
    const intensity = Math.min(Math.abs(delta), 100);
    
    // Rotate wheel visual feedback
    setWheelRotation(prev => prev + (delta > 0 ? 30 : -30));
    
    // Determine scroll type based on wheel speed/intensity
    if (intensity > 50) {
      // Fast scroll - page jump
      pageJump(direction);
    } else {
      // Slow scroll - smooth scroll
      const scrollAmount = direction === 'up' ? -intensity * 0.8 : intensity * 0.8;
      window.scrollBy({ top: scrollAmount, behavior: 'auto' });
      showFeedbackMessage(direction === 'up' ? '↑' : '↓');
    }
  }, [pageJump, showFeedbackMessage]);

  const handleClick = useCallback((event) => {
    event.preventDefault();
    
    if (event.detail === 1) {
      // Single click - page down
      pageJump('down');
    } else if (event.detail === 2) {
      // Double click - scroll to top
      scrollToTop();
    } else if (event.detail === 3) {
      // Triple click - scroll to bottom
      scrollToBottom();
    }
  }, [pageJump, scrollToTop, scrollToBottom]);

  const handleMouseDown = useCallback((event) => {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      scrollToTop();
    }
  }, [scrollToTop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-[1000] select-none">
      {/* Feedback Message */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap backdrop-blur-sm border border-gray-700"
        >
          {showFeedback}
        </motion.div>
      )}

      {/* Instructions on hover */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-white/95 text-gray-800 px-3 py-2 rounded-lg text-xs whitespace-nowrap backdrop-blur-sm border border-gray-200 pointer-events-none"
        style={{ display: showFeedback ? 'none' : 'block' }}
      >
        <div className="space-y-1">
          <div>🖱️ <strong>Scroll:</strong> Navigate</div>
          <div>👆 <strong>Click:</strong> Page Down</div>
          <div>👆👆 <strong>Double:</strong> To Top</div>
          <div>👆👆👆 <strong>Triple:</strong> To Bottom</div>
          <div>🖱️ <strong>Middle:</strong> To Top</div>
        </div>
      </motion.div>

      {/* Mouse Scroll Button */}
      <motion.div
        ref={wheelRef}
        className={`
          w-10 h-19.2 rounded-full backdrop-blur-sm border flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer relative overflow-hidden
          ${isScrolling 
            ? 'bg-blue-500/24 border-blue-400/30 text-white/70 shadow-lg' 
            : 'bg-white/27 border-gray-300/30 text-gray-700/70 hover:bg-white/30 hover:border-gray-400/30 hover:shadow-lg'
          }
        `}
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0.8, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Mouse Scroll Navigator"
        title="Scroll to navigate • Click for page down • Double-click for top • Triple-click for bottom"
      >
        {/* Mouse Body */}
        <div className="relative">
          <Mouse size={19} strokeWidth={1.5} />
          
          {/* Scroll Wheel with Rotation Animation */}
          <motion.div
            className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 border border-current rounded-full flex items-center justify-center"
            animate={{ rotate: wheelRotation }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="w-0.5 h-1 bg-current rounded-full opacity-40" />
          </motion.div>
        </div>

        {/* Direction Indicators */}
        <div className="absolute inset-0 flex flex-col justify-between items-center py-1 pointer-events-none">
          <motion.div
            animate={{ 
              opacity: scrollDirection === 'up' ? 0.7 : 0.2,
              scale: scrollDirection === 'up' ? 1.1 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={10} strokeWidth={2} />
          </motion.div>
          
          <motion.div
            animate={{ 
              opacity: scrollDirection === 'down' ? 0.7 : 0.2,
              scale: scrollDirection === 'down' ? 1.1 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={10} strokeWidth={2} />
          </motion.div>
        </div>

        {/* Active State Glow */}
        {isScrolling && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400/10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default MouseScrollNavigator;