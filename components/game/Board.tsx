import React from 'react';
import { Board as BoardType, Player, Tile, TileType, Direction, Checkpoint } from '@/lib/game/types';
import Robot from './Robot';

interface BoardProps {
  board: BoardType | null;
  players: Record<string, Player>;
  currentPlayerId: string;
}

const TILE_SIZE = 50;

const ROBOT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#52C75A', // Green
  '#F39C12', // Orange
  '#E74C3C', // Crimson
];

export default function Board({ board, players, currentPlayerId }: BoardProps) {
  if (!board) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading board...</div>
      </div>
    );
  }

  // Helper function to get consistent player color
  const getPlayerIndex = (playerId: string) => {
    const playerIds = Object.keys(players).sort();
    return playerIds.indexOf(playerId);
  };

  // Function to render tile content
  const renderTileContent = (x: number, y: number) => {
    const tile: Tile = board.tiles[y]?.[x] || { type: TileType.EMPTY, walls: [] };
    const elements: React.ReactElement[] = [];

    // Base tile appearance
    let tileClass = 'border border-gray-700';

    if (tile.type === TileType.PIT) {
      tileClass += ' bg-black';
    } else if (tile.type === TileType.REPAIR) {
      tileClass += ' bg-blue-900';
    } else if (tile.type === TileType.OPTION) {
      tileClass += ' bg-purple-900';
    } else {
      tileClass += ' bg-gray-800';
    }

    // Special tile elements
    if (tile.type !== TileType.EMPTY && tile.type !== TileType.PIT) {
      // Conveyor belts
      if (tile.type === TileType.CONVEYOR || tile.type === TileType.EXPRESS_CONVEYOR) {
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
    <div className="flex flex-col items-center">
      {/* Board grid */}
      <div
        className="relative bg-gray-900 border-4 border-gray-700 shadow-2xl"
        style={{
          width: board.width * TILE_SIZE,
          height: board.height * TILE_SIZE,
        }}
      >
        {Array.from({ length: board.height }, (_, y) => (
          <div key={y} className="flex">
            {Array.from({ length: board.width }, (_, x) => (
              <div
                key={`${x}-${y}`}
                className="relative"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              >
                <div className={`absolute inset-0 border border-gray-700 bg-gray-800`} />
                {renderTileContent(x, y)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}