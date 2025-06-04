import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const durations = [
  { value: '1 day', label: '24h' },
  { value: '3 days', label: '3d' },
  { value: '7 days', label: '1w' },
  { value: '14 days', label: '2w' },
  { value: '30 days', label: '1m' }
];

const DurationFilter = () => {
  const { user, updateDurationFilter } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState('7 days');

  const handleDurationChange = async (duration: string) => {
    setSelectedDuration(duration);
    if (user) {
      await updateDurationFilter(duration);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2">
        {durations.map((duration) => (
          <motion.button
            key={duration.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDurationChange(duration.value)}
            className={`relative flex-1 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedDuration === duration.value
                ? 'glass-card shadow-lg text-primary dark:text-primary-dark'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {selectedDuration === duration.value && (
              <motion.div
                layoutId="duration-active"
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary-dark/10 dark:to-accent-dark/10 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 w-full h-full flex items-center justify-center">
              {duration.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DurationFilter;