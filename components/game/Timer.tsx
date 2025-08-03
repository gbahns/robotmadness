import React from 'react';

interface TimerProps {
    timeLeft: number;
    totalTime: number;
}

export default function Timer({ timeLeft, totalTime }: TimerProps) {
    const percentage = (timeLeft / totalTime) * 100;
    const isLowTime = timeLeft <= 10;

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-40 bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                    className={`
            h-full rounded-full transition-all duration-300
            ${isLowTime ? 'bg-red-500' : 'bg-green-500'}
          `}
                    style={{ width: `${percentage}%` }}
                />
                {isLowTime && (
                    <div className="absolute inset-0 bg-red-500 opacity-50 animate-pulse" />
                )}
            </div>
            <span className={`text-sm font-mono ${isLowTime ? 'text-red-400 animate-pulse' : ''}`}>
                {timeLeft}s
            </span>
        </div>
    );
}