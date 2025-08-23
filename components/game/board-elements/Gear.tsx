import React from 'react';

interface GearProps {
  type: 'gear_cw' | 'gear_ccw';
  tileSize: number;
}

export default function Gear({ type, tileSize }: GearProps) {
  const isClockwise = type === 'gear_cw';
  const fontSize = tileSize * 0.3;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="text-gray-300"
        style={{
          fontSize: `${tileSize * 0.95}px`,
          transform: `rotate(${isClockwise ? '0deg' : '180deg'})`,
          textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black'
        }}
      >
        ⚙
      </div>
      <div
        className="absolute font-black"
        style={{
          fontSize: `${fontSize * 1.5}px`,
          color: isClockwise ? '#166534' : '#991b1b'
        }}
      >
        {isClockwise ? '↻' : '↺'}
      </div>
    </div>
  );
}