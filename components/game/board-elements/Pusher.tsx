import React from 'react';

interface PusherProps {
  direction: number;
  registers?: number[];
  tileSize: number;
}

export default function Pusher({ direction, registers, tileSize }: PusherProps) {
  const fontSize = Math.max(10, tileSize * 0.18);
  
  // Position the register box on the edge based on push direction
  // Matches the game's Board.tsx positioning exactly
  const getBoxStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      fontSize: `${fontSize}px`,
    };
    
    switch (direction) {
      case 0: // UP - bar at bottom
        return {
          ...baseStyle,
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 1: // RIGHT - bar at left edge, rotated CCW
        return {
          ...baseStyle,
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
        };
      case 2: // DOWN - bar at top
        return {
          ...baseStyle,
          top: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 3: // LEFT - bar at right edge, rotated CW
        return {
          ...baseStyle,
          right: '0px',
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <div className="absolute inset-0">
      {/* Register indicators in dark gray box on the edge */}
      {registers && registers.length > 0 && (
        <div
          className="bg-gray-700 bg-opacity-90 px-2 py-1 rounded flex items-center justify-center"
          style={getBoxStyle()}
        >
          <span className="text-yellow-400 font-bold">
            {registers.join(',')}
          </span>
        </div>
      )}
    </div>
  );
}