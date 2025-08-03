// File: /components/game/Board.tsx

import React from 'react';
import { Board as BoardType, Player, Checkpoint, TileType, Direction } from '@/lib/game/types';
import Robot from './Robot';

interface BoardProps {
  board: BoardType;
  players: Record<string, Player>;
  currentPlayerId: string;
}

const TILE_SIZE = 50;
const ROBOT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FD79A8', '#FDCB6E', '#6C5CE7', '#A29BFE', '#74B9FF'];

export default function Board({ board, players, currentPlayerId }: BoardProps) {
  // Get player index for consistent colors
  const getPlayerIndex = (playerId: string) => {
    return Object.keys(players).findIndex(id => id === playerId);
  };

  // Get laser positions (placeholder for now)
  const getLaserAt = (x: number, y: number) => {
    // This will be implemented when we add laser tiles
    return null;
  };

  // Render tile content
  const getTileContent = (x: number, y: number) => {
    const elements: React.ReactElement[] = [];

    // Base tile background
    elements.push(
      <div key="base" className="absolute inset-0 bg-gray-800 border border-gray-700" />
    );

    // Get tile type if there's special tile data
    const tile = board.tiles?.[y]?.[x];
    if (tile) {
      // Render based on tile type
      if (tile.type === TileType.PIT) {
        elements.push(
          <div key="pit" className="absolute inset-1 bg-black rounded-full" />
        );
      } else if (tile.type === TileType.REPAIR) {
        elements.push(
          <div key="repair" className="absolute inset-0 bg-green-900 flex items-center justify-center">
            <span className="text-2xl">🔧</span>
          </div>
        );
      } else if (tile.type === TileType.CONVEYOR || tile.type === TileType.EXPRESS_CONVEYOR) {
        const color = tile.type === TileType.EXPRESS_CONVEYOR ? 'bg-yellow-600' : 'bg-yellow-800';
        const arrowRotation = 0; // Will be based on tile direction when implemented

        elements.push(
          <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
            <svg
              className="w-6 h-6 text-gray-900"
              style={{ transform: `rotate(${arrowRotation}deg)` }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
          </div>
        );
      }

      // Walls
      if (tile.walls && tile.walls.length > 0) {
        tile.walls.forEach((wallDir) => {
          const wallStyles: Record<Direction, string> = {
            [Direction.UP]: 'top-0 left-0 right-0 h-1',
            [Direction.RIGHT]: 'top-0 right-0 bottom-0 w-1',
            [Direction.DOWN]: 'bottom-0 left-0 right-0 h-1',
            [Direction.LEFT]: 'top-0 left-0 bottom-0 w-1',
          };
          elements.push(
            <div
              key={`wall-${wallDir}`}
              className={`absolute bg-red-600 ${wallStyles[wallDir]}`}
            />
          );
        });
      }
    }

    // Checkpoints
    const checkpoint = board.checkpoints?.find(
      (cp: Checkpoint) => cp.position.x === x && cp.position.y === y
    );
    if (checkpoint) {
      elements.push(
        <div key="checkpoint" className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-lg border-4 border-black shadow-lg">
            {checkpoint.number}
          </div>
        </div>
      );
    }

    // Starting positions (if no checkpoint there)
    if (!checkpoint) {
      const isStart = board.startingPositions?.some(
        sp => sp.position.x === x && sp.position.y === y
      );
      if (isStart) {
        elements.push(
          <div key="start" className="absolute inset-0 bg-green-800 opacity-50" />
        );
      }
    }

    // Players
    Object.values(players).forEach((player: Player) => {
      if (player.position.x === x && player.position.y === y && player.lives > 0) {
        const isCurrentPlayer = player.id === currentPlayerId;
        elements.push(
          <div key={player.id} className="absolute inset-1">
            <Robot
              player={player}
              color={ROBOT_COLORS[getPlayerIndex(player.id) % ROBOT_COLORS.length]}
              isCurrentPlayer={isCurrentPlayer}
              size={36}
            />
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold mb-4">Game Board</h2>

      {/* Board grid */}
      <div
        className="relative bg-gray-900 border-4 border-gray-700 shadow-2xl"
        style={{
          width: board.width * TILE_SIZE,
          height: board.height * TILE_SIZE
        }}
      >
        {Array.from({ length: board.height }, (_, y) => (
          Array.from({ length: board.width }, (_, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute"
              style={{
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE
              }}
            >
              {getTileContent(x, y)}
            </div>
          ))
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-2">Legend:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-full border-2 border-black" />
            <span>Checkpoint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-800" />
            <span>Starting Position</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <span>Repair Site</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded-full" />
            <span>Pit</span>
          </div>
        </div>
      </div>
    </div>
  );
}