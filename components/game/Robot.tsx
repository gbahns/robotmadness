import React from 'react';
import { Player, Direction } from '@/lib/game/types';

interface RobotProps {
  player: Player;
  color: string;
  isCurrentPlayer: boolean;
  size?: number;
}

const ROBOT_SYMBOLS = ['🤖', '🎮', '🚀', '🛸', '🔧', '⚡', '🎯', '🏁'];

export default function Robot({ player, color, isCurrentPlayer, size = 40 }: RobotProps) {
  const rotation = player.direction * 90;
  const symbol = ROBOT_SYMBOLS[parseInt(player.id.slice(-1), 36) % ROBOT_SYMBOLS.length];

  return (
    <div
      className={`
        flex items-center justify-center rounded-full
        ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}
        transition-all duration-300
      `}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        className="text-white font-bold flex flex-col items-center justify-center"
        style={{
          fontSize: size * 0.4,
          transform: `rotate(-${rotation}deg)`,
        }}
      >
        <span>{symbol}</span>
        {player.isPoweredDown && (
          <span className="text-xs">💤</span>
        )}
      </div>
      {/* Direction indicator */}
      <div
        className="absolute"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size * 0.15}px solid transparent`,
          borderRight: `${size * 0.15}px solid transparent`,
          borderBottom: `${size * 0.3}px solid rgba(0,0,0,0.3)`,
          top: '5%',
          transform: 'translateX(-50%)',
          left: '50%',
        }}
      />
    </div>
  );
}