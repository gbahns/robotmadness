import React from 'react';

interface CheckpointProps {
  number: number;
  tileSize: number;
  visitedBy?: string[]; // Player names who have visited this checkpoint
}

export default function Checkpoint({ number, tileSize, visitedBy = [] }: CheckpointProps) {
  const fontSize = tileSize * 0.3;
  const flagSize = tileSize * 0.8;
  
  // Get color based on checkpoint number
  const getCheckpointColor = (num: number) => {
    const colors = [
      'bg-red-600',    // 1
      'bg-blue-600',   // 2
      'bg-green-600',  // 3
      'bg-yellow-600', // 4
      'bg-purple-600', // 5
      'bg-pink-600',   // 6
    ];
    return colors[(num - 1) % colors.length];
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div 
        className={`${getCheckpointColor(number)} rounded-full flex items-center justify-center shadow-lg`}
        style={{ 
          width: `${flagSize}px`, 
          height: `${flagSize}px`,
          border: '2px solid #1f2937' // gray-800 border
        }}
      >
        <div className="flex flex-col items-center">
          {/* Flag icon */}
          <span style={{ fontSize: `${fontSize * 1.5}px` }}>🏁</span>
          {/* Checkpoint number */}
          <span 
            className="font-bold text-white"
            style={{ 
              fontSize: `${fontSize}px`,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {number}
          </span>
        </div>
      </div>
      
      {/* Optional: Show who has visited */}
      {visitedBy.length > 0 && (
        <div 
          className="absolute bottom-0 left-0 right-0 text-xs text-center bg-black bg-opacity-60 text-green-400 px-1"
          style={{ fontSize: `${fontSize * 0.5}px` }}
        >
          ✓ {visitedBy.join(', ')}
        </div>
      )}
    </div>
  );
}