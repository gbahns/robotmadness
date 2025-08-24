// components/game/Robot.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Player, PowerState } from '@/lib/game/types';

interface RobotProps {
  player: Player;
  color: string;
  isCurrentPlayer: boolean;
  size?: number;
}

export default function Robot({ player, color, isCurrentPlayer, size = 40 }: RobotProps) {
  const [visualRotation, setVisualRotation] = useState(player.direction * 90);
  const prevDirectionRef = useRef(player.direction);

  useEffect(() => {
    const currentDirection = player.direction;
    const prevDirection = prevDirectionRef.current;

    if (currentDirection !== prevDirection) {
      const currentRotation = visualRotation;
      const targetRotation = currentDirection * 90;

      // Calculate the difference, considering the wrap-around from 3 to 0 and 0 to 3
      let diff = targetRotation - (currentRotation % 360);
      if (diff > 180) {
        diff -= 360; // Prefer counter-clockwise rotation
      } else if (diff < -180) {
        diff += 360; // Prefer clockwise rotation
      }

      const newVisualRotation = currentRotation + diff;
      setVisualRotation(newVisualRotation);
      prevDirectionRef.current = currentDirection;
    }
  }, [player.direction, visualRotation]);

  return (
    <div
      className={`absolute flex items-center justify-center transition-all duration-500 ${isCurrentPlayer ? 'z-20' : 'z-10'}`}
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
        className={`relative w-full h-full rounded-lg shadow-lg transition-transform duration-300 ${player.isDisconnected ? 'opacity-50' : ''}`}
        style={{
          backgroundColor: color,
          transform: `rotate(${visualRotation}deg)`,
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

      {/* Powered down indicator 🛑💤*/}
      {player.powerState === PowerState.OFF && (
        <div className="absolute -top-2 -left-2 flex items-center justify-center">
          <span className="text-lg drop-shadow-lg" style={{ fontSize: `${size * 0.5}px` }}>🛑</span>
        </div>
      )}
    </div>
  );
}
