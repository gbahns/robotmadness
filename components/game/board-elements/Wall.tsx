import React from 'react';
import { Direction } from '@/lib/game/types';

interface WallProps {
  directions: number[];
  tileSize: number;
}

export default function Wall({ directions, tileSize }: WallProps) {
  const wallThickness = Math.max(4, tileSize * 0.08);
  const wallColor = '#facc15'; // yellow-400

  const getWallStyle = (direction: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: wallColor,
      zIndex: 20, // Above tiles and laser beams, but below robots
    };

    switch (direction) {
      case Direction.UP:
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: `${wallThickness}px`,
        };
      case Direction.RIGHT:
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${wallThickness}px`,
        };
      case Direction.DOWN:
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: `${wallThickness}px`,
        };
      case Direction.LEFT:
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          bottom: 0,
          width: `${wallThickness}px`,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <>
      {directions.map((direction, index) => (
        <div key={`wall-${direction}-${index}`} style={getWallStyle(direction)} />
      ))}
    </>
  );
}