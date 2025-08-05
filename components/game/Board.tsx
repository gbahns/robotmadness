// components/game/Board.tsx
import React from 'react';
import { Board as BoardType, Player, Direction, Position } from '@/lib/game/types';
import Robot from './Robot';

interface BoardProps {
  board: BoardType;
  players: Record<string, Player>;
  currentPlayerId?: string;
}

// These interfaces will be used when you add enhanced board features
interface TileElement {
  type: 'conveyor' | 'conveyor_express' | 'gear' | 'pusher' | 'repair' | 'pit';
  position: { x: number; y: number };
  direction?: number;
  rotate?: 'clockwise' | 'counterclockwise';
  registers?: number[];
  walls?: number[];
}

interface Checkpoint {
  position: { x: number; y: number };
  number: number;
}

interface Laser {
  position: { x: number; y: number };
  direction: number;
  damage: number;
}

const TILE_SIZE = 60; // Increased from 48 to 60
const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, currentPlayerId }: BoardProps) {
  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Waiting for game to start...</p>
      </div>
    );
  }

  // Get player index for color assignment
  const getPlayerIndex = (playerId: string): number => {
    return Object.keys(players).indexOf(playerId);
  };

  // Get tile element at position (for future enhanced boards)
  const getTileAt = (x: number, y: number): TileElement | undefined => {
    // Check if board has the enhanced tiles array
    if (board.tiles && Array.isArray(board.tiles) && board.tiles.length > 0) {
      // Check if it's a flat array of tile elements (enhanced board)
      if ('position' in board.tiles[0]) {
        return (board.tiles as any[]).find(
          (tile: any) => tile.position?.x === x && tile.position?.y === y
        );
      }
    }
    return undefined;
  };

  // Get laser at position (for enhanced boards)
  const getLaserAt = (x: number, y: number): Laser | undefined => {
    // if (board.lasers && Array.isArray(board.lasers)) {
    //     return (board.lasers as any[]).find((laser: any) => laser.position?.x === x && laser.position?.y === y);
    // }
    return undefined;
  };

  // Get the visual representation of a tile
  const getTileContent = (x: number, y: number): React.ReactElement[] => {
    const tile = getTileAt(x, y);
    const elements: React.ReactElement[] = [];

    // Base tile
    elements.push(
      <div key="base" className="absolute inset-0 border border-gray-600 bg-gray-800" />
    );

    // Add tile-specific elements when tiles are implemented
    if (tile) {
      // Conveyor belts
      if (tile.type === 'conveyor' || tile.type === 'conveyor_express') {
        const isExpress = tile.type === 'conveyor_express';
        const color = isExpress ? 'bg-yellow-600' : 'bg-yellow-800';
        const arrowRotation = (tile.direction || 0) * 90;

        elements.push(
          <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
            <svg
              className="w-8 h-8 text-gray-900"
              style={{ transform: `rotate(${arrowRotation}deg)` }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
            {tile.rotate && (
              <div className="absolute bottom-0 right-0 text-xs text-gray-900 p-0.5">
                {tile.rotate === 'clockwise' ? '↻' : '↺'}
              </div>
            )}
          </div>
        );
      }

      // Other tile types can be added here...
    }

    // Checkpoints
    const checkpoint = board.checkpoints?.find(
      (cp: Checkpoint) => cp.position.x === x && cp.position.y === y
    );
    if (checkpoint) {
      elements.push(
        <div key="checkpoint" className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black font-bold text-xl border-4 border-black">
            {checkpoint.number}
          </div>
        </div>
      );
    }

    // Starting positions (if no checkpoint there)
    if (!checkpoint) {
      const isStart = board.startingPositions.some(
        sp => sp.position.x === x && sp.position.y === y
      );
      if (isStart) {
        elements.push(
          <div key="start" className="absolute inset-0 bg-green-800 opacity-50" />
        );
      }
    }

    // Lasers (when implemented)
    const laser = getLaserAt(x, y);
    if (laser) {
      const rotation = laser.direction * 90;
      const color = laser.damage > 1 ? 'text-red-400' : 'text-red-600';
      elements.push(
        <div key="laser" className="absolute inset-0 flex items-center justify-center">
          <div
            style={{ transform: `rotate(${rotation}deg)` }}
            className={`text-3xl ${color}`}
          >
            ⚡
          </div>
        </div>
      );
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
              size={48} // Increased from 36
            />
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Board grid - removed all padding and containers */}
      <div
        className="relative bg-gray-900"
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

      {/* Current phase indicator */}
      {/* @ts-ignore - gameState might be passed through parent */}
      {(board as any).phase === 'executing' && (
        <div className="mt-4 p-2 bg-yellow-600 text-black rounded">
          Executing Register {((board as any).currentRegister || 0) + 1} of 5
        </div>
      )}
    </div>
  );
}