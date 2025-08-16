// components/game/Board.tsx
import React, { useEffect, useState, useRef } from 'react';
import { BoardDefinition, Course, Player, Direction, Position, Tile, Checkpoint, Laser, TileType } from '@/lib/game/types';
import RobotLaserAnimation, { RobotLaserShot } from './RobotLaserAnimation';
import Robot from './Robot';
import { socketClient } from '@/lib/socket';

interface BoardProps {
  course: Course;
  players: Record<string, Player>;
  currentPlayerId?: string;
  isHost?: boolean;
  gameState?: any;
  roomCode?: string;
  activeLasers?: RobotLaserShot[];
}

// Direction mapping for visual arrows
const DIRECTION_ARROWS = ['↑', '→', '↓', '←'];

const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ course, players, activeLasers = [], currentPlayerId, isHost, gameState, roomCode }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(50);

  useEffect(() => {
    const calculateTileSize = () => {
      if (!containerRef.current || !course) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate the maximum tile size that fits in the container
      // Leave some margin for the phase indicator below
      const maxWidthTileSize = Math.floor(containerWidth / course.board.width);
      const maxHeightTileSize = Math.floor((containerHeight - 60) / course.board.height); // 60px for phase indicator

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
  }, [course]);

  // Show pre-game controls when game hasn't started
  if (!course || gameState?.phase === 'waiting') {
    // Use players from gameState if available, as it's more up-to-date
    const currentPlayers = gameState?.players || players || {};
    const playerCount = Object.keys(currentPlayers).length;

    console.log('Board waiting state:', {
      board: !!course,
      phase: gameState?.phase,
      playerCount,
      isHost,
      currentPlayerId,
      host: gameState?.host,
      players: Object.keys(currentPlayers),
      gameStateExists: !!gameState,
      roomCodeExists: !!roomCode
    });

    // If we have a board (preview mode), show it instead of the waiting message
    if (course) {
      // Continue to render the board normally - it will show the selected course layout
      // Just without any robots on it yet
    } else {
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
  }

  // Get player index for color assignment
  const getPlayerIndex = (playerId: string): number => {
    return Object.keys(players).indexOf(playerId);
  };

  // Get tile element at position (for future enhanced boards)
  // Get tile element at position (for enhanced boards)
  const getTileAt = (x: number, y: number): Tile | undefined => {
    // Check if board has the tiles array
    if (!course.board.tiles || !Array.isArray(course.board.tiles)) {
      return undefined;
    }

    // Check if it's a 2D array (the expected format after buildBoard)
    if (course.board.tiles.length > 0 && Array.isArray(course.board.tiles[0])) {
      // It's a 2D array - this is the standard format
      const row = course.board.tiles[y];
      if (row && Array.isArray(row) && row[x]) {
        return row[x] as Tile;
      }
    } else if (course.board.tiles.length > 0 && 'position' in course.board.tiles[0]) {
      // It's a flat array (shouldn't happen after buildBoard, but handle it anyway)
      const tile = (course.board.tiles as any[]).find(
        (t: any) => t.position?.x === x && t.position?.y === y
      );
      return tile;
    }

    return undefined;
  };

  // Get walls at a specific position
  const getWallsAt = (x: number, y: number): Direction[] => {
    if (!course.board.walls || !Array.isArray(course.board.walls)) {
      return [];
    }

    const wall = course.board.walls.find(
      (w: any) => w.position.x === x && w.position.y === y
    );

    return wall ? wall.sides : [];
  };

  // Get laser at position (for enhanced boards)
  const getLaserAt = (x: number, y: number): Laser | undefined => {
    if (course.board.lasers && Array.isArray(course.board.lasers)) {
      return (course.board.lasers as any[]).find((laser: any) => laser.position?.x === x && laser.position?.y === y);
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
      currentX < course.board.width &&
      currentY >= 0 &&
      currentY < course.board.height
    ) {
      path.push({ x: currentX, y: currentY });

      // TODO: Check if blocked by wall when wall system is implemented
      // Walls would stop the beam, but robots don't

      // Continue to next position
      currentX += dx[laser.direction];
      currentY += dy[laser.direction];
    }

    return path;
  };  // Get all laser beams that should be rendered
  const getAllLaserBeams = (): { laser: Laser; path: Position[] }[] => {
    const beams: { laser: Laser; path: Position[] }[] = [];

    if (course.board.lasers && Array.isArray(course.board.lasers)) {
      course.board.lasers.forEach((laser: any) => {
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
      console.log('Rendering tile at', { x, y, tile });

      // Conveyor belts
      if (tile.type === 'conveyor' || tile.type === 'express') {
        console.log('Rendering conveyor tile at', { x, y, tile });
        const color = tile.type === 'express' ? 'bg-blue-400' : 'bg-yellow-600';
        const arrowRotation = ((tile.direction || 0) - 1) * 90;

        elements.push(
          <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
            {tile.type === 'express' ? (
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

      // ADD this after the existing conveyor belt rendering code (around line 215):

      // Pits
      if (tile.type === 'pit') {
        elements.push(
          <div key="pit" className="absolute inset-0 bg-black opacity-80 flex items-center justify-center">
            <div className="text-gray-600" style={{ fontSize: `${fontSize * 1.5}px` }}>⚫</div>
          </div>
        );
      }

      // Repair sites
      if (tile.type === 'repair') {
        elements.push(
          <div key="repair" className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-600 rounded-full p-1" style={{ width: `${tileSize * 0.6}px`, height: `${tileSize * 0.6}px` }}>
              <div className="bg-yellow-500 rounded-full w-full h-full flex items-center justify-center">
                <span style={{ fontSize: `${fontSize * 0.8}px` }}>🔧</span>
              </div>
            </div>
          </div>
        );
      }

      // Option sites
      if (tile.type === 'option') {
        elements.push(
          <div key="option" className="absolute inset-0 flex items-center justify-center">
            <div className="bg-purple-600 rounded-full p-1" style={{ width: `${tileSize * 0.6}px`, height: `${tileSize * 0.6}px` }}>
              <div className="bg-purple-500 rounded-full w-full h-full flex items-center justify-center">
                <span style={{ fontSize: `${fontSize * 0.8}px` }}>⚙️</span>
              </div>
            </div>
          </div>
        );
      }

      // Gears
      if (tile.type === 'gear_cw' || tile.type === 'gear_ccw') {
        const isClockwise = tile.type === 'gear_cw';
        elements.push(
          <div key="gear" className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-gray-500"
              style={{
                fontSize: `${tileSize * 0.8}px`,
                transform: `rotate(${isClockwise ? '0deg' : '180deg'})`
              }}
            >
              ⚙
            </div>
            <div
              className="absolute text-white font-bold"
              style={{ fontSize: `${fontSize * 0.6}px` }}
            >
              {isClockwise ? '↻' : '↺'}
            </div>
          </div>
        );
      }
      // Other tile types can be added here...
    }

    // Walls - NEW IMPLEMENTATION
    const walls = getWallsAt(x, y);
    if (walls && walls.length > 0) {
      const wallThickness = 4; // pixels
      const wallColor = '#facc15'; // yellow-400

      walls.forEach((direction, index) => {
        let wallStyle: React.CSSProperties = {
          position: 'absolute',
          backgroundColor: wallColor,
          zIndex: 10, // Above tiles but below robots
        };

        switch (direction) {
          case Direction.UP:
            wallStyle = {
              ...wallStyle,
              top: 0,
              left: 0,
              right: 0,
              height: `${wallThickness}px`,
            };
            break;
          case Direction.RIGHT:
            wallStyle = {
              ...wallStyle,
              top: 0,
              right: 0,
              bottom: 0,
              width: `${wallThickness}px`,
            };
            break;
          case Direction.DOWN:
            wallStyle = {
              ...wallStyle,
              bottom: 0,
              left: 0,
              right: 0,
              height: `${wallThickness}px`,
            };
            break;
          case Direction.LEFT:
            wallStyle = {
              ...wallStyle,
              top: 0,
              left: 0,
              bottom: 0,
              width: `${wallThickness}px`,
            };
            break;
        }

        elements.push(
          <div
            key={`wall-${direction}`}
            style={wallStyle}
          />
        );
      });
    }

    //Checkpoints
    const checkpoint = course.definition.checkpoints?.find(
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
    const isStart = course.board.startingPositions.some(
      sp => sp.position.x === x && sp.position.y === y
    );
    if (isStart) {
      elements.push(
        <div key="start" className="absolute inset-0 bg-green-800 opacity-50" />
      );
    }


    // Laser source wall indicator
    // Laser source wall indicator
    const laser = getLaserAt(x, y);
    if (laser) {
      // Determine which edge of the tile to place the indicator
      const indicatorSize = Math.floor(tileSize * 0.15);
      const indicatorOffset = 2;

      // For double lasers, create two separate blocks
      if (laser.damage > 1) {
        const spacing = 6; // Match the beam spacing
        const blockSize = indicatorSize * 1.4; // Make blocks wider

        elements.push(
          <React.Fragment key="laser-source">
            {/* First block */}
            <div
              style={{
                position: 'absolute',
                backgroundColor: '#fde047',
                border: '1px solid #a16207',
                zIndex: 5,
                ...(() => {
                  switch (laser.direction) {
                    case 0: // North
                      return {
                        bottom: indicatorOffset,
                        left: '50%',
                        transform: `translateX(calc(-50% - ${spacing}px))`,
                        width: blockSize,
                        height: indicatorSize
                      };
                    case 1: // East
                      return {
                        left: indicatorOffset,
                        top: '50%',
                        transform: `translateY(calc(-50% - ${spacing}px))`,
                        width: indicatorSize,
                        height: blockSize
                      };
                    case 2: // South
                      return {
                        top: indicatorOffset,
                        left: '50%',
                        transform: `translateX(calc(-50% - ${spacing}px))`,
                        width: blockSize,
                        height: indicatorSize
                      };
                    case 3: // West
                      return {
                        right: indicatorOffset,
                        top: '50%',
                        transform: `translateY(calc(-50% - ${spacing}px))`,
                        width: indicatorSize,
                        height: blockSize
                      };
                  }
                })()
              }}
            />
            {/* Second block */}
            <div
              style={{
                position: 'absolute',
                backgroundColor: '#fde047',
                border: '1px solid #a16207',
                zIndex: 5,
                ...(() => {
                  switch (laser.direction) {
                    case 0: // North
                      return {
                        bottom: indicatorOffset,
                        left: '50%',
                        transform: `translateX(calc(-50% + ${spacing}px))`,
                        width: blockSize,
                        height: indicatorSize
                      };
                    case 1: // East
                      return {
                        left: indicatorOffset,
                        top: '50%',
                        transform: `translateY(calc(-50% + ${spacing}px))`,
                        width: indicatorSize,
                        height: blockSize
                      };
                    case 2: // South
                      return {
                        top: indicatorOffset,
                        left: '50%',
                        transform: `translateX(calc(-50% + ${spacing}px))`,
                        width: blockSize,
                        height: indicatorSize
                      };
                    case 3: // West
                      return {
                        right: indicatorOffset,
                        top: '50%',
                        transform: `translateY(calc(-50% + ${spacing}px))`,
                        width: indicatorSize,
                        height: blockSize
                      };
                  }
                })()
              }}
            />
          </React.Fragment>
        );
      } else {
        // Single laser block
        let indicatorStyle: React.CSSProperties = {
          position: 'absolute',
          backgroundColor: '#fde047',
          border: '1px solid #a16207',
          zIndex: 5
        };

        switch (laser.direction) {
          case 0: // North
            indicatorStyle = {
              ...indicatorStyle,
              bottom: indicatorOffset,
              left: '50%',
              transform: 'translateX(-50%)',
              width: indicatorSize * 2,
              height: indicatorSize
            };
            break;
          case 1: // East
            indicatorStyle = {
              ...indicatorStyle,
              left: indicatorOffset,
              top: '50%',
              transform: 'translateY(-50%)',
              width: indicatorSize,
              height: indicatorSize * 2
            };
            break;
          case 2: // South
            indicatorStyle = {
              ...indicatorStyle,
              top: indicatorOffset,
              left: '50%',
              transform: 'translateX(-50%)',
              width: indicatorSize * 2,
              height: indicatorSize
            };
            break;
          case 3: // West
            indicatorStyle = {
              ...indicatorStyle,
              right: indicatorOffset,
              top: '50%',
              transform: 'translateY(-50%)',
              width: indicatorSize,
              height: indicatorSize * 2
            };
            break;
        }

        elements.push(
          <div
            key="laser-source"
            style={indicatorStyle}
          />
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
        const beamWidth = isDoubleLaser ? 8 : 4;
        const beamLength = tileSize;

        // Position calculations
        let left = pos.x * tileSize;
        let top = pos.y * tileSize;

        // Adjust starting position for source tile to emit from edge of block
        if (pathIndex === 0) {
          const indicatorSize = Math.floor(tileSize * 0.2);
          const indicatorOffset = 2;

          switch (beam.laser.direction) {
            case 0: // North - beam starts from top of block
              top -= indicatorSize - indicatorOffset;
              break;
            case 1: // East - beam starts from right of block  
              left += indicatorSize - indicatorOffset;
              break;
            case 2: // South - beam starts from bottom of block
              top += indicatorSize - indicatorOffset;
              break;
            case 3: // West - beam starts from left of block
              left -= indicatorSize - indicatorOffset;
              break;
          }
        }

        if (isHorizontal) {
          // Center vertically
          top += (tileSize - beamWidth) / 2;
        } else {
          // Center horizontally
          left += (tileSize - beamWidth) / 2;
        }
        // For double lasers, create two parallel beams
        if (isDoubleLaser) {
          const spacing = 6;
          const singleBeamWidth = 3;

          return (
            <div key={`laser-${index}-${pathIndex}`}>
              {/* First beam */}
              <div
                className="absolute animate-pulse"
                style={{
                  left: isHorizontal ? `${left}px` : `${left - spacing}px`,
                  top: isHorizontal ? `${top - spacing}px` : `${top}px`,
                  width: isHorizontal ? `${beamLength}px` : `${singleBeamWidth}px`,
                  height: isHorizontal ? `${singleBeamWidth}px` : `${beamLength}px`,
                  backgroundColor: 'rgba(220, 38, 38, 0.7)',
                  boxShadow: '0 0 4px rgba(220, 38, 38, 0.8)',
                  zIndex: 10
                }}
              />
              {/* Second beam */}
              <div
                className="absolute animate-pulse"
                style={{
                  left: isHorizontal ? `${left}px` : `${left + spacing}px`,
                  top: isHorizontal ? `${top + spacing}px` : `${top}px`,
                  width: isHorizontal ? `${beamLength}px` : `${singleBeamWidth}px`,
                  height: isHorizontal ? `${singleBeamWidth}px` : `${beamLength}px`,
                  backgroundColor: 'rgba(220, 38, 38, 0.7)',
                  boxShadow: '0 0 4px rgba(220, 38, 38, 0.8)',
                  zIndex: 10
                }}
              />
              {/* Glow effect for double laser */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${left - 6}px`,
                  top: `${top - 6}px`,
                  width: isHorizontal ? `${beamLength + 12}px` : `${beamWidth + 12}px`,
                  height: isHorizontal ? `${beamWidth + 12}px` : `${beamLength + 12}px`,
                  background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                  filter: 'blur(6px)',
                  zIndex: 9
                }}
              />
            </div>
          );
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
          width: course.board.width * tileSize,
          height: course.board.height * tileSize
        }}
      >
        {/* Render tiles */}
        {Array.from({ length: course.board.height }, (_, y) => (
          Array.from({ length: course.board.width }, (_, x) => (
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

        {/* Render robot laser animations */}
        <RobotLaserAnimation
          players={players}
          activeLasers={activeLasers}
          tileSize={tileSize}
        />
      </div>

      {/* Current phase indicator */}
      {/* @ts-ignore - gameState might be passed through parent */}
      {(course as any).phase === 'executing' && (
        <div className="mt-4 p-2 bg-yellow-600 text-black rounded">
          Executing Register {((course as any).currentRegister || 0) + 1} of 5
        </div>
      )}
    </div>
  );
}