// components/game/PoweredDownIndicator.tsx

import React from 'react';
import { PowerState, Player } from '@/lib/game/types';

interface PoweredDownIndicatorProps {
    powerState: PowerState;
    size?: 'small' | 'medium' | 'large';
}

export default function PoweredDownIndicator({
    powerState,
    size = 'medium'
}: PoweredDownIndicatorProps) {

    if (powerState === PowerState.ON) return null;

    const sizeClasses = {
        small: 'w-6 h-6 text-xs',
        medium: 'w-8 h-8 text-sm',
        large: 'w-12 h-12 text-base'
    };

    const iconSize = {
        small: 'w-3 h-3',
        medium: 'w-4 h-4',
        large: 'w-6 h-6'
    };

    if (powerState === PowerState.OFF) {
        return (
            <div className={`absolute top-0 right-0 ${sizeClasses[size]} 
        bg-yellow-500 rounded-full flex items-center justify-center 
        shadow-lg animate-pulse z-10`}
                title="Robot is powered down"
            >
                <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
            </div>
        );
    }

    if (powerState === PowerState.ANNOUNCING) {
        return (
            <div className={`absolute top-0 right-0 ${sizeClasses[size]} 
        bg-red-500 rounded-full flex items-center justify-center 
        shadow-lg animate-bounce z-10`}
                title="Power down announced for next turn"
            >
                <span className="font-bold text-white">!</span>
            </div>
        );
    }

    return null;
}

// Update Robot.tsx component to include this indicator
export function RobotWithPowerIndicator({
    player,
    cellSize
}: {
    player: Player;
    cellSize: number;
}) {
    const robotColors = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-orange-500'
    ];

    const directions = ['↑', '→', '↓', '←'];

    return (
        <div
            className="absolute transition-all duration-500 ease-in-out"
            style={{
                left: `${player.position.x * cellSize}px`,
                top: `${player.position.y * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
            }}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Robot body */}
                <div className={`w-3/4 h-3/4 ${robotColors[(player.startingPosition?.number || 0) % 8]} 
          rounded-lg flex items-center justify-center text-white font-bold
          ${player.powerState === PowerState.OFF ? 'opacity-50' : ''}
          ${player.isDead ? 'opacity-30' : ''}
          shadow-lg`}
                >
                    <span className="text-xl">{directions[player.direction]}</span>
                </div>

                {/* Power indicator */}
                <PoweredDownIndicator
                    powerState={player.powerState}
                    size="small"
                />

                {/* Player name */}
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 
          text-xs text-white bg-black bg-opacity-50 px-1 rounded whitespace-nowrap">
                    {player.name}
                    {player.powerState === PowerState.OFF && ' (OFF)'}
                </div>

                {/* Damage indicator */}
                {player.damage > 0 && (
                    <div className="absolute -top-2 left-0 bg-red-600 text-white 
            text-xs px-1 rounded-full">
                        {player.damage}
                    </div>
                )}
            </div>
        </div>
    );
}