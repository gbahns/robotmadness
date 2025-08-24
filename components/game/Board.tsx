import React, { useEffect, useState, useRef } from 'react';
import { BoardDefinition, Course, Player, Direction, Position, Tile, Checkpoint, Laser, TileType } from '@/lib/game/types';
import RobotLaserAnimation, { RobotLaserShot } from './RobotLaserAnimation';
import Robot from './Robot';
import { socketClient } from '@/lib/socket';
import { getTileAt as getCanonicalTileAt } from '@/lib/game/tile-utils';
import { Board as BoardType } from '@/lib/game/types';
import { Pit, ConveyorBelt, Gear, RepairSite, Pusher } from './board-elements';
import LaserBeamRenderer from './LaserBeamRenderer';


interface BoardProps {
  board: BoardType;  // Use the Board type from types.ts
  players: Record<string, Player>;
  currentPlayerId?: string;
  tileSize?: number;
  activeLasers?: RobotLaserShot[];
  onTileSizeChange?: (tileSize: number) => void;
  checkpoints?: Checkpoint[];
}

// Direction mapping for visual arrows
const DIRECTION_ARROWS = ['↑', '→', '↓', '←'];

const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, activeLasers = [], currentPlayerId, onTileSizeChange, checkpoints = [] }: BoardProps) {
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

  // Generate tooltip text for a tile
  const getTileTooltip = (x: number, y: number): string => {
    const tile = getTileAt(x, y);
    const parts: string[] = [`Tile (${x}, ${y})`];

    if (!tile) {
      parts.push("Type: Empty");
      return parts.join("\n");
    }

    // Add tile type
    const typeNames: Record<string, string> = {
      'empty': 'Empty',
      'conveyor': 'Conveyor Belt',
      'express': 'Express Conveyor',
      'gear_left': 'Gear (Left)',
      'gear_right': 'Gear (Right)',
      'pit': 'Pit',
      'repair': 'Repair Site',
      'option': 'Option Site',
      'start': 'Starting Position',
      'pusher': 'Pusher'
    };
    parts.push(`Type: ${typeNames[tile.type] || tile.type}`);

    // Add direction if present
    if (tile.direction !== undefined) {
      const dirNames = ['North', 'East', 'South', 'West'];
      parts.push(`Direction: ${dirNames[tile.direction]}`);
    }

    // Add walls if present
    if (tile.walls && tile.walls.length > 0) {
      const wallNames = tile.walls.map(w => ['North', 'East', 'South', 'West'][w]).join(', ');
      parts.push(`Walls: ${wallNames}`);
    }

    // Add rotation info
    if (tile.rotate) {
      parts.push(`Rotates: ${tile.rotate}`);
    }

    // Add registers if present
    if (tile.registers && tile.registers.length > 0) {
      if (tile.type === 'pusher') {
        parts.push(`Active on registers: ${tile.registers.join(', ')}`);
      } else {
        parts.push(`Registers: ${tile.registers.join(', ')}`);
      }
    }

    // Add starting positions
    const startPos = board.startingPositions?.find(sp => sp.position.x === x && sp.position.y === y);
    if (startPos) {
      // Find the player assigned to this starting position
      const assignedPlayer = Object.values(players).find(p => p.startingPosition?.number === startPos.number);
      const playerName = assignedPlayer ? assignedPlayer.name : `Position ${startPos.number}`;
      parts.push(`Starting Position: ${playerName}`);
    }

    // Add checkpoints
    const checkpoint = checkpoints.find(cp => cp.position.x === x && cp.position.y === y);
    if (checkpoint) {
      parts.push(`Checkpoint: ${checkpoint.number}`);
    }

    // Add lasers
    const laser = board.lasers?.find(l => l.position.x === x && l.position.y === y);
    if (laser) {
      const dirNames = ['North', 'East', 'South', 'West'];
      parts.push(`Laser: ${laser.damage} damage ${dirNames[laser.direction]}`);
    }

    // Add robots on this tile
    const robotsOnTile = Object.values(players).filter(p => p.position.x === x && p.position.y === y && p.lives > 0);
    if (robotsOnTile.length > 0) {
      const dirNames = ['North', 'East', 'South', 'West'];
      const robotInfo = robotsOnTile.map(r => `${r.name} (${dirNames[r.direction]})`).join(', ');
      parts.push(`Robots: ${robotInfo}`);
    }

    return parts.join("\n");
  };

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
        elements.push(
          <ConveyorBelt
            key="conveyor"
            type={tile.type === 'express' ? 'express' : 'conveyor'}
            direction={tile.direction || 0}
            rotate={tile.rotate === 'counterclockwise' ? 'counter-clockwise' : tile.rotate === 'clockwise' ? 'clockwise' : undefined}
            tileSize={tileSize}
          />
        );
      }


      // Pits
      if (tile.type === 'pit') {
        elements.push(
          <Pit key="pit" tileSize={tileSize} />
        );
      }

      // Repair sites
      if (tile.type === 'repair') {
        elements.push(
          <RepairSite key="repair" type="repair" tileSize={tileSize} />
        );
      }

      // Option sites
      if (tile.type === 'option') {
        elements.push(
          <RepairSite key="option" type="option" tileSize={tileSize} />
        );
      }

      // Gears
      if (tile.type === 'gear_cw' || tile.type === 'gear_ccw') {
        elements.push(
          <Gear key="gear" type={tile.type} tileSize={tileSize} />
        );
      }

      // Pushers
      if (tile.type === 'pusher') {
        elements.push(
          <Pusher 
            key="pusher"
            direction={tile.direction || 0}
            registers={(tile as any).registers}
            tileSize={tileSize}
          />
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
          <div key={player.id} className="absolute inset-1 z-30">
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

  // Collect board lasers for rendering
  const collectBoardLasers = (): Laser[] => {
    const lasers: Laser[] = [];
    
    // Check for lasers array on board
    if (board.lasers && Array.isArray(board.lasers)) {
      board.lasers.forEach((laser: any) => {
        lasers.push({
          position: laser.position,
          direction: laser.direction as Direction,
          damage: laser.damage || 1
        });
      });
    }
    
    return lasers;
  };
  
  // Get walls at a position (wrapper for LaserBeamRenderer compatibility)
  const getWallsAtForRenderer = (x: number, y: number): Direction[] => {
    const tile = getTileAt(x, y);
    return tile?.walls || [];
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
              title={getTileTooltip(x, y)}
            >
              {getTileContent(x, y)}
            </div>
          ))
        ))}

        {/* Render laser beams on top of tiles but below robots */}
        <LaserBeamRenderer 
          lasers={collectBoardLasers()}
          boardWidth={board.width}
          boardHeight={board.height}
          tileSize={tileSize}
          getWallsAt={getWallsAtForRenderer}
        />

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