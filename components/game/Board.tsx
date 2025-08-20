// components/game/Board.tsx
import React, { useEffect, useState, useRef } from 'react';
import { BoardDefinition, Course, Player, Direction, Position, Tile, Checkpoint, Laser, TileType } from '@/lib/game/types';
import RobotLaserAnimation, { RobotLaserShot } from './RobotLaserAnimation';
import Robot from './Robot';
import { socketClient } from '@/lib/socket';
import { getTileAt as getCanonicalTileAt } from '@/lib/game/tile-utils';
import { Board as BoardType } from '@/lib/game/types';


interface BoardProps {
  board: BoardType;  // Use the Board type from types.ts
  players: Record<string, Player>;
  currentPlayerId?: string;
  tileSize?: number;
  activeLasers?: RobotLaserShot[];
  onTileSizeChange?: (tileSize: number) => void;
}

// Direction mapping for visual arrows
const DIRECTION_ARROWS = ['↑', '→', '↓', '←'];

const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, activeLasers = [], currentPlayerId, onTileSizeChange }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(50);

  useEffect(() => {
    const calculateTileSize = () => {
      if (!containerRef.current || !board) return;

      // Get the parent element's dimensions instead of our own
      var parent = containerRef.current.parentElement;
      if (!parent) return;
      var parent = parent.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      console.log('Parent dimensions:', {
        width: parentWidth,
        height: parentHeight,
        boardWidth: board.width,
        boardHeight: board.height
      });

      // Calculate based on parent size
      const maxWidthTileSize = Math.floor(parentWidth / board.width);
      const maxHeightTileSize = Math.floor((parentHeight - 60) / board.height);

      console.log('Calculated tile sizes:', {
        maxWidthTileSize,
        maxHeightTileSize
      });

      const newTileSize = Math.min(maxWidthTileSize, maxHeightTileSize, 120);
      const finalTileSize = Math.max(newTileSize, 30);

      console.log('Final tile size:', finalTileSize);

      setTileSize(finalTileSize);

      if (onTileSizeChange) {
        onTileSizeChange(finalTileSize);
      }
    };

    // Add a small delay to let the DOM settle
    setTimeout(calculateTileSize, 0);

    window.addEventListener('resize', calculateTileSize);

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
  // if (!board || gameState?.phase === 'waiting') {
  //   // Use players from gameState if available, as it's more up-to-date
  //   const currentPlayers = gameState?.players || players || {};
  //   const playerCount = Object.keys(currentPlayers).length;

  //   console.log('Board waiting state:', {
  //     board: !!board,
  //     phase: gameState?.phase,
  //     playerCount,
  //     isHost,
  //     currentPlayerId,
  //     host: gameState?.host,
  //     players: Object.keys(currentPlayers),
  //     gameStateExists: !!gameState,
  //     roomCodeExists: !!roomCode
  //   });

  //   // If we have a board (preview mode), show it instead of the waiting message
  //   if (board) {
  //     // Continue to render the board normally - it will show the selected course layout
  //     // Just without any robots on it yet
  //   } else {
  //     return (
  //       <div className="flex items-center justify-center h-full">
  //         <div className="text-center space-y-4">
  //           <p className="text-xl text-gray-300">
  //             Waiting for players to join...
  //           </p>
  //           <p className="text-lg text-gray-400">
  //             {playerCount} / 8 players in lobby
  //           </p>

  //           {isHost ? (
  //             <>
  //               <button
  //                 onClick={() => {
  //                   console.log('Start game clicked, roomCode:', roomCode);
  //                   socketClient.emit('start-game', roomCode);
  //                   console.log('Emitted start_game event');
  //                 }}
  //                 disabled={playerCount < 2}
  //                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded font-semibold text-lg"
  //               >
  //                 Start Game
  //               </button>
  //               {playerCount < 2 && (
  //                 <p className="text-sm text-gray-500">Need at least 2 players to start</p>
  //               )}
  //             </>
  //           ) : (
  //             <p className="text-gray-400">Waiting for host to start game...</p>
  //           )}
  //         </div>
  //       </div>
  //     );
  //   }
  // }

  // Get player index for color assignment
  const getPlayerIndex = (playerId: string): number => {
    return Object.keys(players).indexOf(playerId);
  };

  const getTileAt = (x: number, y: number): Tile | undefined => {
    return getCanonicalTileAt(board, x, y);
  };

  // Get walls at a specific position
  const getWallsAt = (x: number, y: number): Direction[] => {
    if (!board.walls || !Array.isArray(board.walls)) {
      return [];
    }

    const wall = board.walls.find(
      (w: any) => w.position.x === x && w.position.y === y
    );

    return wall ? wall.sides : [];
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

  const calculateLaserBeamPath = (laser: Laser): Position[] => {
    const path: Position[] = [];
    let currentX = laser.position.x;
    let currentY = laser.position.y;

    // Direction vectors: 0=North, 1=East, 2=South, 3=West
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];

    // Check if laser is immediately blocked by a wall at its source
    const sourceTile = getTileAt(currentX, currentY);
    if (sourceTile && sourceTile.walls && sourceTile.walls.includes(laser.direction)) {
      // Laser blocked immediately, return empty path
      return [];
    }

    // Start from the laser source tile itself
    path.push({ x: currentX, y: currentY });

    // Move to next tile
    currentX += dx[laser.direction];
    currentY += dy[laser.direction];

    // Trace the full path until hitting board edge, wall, or robot
    while (
      currentX >= 0 &&
      currentX < board.width &&
      currentY >= 0 &&
      currentY < board.height
    ) {
      // Check if entry to this tile is blocked by a wall
      const oppositeDirection = (laser.direction + 2) % 4;
      const currentTile = getTileAt(currentX, currentY);
      if (currentTile && currentTile.walls && currentTile.walls.includes(oppositeDirection)) {
        // Wall blocks entry to this tile
        break;
      }

      // Add this position to the path
      path.push({ x: currentX, y: currentY });

      // Check if there's a robot at this position
      if (isBlockedByRobot(currentX, currentY)) {
        // Laser hits robot and stops here
        break;
      }

      // Check if exit from this tile is blocked by a wall
      if (currentTile && currentTile.walls && currentTile.walls.includes(laser.direction)) {
        // Wall blocks exit from this tile
        break;
      }

      // Continue to next position
      currentX += dx[laser.direction];
      currentY += dy[laser.direction];
    }

    return path;
  };

  // Get all laser beams that should be rendered (board lasers + robot lasers)
  const getAllLaserBeams = (): { laser: Laser; path: Position[]; isRobotLaser?: boolean; shooterId?: string }[] => {
    const beams: { laser: Laser; path: Position[]; isRobotLaser?: boolean; shooterId?: string }[] = [];

    // Add board lasers
    if (board.lasers && Array.isArray(board.lasers)) {
      board.lasers.forEach((laser: any) => {
        const path = calculateLaserBeamPath(laser);
        beams.push({ laser, path, isRobotLaser: false });
      });
    }

    // Add robot lasers
    Object.values(players).forEach((player: Player) => {
      if (player.lives > 0) {
        // Create a laser source from the robot's position and direction
        const robotLaser: Laser = {
          position: player.position,
          direction: player.direction,
          damage: 1 // Robot lasers always do 1 damage
        };

        const path = calculateRobotLaserPath(player);
        if (path.length > 0) {
          beams.push({
            laser: robotLaser,
            path,
            isRobotLaser: true,
            shooterId: player.id
          });
        }
      }
    });

    return beams;
  };

  // Calculate robot laser beam path (similar to board lasers but excludes the shooter)
  const calculateRobotLaserPath = (shooter: Player): Position[] => {
    const path: Position[] = [];
    let currentX = shooter.position.x;
    let currentY = shooter.position.y;

    // Direction vectors: 0=North, 1=East, 2=South, 3=West
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];

    // Check if laser is immediately blocked by a wall at robot's position
    const sourceTile = getTileAt(currentX, currentY);
    if (sourceTile && sourceTile.walls && sourceTile.walls.includes(shooter.direction)) {
      // Robot's laser blocked immediately by wall
      return [];
    }

    // Move to first tile in front of robot (don't include robot's own position)
    currentX += dx[shooter.direction];
    currentY += dy[shooter.direction];

    // Trace the path until hitting board edge, wall, or another robot
    while (
      currentX >= 0 &&
      currentX < board.width &&
      currentY >= 0 &&
      currentY < board.height
    ) {
      // Check if entry to this tile is blocked by a wall
      const oppositeDirection = (shooter.direction + 2) % 4;
      const currentTile = getTileAt(currentX, currentY);
      if (currentTile && currentTile.walls && currentTile.walls.includes(oppositeDirection)) {
        // Wall blocks entry to this tile
        break;
      }

      // Add this position to the path
      path.push({ x: currentX, y: currentY });

      // Check if there's another robot at this position (not the shooter)
      const robotAtPosition = Object.values(players).find(p =>
        p.position.x === currentX &&
        p.position.y === currentY &&
        p.lives > 0 &&
        p.id !== shooter.id
      );

      if (robotAtPosition) {
        // Laser hits another robot and stops here
        break;
      }

      // Check if exit from this tile is blocked by a wall
      if (currentTile && currentTile.walls && currentTile.walls.includes(shooter.direction)) {
        // Wall blocks exit from this tile
        break;
      }

      // Continue to next position
      currentX += dx[shooter.direction];
      currentY += dy[shooter.direction];
    }

    return path;
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
      <div key="base" className="absolute inset-0 border border-gray-600 bg-gray-400" />
    );

    // Add tile-specific elements when tiles are implemented
    if (tile) {
      //console.log('Rendering tile at', { x, y, tile });

      // Conveyor belts
      if (tile.type === 'conveyor' || tile.type === 'express') {
        const isExpress = tile.type === 'express';
        const color = isExpress ? 'bg-blue-400' : 'bg-yellow-600';
        const arrowRotation = (tile.direction || 0) * 90;

        elements.push(
          <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
            {isExpress && !tile.rotate ? (
              // Express conveyor with double arrows back-to-back
              <div
                className="relative flex items-center justify-center"
                style={{
                  transform: `rotate(${arrowRotation}deg)`,
                  width: '100%',
                  height: '100%'
                }}
              >
                {/* First arrow */}
                <svg
                  className="text-gray-900 absolute"
                  style={{
                    width: `${arrowSize * 0.85}px`,
                    height: `${arrowSize * 0.85}px`,
                    transform: `translateY(${arrowSize * 0.35}px)`
                  }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
                </svg>
                {/* Second arrow */}
                <svg
                  className="text-gray-900 absolute"
                  style={{
                    width: `${arrowSize * 0.85}px`,
                    height: `${arrowSize * 0.85}px`,
                    transform: `translateY(-${arrowSize * 0.35}px)`
                  }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
                </svg>
              </div>
            ) : isExpress && tile.rotate ? (
              // Rotating EXPRESS conveyor - curved arrow plus straight entry arrow
              <svg
                className="text-gray-900"
                style={{
                  transform: `rotate(${arrowRotation - 90}deg)`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                }}
                fill="currentColor"
                viewBox="-8 -8 40 40"
              >
                {tile.rotate === 'clockwise' ? (
                  // Clockwise rotation - enters from bottom, curves right
                  <g>
                    <path d="M12 24 Q12 12 24 12"
                      fill="none" stroke="currentColor" strokeWidth="6" />
                    <path d="M21 5 L31 12 L21 19 Z" />
                    {/* Straight arrow entering from bottom - pointing up (narrower) */}
                    <path d="M12 14 L6 24 L9 24 L9 32 L15 32 L15 24 L18 24 Z" />
                  </g>
                ) : (
                  // Counter-clockwise rotation - enters from right, exits up (which becomes down after rotation)
                  <g>
                    <path d="M24 12 Q12 12 12 0"
                      fill="none" stroke="currentColor" strokeWidth="6" />
                    <path d="M19 5 L29 12 L19 19 Z" />
                    {/* Arrow pointing up from top - after rotation will point left from right (narrower) */}
                    <path d="M12 10 L6 0 L9 0 L9 -8 L15 -8 L15 0 L18 0 Z" />
                  </g>
                )}
              </svg>
            ) : tile.rotate ? (
              // Rotating conveyor with curved arrow
              <svg
                className="text-gray-900"
                style={{
                  transform: `rotate(${arrowRotation - 90}deg)`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                }}
                fill="currentColor"
                viewBox="-8 -8 40 40"
              >
                {/* <rect x="-8" y="-8" width="40" height="40" fill="none" stroke="red" strokeWidth="1" /> */}
                {tile.rotate === 'clockwise' ? (
                  // Clockwise rotation - enters from bottom, curves right
                  <g>
                    <path d="M12 24 Q12 12 24 12"
                      fill="none" stroke="currentColor" strokeWidth="8" />
                    <path d="M21 5 L31 12 L21 19 Z" />
                  </g>
                ) : (
                  // Counter-clockwise rotation - enters from right, exits up
                  <g>
                    <path d="M24 12 Q12 12 12 0"
                      fill="none" stroke="currentColor" strokeWidth="8" />
                    <path d="M19 5 L29 12 L19 19 Z" />
                  </g>
                )}
              </svg>
            ) : (
              // Regular straight conveyor arrow
              <svg
                className="text-gray-900"
                style={{
                  transform: `rotate(${arrowRotation}deg)`,
                  width: `${arrowSize}px`,
                  height: `${arrowSize}px`
                }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
              </svg>
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
    // const checkpoint = course.definition.checkpoints?.find(
    //   (cp: Checkpoint) => cp.position.x === x && cp.position.y === y
    // );
    // if (checkpoint) {
    //   elements.push(
    //     <div key="checkpoint" className="absolute inset-0 flex items-center justify-center">
    //       <div
    //         className="bg-white rounded-full flex items-center justify-center text-black font-bold border-4 border-black"
    //         style={{
    //           width: `${checkpointSize}px`,
    //           height: `${checkpointSize}px`,
    //           fontSize: `${fontSize}px`
    //         }}
    //       >
    //         {checkpoint.number}
    //       </div>
    //     </div>
    //   );
    // }

    // Starting positions (if no checkpoint there)
    const startingPosition = board.startingPositions.find(
      sp => sp.position.x === x && sp.position.y === y
    );
    if (startingPosition) {
      elements.push(
        <div key="starting-pos" className="absolute inset-0">
          {/* Background highlight */}
          <div className="absolute inset-0 bg-green-600 opacity-30" />

          {/* Position number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-white text-black font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-green-600"
              style={{
                width: tileSize * 0.6,
                height: tileSize * 0.6,
                fontSize: tileSize * 0.3
              }}
            >
              {startingPosition.number}
            </div>
          </div>
        </div>
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

  const renderLaserBeams = () => {
    const beams = getAllLaserBeams();
    const allElements: React.ReactElement[] = [];

    // Only show explosions during execution phase
    //const shouldShowExplosions = gameState?.phase === 'executing';
    const shouldShowExplosions = false;

    beams.forEach((beam, beamIndex) => {
      // Skip robot lasers if handled by RobotLaserAnimation
      if (beam.isRobotLaser) {
        return;
      }

      // Determine if the laser actually hit something
      let hitInfo: { type: 'robot' | 'wall'; position: Position } | null = null;

      // Only check for hits if we're in execution phase
      if (shouldShowExplosions && beam.path.length > 0) {
        const lastPos = beam.path[beam.path.length - 1];

        // Check if there's a robot at the last position
        if (isBlockedByRobot(lastPos.x, lastPos.y)) {
          hitInfo = { type: 'robot', position: lastPos };
        } else {
          // Check if the laser stopped due to a wall
          // First, check if laser could have continued further
          const laserDir = beam.laser.direction;
          const dx = [0, 1, 0, -1][laserDir];
          const dy = [-1, 0, 1, 0][laserDir];
          const nextX = lastPos.x + dx;
          const nextY = lastPos.y + dy;

          // If next position would be on the board, check why we stopped
          if (nextX >= 0 && nextX < board.width &&
            nextY >= 0 && nextY < board.height) {
            // We stopped before the edge - check for wall
            const fromPos = lastPos;
            const toPos = { x: nextX, y: nextY };

            // Check if there's a wall blocking the path forward
            const lastTile = getTileAt(lastPos.x, lastPos.y);
            if (lastTile && lastTile.walls && lastTile.walls.includes(laserDir)) {
              // Wall on current tile blocking exit
              hitInfo = { type: 'wall', position: lastPos };
            } else {
              // Check if wall on next tile blocking entry
              const nextTile = getTileAt(nextX, nextY);
              const oppositeDir = (laserDir + 2) % 4;
              if (nextTile && nextTile.walls && nextTile.walls.includes(oppositeDir)) {
                hitInfo = { type: 'wall', position: lastPos };
              }
            }
          }
          // If we reached the board edge naturally, no explosion needed
        }
      } else if (shouldShowExplosions && beam.path.length === 0) {
        // Laser has no path - it might be blocked immediately at source
        // Check if there's a wall at the source blocking the laser
        const sourceTile = getTileAt(beam.laser.position.x, beam.laser.position.y);
        if (sourceTile && sourceTile.walls && sourceTile.walls.includes(beam.laser.direction)) {
          hitInfo = { type: 'wall', position: beam.laser.position };
        }
      }

      // Render the laser beam path
      beam.path.forEach((pos, pathIndex) => {
        const isHorizontal = beam.laser.direction === 1 || beam.laser.direction === 3;
        const isDoubleLaser = beam.laser.damage > 1;
        const beamWidth = isDoubleLaser ? 8 : 4;
        const beamLength = tileSize;

        // Position calculations
        let left = pos.x * tileSize;
        let top = pos.y * tileSize;

        // Adjust starting position for source tile
        if (pathIndex === 0) {
          const indicatorSize = Math.floor(tileSize * 0.2);
          const indicatorOffset = 2;

          switch (beam.laser.direction) {
            case 0: // North
              top -= indicatorSize - indicatorOffset;
              break;
            case 1: // East
              left += indicatorSize - indicatorOffset;
              break;
            case 2: // South
              top += indicatorSize - indicatorOffset;
              break;
            case 3: // West
              left -= indicatorSize - indicatorOffset;
              break;
          }
        }

        if (isHorizontal) {
          top += (tileSize - beamWidth) / 2;
        } else {
          left += (tileSize - beamWidth) / 2;
        }

        // Render beam segment (single or double)
        if (isDoubleLaser) {
          const spacing = 6;
          const singleBeamWidth = 3;

          allElements.push(
            <React.Fragment key={`laser-${beamIndex}-${pathIndex}`}>
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
            </React.Fragment>
          );
        } else {
          allElements.push(
            <div
              key={`laser-${beamIndex}-${pathIndex}`}
              className="absolute animate-pulse"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: isHorizontal ? `${beamLength}px` : `${beamWidth}px`,
                height: isHorizontal ? `${beamWidth}px` : `${beamLength}px`,
                backgroundColor: 'rgba(220, 38, 38, 0.7)',
                boxShadow: '0 0 8px rgba(220, 38, 38, 0.8)',
                zIndex: 10
              }}
            />
          );
        }
      });

      // Only add explosion effect if we actually hit something
      if (hitInfo) {
        const explosionX = hitInfo.position.x * tileSize + tileSize / 2;
        const explosionY = hitInfo.position.y * tileSize + tileSize / 2;
        const isRobotHit = hitInfo.type === 'robot';

        // Add a timestamp-based key to ensure explosions are unique per execution
        const explosionKey = `explosion-${beamIndex}-${Date.now()}`;

        allElements.push(
          <div
            key={explosionKey}
            className="absolute pointer-events-none"
            style={{
              left: `${explosionX}px`,
              top: `${explosionY}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 15
            }}
          >
            {/* Explosion burst */}
            <div
              className="absolute"
              style={{
                width: isRobotHit ? '60px' : '40px',
                height: isRobotHit ? '60px' : '40px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: isRobotHit ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 165, 0, 0.4)',
                borderRadius: '50%',
                animation: 'explosionPulse 0.5s ease-out forwards'
              }}
            />

            {/* Impact core */}
            <div
              className="absolute"
              style={{
                width: isRobotHit ? '30px' : '20px',
                height: isRobotHit ? '30px' : '20px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: isRobotHit
                  ? 'radial-gradient(circle, rgba(255,255,0,0.8) 0%, rgba(255,0,0,0.6) 50%, transparent 100%)'
                  : 'radial-gradient(circle, rgba(255,255,0,0.8) 0%, rgba(255,165,0,0.6) 50%, transparent 100%)',
                borderRadius: '50%',
                boxShadow: isRobotHit
                  ? '0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 255, 0, 0.6)'
                  : '0 0 15px rgba(255, 165, 0, 0.8)',
                animation: 'explosionCore 0.5s ease-out forwards'
              }}
            />
          </div>
        );
      }
    });

    return allElements;
  };

  return (
    <div
      ref={containerRef}
      //className="flex items-center justify-center h-full w-full"  // Back to simple flex centering
      //className="inset-0 flex items-center justify-center"
      //className="min-h-screen w-full flex items-center justify-center"  // Force minimum screen height
      className="w-full h-full flex items-center justify-center"  // Use w-full h-full to fill parent
    //absolute inset-0 flex items-center justify-center
    //style={{ border: '2px solid red' }}  // Keep for debugging
    >
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

        {/* Render robot laser animations */}
        <RobotLaserAnimation
          players={players}
          activeLasers={activeLasers}
          tileSize={tileSize}
        />
      </div>
    </div>
  );
}