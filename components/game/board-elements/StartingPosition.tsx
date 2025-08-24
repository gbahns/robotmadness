import React from 'react';

interface StartingPositionProps {
  number: number;
  tileSize: number;
}

export default function StartingPosition({ number, tileSize }: StartingPositionProps) {
  const fontSize = tileSize * 0.3;
  
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-green-600 opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="bg-white text-black font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-green-600"
          style={{
            width: tileSize * 0.6,
            height: tileSize * 0.6,
            fontSize: fontSize
          }}
        >
          {number}
        </div>
      </div>
    </div>
  );
}