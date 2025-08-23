import React from 'react';

interface PitProps {
  tileSize: number;
}

export default function Pit({ tileSize }: PitProps) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <div className="absolute inset-1 border-4 border-yellow-400 border-dashed bg-black"></div>
    </div>
  );
}