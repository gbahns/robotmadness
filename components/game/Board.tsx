// components/game/Board.tsx

import React from 'react';
import { Board as BoardType, Player, Direction, TileType, Position } from '@/lib/game/types';
import Robot from './Robot';

interface BoardProps {
  board: BoardType;
  players: Record<string, Player>;
  currentPlayerId?: string;
}

const TILE_SIZE = 48; // pixels
const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, currentPlayerId }: BoardProps) {
  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Waiting for game to start...</p>
      </div>
    );
  }

  const getTileClass = (tile: any, x: number, y: number): string => {
    const baseClass = 'relative border border-gray-600';
    
    // Check if this is a checkpoint
    const checkpoint = board.checkpoints.find(cp => cp.position.x === x && cp.position.y === y);
    if (checkpoint) {
      return `${baseClass} bg-yellow-600`;
    }
    
    // Check if this is a starting position
    const isStart = board.startingPositions.some(sp => sp.position.x === x && sp.position.y === y);
    if (isStart) {
      return `${baseClass} bg-green-800`;
    }
    
    // Otherwise, just empty tile
    return `${baseClass} bg-gray-700 hover:bg-gray-600`;
  };

  const getPlayerAt = (x: number, y: number): Player | undefined => {
    return Object.values(players).find(
      player => player.position.x === x && player.position.y === y
    );
  };

  const getRotationDegrees = (direction: Direction): number => {
    return direction * 90;
  };

  const getPlayerIndex = (playerId: string): number => {
    return Object.keys(players).indexOf(playerId);
  };

  return (
    <div className="inline-block bg-gray-800 p-4 rounded-lg">
      <div 
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${board.width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${board.height}, ${TILE_SIZE}px)`,
        }}
      >
        {Array.from({ length: board.height }, (_, y) => 
          Array.from({ length: board.width }, (_, x) => {
            const player = getPlayerAt(x, y);
            const checkpoint = board.checkpoints.find(cp => cp.position.x === x && cp.position.y === y);
            const isStart = board.startingPositions.some(sp => sp.position.x === x && sp.position.y === y);
            
            return (
              <div
                key={`${x}-${y}`}
                className={getTileClass(null, x, y)}
                style={{ width: TILE_SIZE, height: TILE_SIZE }}
              >
                {/* Checkpoint flag */}
                {checkpoint && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-gray-900">
                      🚩{checkpoint.number}
                    </div>
                  </div>
                )}
                
                {/* Starting position indicator */}
                {isStart && !checkpoint && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-gray-300">START</div>
                  </div>
                )}
                
                {/* Player robot */}
                {player && (
                  <Robot
                    player={player}
                    color={ROBOT_COLORS[getPlayerIndex(player.id) % ROBOT_COLORS.length]}
                    isCurrentPlayer={player.id === currentPlayerId}
                    size={36}
                  />
                )}
                
                {/* Coordinate display (for debugging) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute bottom-0 right-0 text-[8px] text-gray-500">
                    {x},{y}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600"></div>
          <span>Checkpoint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-800"></div>
          <span>Starting Position</span>
        </div>
      </div>
    </div>
  );
}
