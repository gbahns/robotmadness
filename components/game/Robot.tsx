// components/game/Robot.tsx

import React from 'react';
import { Player, Direction } from '@/lib/game/types';

interface RobotProps {
  player: Player;
  color: string;
  isCurrentPlayer: boolean;
  size?: number;
}

export default function Robot({ player, color, isCurrentPlayer, size = 40 }: RobotProps) {
  const getRotation = (direction: Direction): number => {
    return direction * 90;
  };

  return (
    <div
      className={`absolute flex items-center justify-center transition-all duration-500 ${
        isCurrentPlayer ? 'z-20' : 'z-10'
      }`}
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%)`,
      }}
    >
      {/* Robot body */}
      <div
        className={`relative w-full h-full rounded-lg shadow-lg transition-transform duration-300 ${
          player.isDisconnected ? 'opacity-50' : ''
        }`}
        style={{
          backgroundColor: color,
          transform: `rotate(${getRotation(player.direction)}deg)`,
          border: isCurrentPlayer ? '3px solid white' : '2px solid rgba(0,0,0,0.3)',
        }}
      >
        {/* Direction indicator */}
        <div
          className="absolute top-0 left-1/2 w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '12px solid rgba(255,255,255,0.8)',
            transform: 'translate(-50%, -2px)',
          }}
        />
        
        {/* Robot number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg drop-shadow-lg">
            {player.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Health indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        {Array.from({ length: player.lives }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-red-500 rounded-full border border-white"
          />
        ))}
      </div>
      
      {/* Damage indicator */}
      {player.damage > 0 && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white">
          {player.damage}
        </div>
      )}
    </div>
  );
}
