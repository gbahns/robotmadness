import React, { useEffect, useState, useRef } from 'react';
import { Player, Direction, Tile, Checkpoint, Laser } from '@/lib/game/types';
import RobotLaserAnimation, { RobotLaserShot } from './RobotLaserAnimation';
import Robot from './Robot';
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


const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function Board({ board, players, activeLasers = [], currentPlayerId, onTileSizeChange, checkpoints = [] }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(50);

  useEffect(() => {
    const calculateTileSize = () => {
      if (!containerRef.current || !board) return;

      // ROBUST BOARD SIZING LOGIC
      // This finds the game container and calculates optimal tile size
      // Priority order for finding container:
      // 1. The main game board area (flex-1 container)
      // 2. Any parent with h-full class
      // 3. Direct parent's parent as fallback
      
      let gameBoardContainer: Element | null = containerRef.current.closest('.flex-1.flex.justify-center.items-center');
      if (!gameBoardContainer) {
        gameBoardContainer = containerRef.current.closest('[class*="h-full"]');
      }
      if (!gameBoardContainer) {
        const parent = containerRef.current.parentElement?.parentElement;
        gameBoardContainer = parent || null;
      }
      
      if (!gameBoardContainer) {
        console.warn('Board: Could not find suitable parent container for sizing');
        return;
      }

      const parentWidth = gameBoardContainer.clientWidth;
      const parentHeight = gameBoardContainer.clientHeight;

      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Board sizing:', {
          parentWidth,
          parentHeight,
          boardWidth: board.width,
          boardHeight: board.height,
          container: gameBoardContainer.className.substring(0, 50)
        });
      }

      // Calculate tile size with minimal padding
      // Padding: 20px horizontal (10px each side), 40px vertical (20px each side)
      const maxWidthTileSize = Math.floor((parentWidth - 20) / board.width);
      const maxHeightTileSize = Math.floor((parentHeight - 40) / board.height);

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

    // Observe the parent container for size changes
    const resizeObserver = new ResizeObserver(calculateTileSize);
    let observeTarget: Element | null = null;
    
    if (containerRef.current) {
      observeTarget = containerRef.current.closest('.flex-1.flex.justify-center.items-center') ||
                     containerRef.current.closest('[class*="h-full"]') ||
                     containerRef.current.parentElement?.parentElement ||
                     null;
    }
    
    if (observeTarget) {
      resizeObserver.observe(observeTarget);
    }

    return () => {
      window.removeEventListener('resize', calculateTileSize);
      resizeObserver.disconnect();
    };
  }, [board, onTileSizeChange]);

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
      (w) => w.position.x === x && w.position.y === y
    );

    return wall ? wall.sides : [];
  };

  // Get laser at position (for enhanced boards)
  const getLaserAt = (x: number, y: number): Laser | undefined => {
    if (board.lasers && Array.isArray(board.lasers)) {
      return board.lasers.find((laser) => laser.position?.x === x && laser.position?.y === y);
    }
    return undefined;
  };

  // Calculate responsive sizes based on tile size
  // robotSize calculation removed - now using tileSize * 0.8 directly in robot rendering

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

    // Base tile (no tooltip here anymore)
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
            rotate={tile.rotate}
            tileSize={tileSize}
          />
        );
      }


      // Pits
      if (tile.type === 'pit') {
        elements.push(
          <Pit key="pit" />
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
            registers={tile.registers}
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

      walls.forEach((direction) => {
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

    // Players are now rendered as a separate layer for animation

    return elements;
  };

  // Collect board lasers for rendering
  const collectBoardLasers = (): Laser[] => {
    const lasers: Laser[] = [];
    
    // Check for lasers array on board
    if (board.lasers && Array.isArray(board.lasers)) {
      board.lasers.forEach((laser) => {
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
      className="w-full h-full flex"  // Use w-full h-full to fill parent
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
        <div className="pointer-events-none">
          <LaserBeamRenderer 
            lasers={collectBoardLasers()}
            boardWidth={board.width}
            boardHeight={board.height}
            tileSize={tileSize}
            getWallsAt={getWallsAtForRenderer}
          />
        </div>

        {/* Render robots as separate animated layer */}
        {Object.values(players).map((player) => {
          if (player.lives <= 0) return null;
          
          const playerIndex = getPlayerIndex(player.id);
          
          return (
            <div
              key={player.id}
              className="absolute transition-all duration-500 ease-in-out pointer-events-none"
              style={{
                left: player.position.x * tileSize,
                top: player.position.y * tileSize,
                width: tileSize,
                height: tileSize,
                zIndex: 30
              }}
            >
              <div className="absolute inset-1">
                <Robot
                  player={player}
                  color={ROBOT_COLORS[playerIndex % ROBOT_COLORS.length]}
                  isCurrentPlayer={player.id === currentPlayerId}
                  size={tileSize * 0.8}
                />
              </div>
            </div>
          );
        })}

        {/* Render robot laser animations */}
        <div className="pointer-events-none">
          <RobotLaserAnimation
            players={players}
            activeLasers={activeLasers}
            tileSize={tileSize}
          />
        </div>
      </div>
    </div>
  );
}