// components/game/Board.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Board as BoardType, Player, Direction, Position } from '@/lib/game/types';
import Robot from './Robot';
import { socketClient } from '@/lib/socket';

interface BoardProps {
  board: BoardType;
  players: Record<string, Player>;
  currentPlayerId?: string;
  isHost?: boolean;
  gameState?: any;
  roomCode?: string;
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

const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, currentPlayerId, isHost, gameState, roomCode }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(50);

  useEffect(() => {
    const calculateTileSize = () => {
      if (!containerRef.current || !board) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate the maximum tile size that fits in the container
      // Leave some margin for the phase indicator below
      const maxWidthTileSize = Math.floor(containerWidth / board.width);
      const maxHeightTileSize = Math.floor((containerHeight - 60) / board.height); // 60px for phase indicator

      // Use the smaller of the two to ensure the board fits
      const newTileSize = Math.min(maxWidthTileSize, maxHeightTileSize, 80); // Cap at 80px max

      setTileSize(Math.max(newTileSize, 30)); // Minimum 30px
    };

    calculateTileSize();
    window.addEventListener('resize', calculateTileSize);

    // Also recalculate when the container might change size
    const resizeObserver = new ResizeObserver(calculateTileSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculateTileSize);
      resizeObserver.disconnect();
    };
  }, [board]);

  // Show pre-game controls when game hasn't started
  if (!board || gameState?.phase === 'waiting') {
    // Use players from gameState if available, as it's more up-to-date
    const currentPlayers = gameState?.players || players || {};
    const playerCount = Object.keys(currentPlayers).length;

    console.log('Board waiting state:', {
      board: !!board,
      phase: gameState?.phase,
      playerCount,
      isHost,
      currentPlayerId,
      host: gameState?.host,
      players: Object.keys(currentPlayers),
      gameStateExists: !!gameState,
      roomCodeExists: !!roomCode
    });

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-xl text-gray-300">
            Waiting for players to join...
          </p>
          <p className="text-lg text-gray-400">
            {playerCount} / 8 players in lobby
          </p>

          {isHost ? (
            <>
              <button
                onClick={() => {
                  console.log('Start game clicked, roomCode:', roomCode);
                  socketClient.emit('start-game', roomCode);
                  console.log('Emitted start_game event');
                }}
                disabled={playerCount < 2}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded font-semibold text-lg"
              >
                Start Game
              </button>
              {playerCount < 2 && (
                <p className="text-sm text-gray-500">Need at least 2 players to start</p>
              )}
            </>
          ) : (
            <p className="text-gray-400">Waiting for host to start game...</p>
          )}
        </div>
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
    if (board.lasers && Array.isArray(board.lasers)) {
      return (board.lasers as any[]).find((laser: any) => laser.position?.x === x && laser.position?.y === y);
    }
    return undefined;
  };

  // Check if a position is blocked by a robot
  const isBlockedByRobot = (x: number, y: number): boolean => {
    return Object.values(players).some(player =>
      player.position.x === x && player.position.y === y && player.lives > 0
    );
  };

  // Calculate laser beam path from a laser source
  const calculateLaserBeamPath = (laser: Laser): Position[] => {
    const path: Position[] = [];
    let currentX = laser.position.x;
    let currentY = laser.position.y;

    // Direction vectors: 0=North, 1=East, 2=South, 3=West
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];

    // Start from the laser source tile itself
    path.push({ x: currentX, y: currentY });

    // Move to next tile
    currentX += dx[laser.direction];
    currentY += dy[laser.direction];

    // Trace the full path until hitting board edge or wall
    while (
      currentX >= 0 &&
      currentX < board.width &&
      currentY >= 0 &&
      currentY < board.height
    ) {
      path.push({ x: currentX, y: currentY });

      // TODO: Check if blocked by wall when wall system is implemented
      // Walls would stop the beam, but robots don't

      // Continue to next position
      currentX += dx[laser.direction];
      currentY += dy[laser.direction];
    }

    return path;
  };

  // Get all laser beams that should be rendered
  const getAllLaserBeams = (): { laser: Laser; path: Position[] }[] => {
    const beams: { laser: Laser; path: Position[] }[] = [];

    if (board.lasers && Array.isArray(board.lasers)) {
      board.lasers.forEach((laser: any) => {
        const path = calculateLaserBeamPath(laser);
        beams.push({ laser, path });
      });
    }

    return beams;
  };

  // Calculate responsive sizes based on tile size
  const robotSize = Math.floor(tileSize * 0.8);
  const checkpointSize = Math.floor(tileSize * 0.8);
  const arrowSize = Math.floor(tileSize * 0.5);
  const fontSize = Math.floor(tileSize * 0.3);

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
        const color = tile.type === 'conveyor_express' ? 'bg-blue-400' : 'bg-yellow-600';
        const arrowRotation = ((tile.direction || 0) - 1) * 90;

        elements.push(
          <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
            {tile.type === 'conveyor_express' ? (
              // Express conveyor with double arrows back-to-back
              <div
                className="relative flex items-center justify-center"
                style={{
                  transform: `rotate(${arrowRotation}deg)`,
                  width: '100%',
                  height: '100%'
                }}
              >
                <svg
                  className="text-gray-900 absolute"
                  style={{
                    width: `${arrowSize}px`,
                    height: `${arrowSize}px`,
                    transform: `translate(calc(-${arrowSize * 0.15}px - 2px), 0px)`
                  }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3l7 7-7 7V3z" />
                </svg>
                <svg
                  className="text-gray-900 absolute"
                  style={{
                    width: `${arrowSize}px`,
                    height: `${arrowSize}px`,
                    transform: `translate(calc(${arrowSize * 0.15}px - 2px), 0px)`
                  }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3l7 7-7 7V3z" />
                </svg>
              </div>
            ) : (
              // Regular conveyor with single arrow
              <svg
                className="text-gray-900"
                style={{
                  transform: `rotate(${arrowRotation}deg) translateX(-2px)`,
                  width: `${arrowSize}px`,
                  height: `${arrowSize}px`
                }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 3l7 7-7 7V3z" />
              </svg>)}
            {tile.rotate && (
              <div className="absolute bottom-0 right-0 text-gray-900 p-0.5" style={{ fontSize: `${fontSize * 0.4}px` }}>
                {tile.rotate === 'clockwise' ? '↻' : '↺'}
              </div>
            )}
          </div>
        );
      }
    }

    // Checkpoints
    const checkpoint = board.checkpoints?.find(
      (cp: Checkpoint) => cp.position.x === x && cp.position.y === y
    );
    if (checkpoint) {
      elements.push(
        <div key="checkpoint" className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-white rounded-full flex items-center justify-center text-black font-bold border-4 border-black"
            style={{
              width: `${checkpointSize}px`,
              height: `${checkpointSize}px`,
              fontSize: `${fontSize}px`
            }}
          >
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

    // No laser source indicator needed - beams will pass through the tile

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
              size={robotSize}
            />
          </div>
        );
      }
    });

    return elements;
  };

  // Render laser beams
  const renderLaserBeams = () => {
    const beams = getAllLaserBeams();
    return beams.map((beam, index) => {
      // Create beam segments for each position in the path
      return beam.path.map((pos, pathIndex) => {
        const isHorizontal = beam.laser.direction === 1 || beam.laser.direction === 3;
        const isDoubleLaser = beam.laser.damage > 1;

        // Calculate beam position and size
        const beamWidth = isDoubleLaser ? 6 : 4;
        const beamLength = tileSize;

        // Position calculations
        let left = pos.x * tileSize;
        let top = pos.y * tileSize;

        if (isHorizontal) {
          // Center vertically
          top += (tileSize - beamWidth) / 2;
        } else {
          // Center horizontally
          left += (tileSize - beamWidth) / 2;
        }

        // Create gradient based on direction
        const gradientId = `laser-gradient-${index}-${pathIndex}`;
        const gradientStops = isDoubleLaser ? (
          <>
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </>
        ) : (
          <>
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
          </>
        );

        return (
          <div key={`laser-${index}-${pathIndex}`}>
            <svg
              className="absolute pointer-events-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: isHorizontal ? `${beamLength}px` : `${beamWidth}px`,
                height: isHorizontal ? `${beamWidth}px` : `${beamLength}px`,
                zIndex: 10
              }}
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2={isHorizontal ? "100%" : "0%"}
                  y2={isHorizontal ? "0%" : "100%"}
                >
                  {gradientStops}
                </linearGradient>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#${gradientId})`}
                className="animate-pulse"
              />
              {isDoubleLaser && (
                <rect
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
              )}
            </svg>

            {/* Add glow effect */}
            <div
              className="absolute pointer-events-none animate-pulse"
              style={{
                left: `${left - 4}px`,
                top: `${top - 4}px`,
                width: isHorizontal ? `${beamLength + 8}px` : `${beamWidth + 8}px`,
                height: isHorizontal ? `${beamWidth + 8}px` : `${beamLength + 8}px`,
                background: isDoubleLaser
                  ? 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.3) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                filter: 'blur(4px)',
                zIndex: 9
              }}
            />
          </div>
        );
      });
    }).flat();
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full">
      {/* Board grid */}
      <div
        className="relative bg-gray-900"
        style={{
          width: board.width * tileSize,
          height: board.height * tileSize
        }}
      >
        {/* Render tiles */}
        {Array.from({ length: board.height }, (_, y) => (
          Array.from({ length: board.width }, (_, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute"
              style={{
                left: x * tileSize,
                top: y * tileSize,
                width: tileSize,
                height: tileSize
              }}
            >
              {getTileContent(x, y)}
            </div>
          ))
        ))}

        {/* Render laser beams on top of tiles but below robots */}
        {renderLaserBeams()}
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