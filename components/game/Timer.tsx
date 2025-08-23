import React, { useEffect, useState } from 'react';

interface TimerProps {
  timeLeft: number; // in seconds
  isActive: boolean;
}

export default function Timer({ timeLeft, isActive }: TimerProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (displayTime <= 5) return 'text-red-500';
    if (displayTime <= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Format time display
  const formatTime = () => {
    const minutes = Math.floor(displayTime / 60);
    const seconds = displayTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time Remaining:</span>
          <span className={`text-xl font-bold font-mono ${getTimerColor()}`}>
            {formatTime()}
          </span>
        </div>
      </div>
      {displayTime <= 10 && (
        <div className="mt-2 text-xs text-yellow-400">
          Hurry! Cards will be auto-selected when time runs out.
        </div>
      )}
    </div>
  );
}