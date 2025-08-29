import React from 'react';
import { Direction } from '@/lib/game/types';

interface WallProps {
  directions: number[];
  tileSize: number;
}

export default function Wall({ directions, tileSize }: WallProps) {
  const wallThickness = Math.max(6, tileSize * 0.12); // Thicker walls
  const wallColor = '#92400e'; // Brown (amber-800)
  const wallBorder = '#451a03'; // Dark brown (amber-950)
  const wallHighlight = '#b45309'; // Lighter brown for texture (amber-700)

  const getWallStyle = (direction: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: wallColor,
      borderColor: wallBorder,
      borderStyle: 'solid',
      zIndex: 20, // Above tiles and laser beams, but below robots
      backgroundImage: `
        repeating-linear-gradient(
          45deg,
          ${wallColor},
          ${wallColor} 2px,
          ${wallHighlight} 2px,
          ${wallHighlight} 3px
        )
      `,
    };

    switch (direction) {
      case Direction.UP:
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: `${wallThickness}px`,
          borderWidth: '1px 0 1px 0',
        };
      case Direction.RIGHT:
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${wallThickness}px`,
          borderWidth: '0 1px 0 1px',
        };
      case Direction.DOWN:
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: `${wallThickness}px`,
          borderWidth: '1px 0 1px 0',
        };
      case Direction.LEFT:
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          bottom: 0,
          width: `${wallThickness}px`,
          borderWidth: '0 1px 0 1px',
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