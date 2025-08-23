import React, { useEffect, useState, useRef } from 'react';
import { Board as BoardType, Player, Direction, Position, Tile as TileType, Checkpoint, Laser, StartingPosition } from '@/lib/game/types';
import { Tile, ConveyorBelt, Gear, Pit, RepairSite, Pusher, LaserEmitter, Wall } from './board-elements';
import Robot from './Robot';
import RobotLaserAnimation, { RobotLaserShot } from './RobotLaserAnimation';
import { getTileAt as getCanonicalTileAt } from '@/lib/game/tile-utils';

interface BoardRendererProps {
  board: BoardType;
  players?: Record<string, Player>;
  currentPlayerId?: string;
  checkpoints?: Checkpoint[];
  startingPositions?: StartingPosition[];
  activeLasers?: RobotLaserShot[];
  
  // Editor-specific props
  editMode?: boolean;
  showGrid?: boolean;
  showCoordinates?: boolean;
  fixedTileSize?: number;
  hoveredTile?: { x: number; y: number };
  selectedTool?: 'tile' | 'laser' | 'wall' | 'start';
  previewElement?: React.ReactNode;
  
  // Event handlers for edit mode
  onTileClick?: (x: number, y: number, e: React.MouseEvent) => void;
  onTileMouseDown?: (x: number, y: number, e: React.MouseEvent) => void;
  onTileMouseEnter?: (x: number, y: number, e: React.MouseEvent) => void;
  onTileMouseMove?: (x: number, y: number, e: React.MouseEvent) => void;
  onTileMouseUp?: (x: number, y: number, e: React.MouseEvent) => void;
  onTileMouseLeave?: () => void;
  
  // Callbacks
  onTileSizeChange?: (tileSize: number) => void;
}

const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function BoardRenderer({
  board,
  players = {},
  currentPlayerId,
  checkpoints = [],
  startingPositions = [],
  activeLasers = [],
  editMode = false,
  showGrid = true,
  showCoordinates = false,
  fixedTileSize,
  hoveredTile,
  selectedTool,
  previewElement,
  onTileClick,
  onTileMouseDown,
  onTileMouseEnter,
  onTileMouseMove,
  onTileMouseUp,
  onTileMouseLeave,
  onTileSizeChange
}: BoardRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(fixedTileSize || 50);
  const [fontSize, setFontSize] = useState(12);
  const [arrowSize, setArrowSize] = useState(30);

  // Calculate tile size dynamically if not fixed
  useEffect(() => {
    if (fixedTileSize) {
      setTileSize(fixedTileSize);
      setFontSize(fixedTileSize * 0.3);
      setArrowSize(fixedTileSize * 0.6);
      return;
    }

    const calculateTileSize = () => {
      if (!containerRef.current || !board) return;

      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      
      // Account for padding (16px = 8px on each side)
      const availableWidth = parentWidth - 16;
      const availableHeight = parentHeight - 16;

      const maxWidthTileSize = Math.floor(availableWidth / board.width);
      const maxHeightTileSize = Math.floor(availableHeight / board.height);

      const newTileSize = Math.min(maxWidthTileSize, maxHeightTileSize, 120);
      const finalTileSize = Math.max(newTileSize, 30);

      setTileSize(finalTileSize);
      setFontSize(finalTileSize * 0.3);
      setArrowSize(finalTileSize * 0.6);

      if (onTileSizeChange) {
        onTileSizeChange(finalTileSize);
      }
    };

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
  }, [board, fixedTileSize, onTileSizeChange]);

  const getTileAt = (x: number, y: number): TileType | undefined => {
    return getCanonicalTileAt(board, x, y);
  };

  const getWallsAt = (x: number, y: number): number[] => {
    const tile = getTileAt(x, y);
    const walls = tile?.walls || [];
    if (walls.length > 0) {
      console.log(`BoardRenderer: Walls at (${x},${y}):`, walls);
    }
    return walls;
  };

  const getCheckpointAt = (x: number, y: number): Checkpoint | undefined => {
    return checkpoints.find(cp => cp.position.x === x && cp.position.y === y);
  };

  const getStartingPositionAt = (x: number, y: number): StartingPosition | undefined => {
    return startingPositions.find(sp => sp.position.x === x && sp.position.y === y);
  };

  const getLaserAt = (x: number, y: number): Laser | undefined => {
    return board.lasers?.find(l => l.position.x === x && l.position.y === y);
  };

  const getPlayersAt = (x: number, y: number): Player[] => {
    return Object.values(players).filter(p => p.position.x === x && p.position.y === y && p.lives > 0);
  };

  const renderTile = (x: number, y: number) => {
    const tile = getTileAt(x, y);
    const walls = getWallsAt(x, y);
    const checkpoint = getCheckpointAt(x, y);
    const startingPos = getStartingPositionAt(x, y);
    const laser = getLaserAt(x, y);
    const playersHere = getPlayersAt(x, y);
    const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;

    // Find assigned player for starting position
    const assignedPlayer = startingPos ? 
      Object.values(players).find(p => (p as any).startingPosition?.number === startingPos.number) : 
      undefined;

    // Get visited players for checkpoint
    const visitedBy = checkpoint ? 
      Object.values(players)
        .filter(p => p.checkpointsVisited >= checkpoint.number)
        .map(p => p.name) :
      [];

    return (
      <div
        key={`${x}-${y}`}
        className={`relative ${editMode ? 'cursor-pointer' : ''}`}
        style={{ width: tileSize, height: tileSize }}
        onClick={editMode && onTileClick ? (e) => onTileClick(x, y, e) : undefined}
        onMouseDown={editMode && onTileMouseDown ? (e) => onTileMouseDown(x, y, e) : undefined}
        onMouseEnter={editMode && onTileMouseEnter ? (e) => onTileMouseEnter(x, y, e) : undefined}
        onMouseMove={editMode && onTileMouseMove ? (e) => onTileMouseMove(x, y, e) : undefined}
        onMouseUp={editMode && onTileMouseUp ? (e) => onTileMouseUp(x, y, e) : undefined}
        onMouseLeave={editMode && onTileMouseLeave ? onTileMouseLeave : undefined}
      >
        <Tile
          tile={tile}
          walls={walls}
          checkpoint={checkpoint}
          startingPosition={startingPos}
          laser={laser}
          playerName={assignedPlayer?.name}
          visitedBy={visitedBy}
          tileSize={tileSize}
          x={x}
          y={y}
          showGrid={showGrid}
        />

        {/* Hover preview for editor */}
        {editMode && isHovered && previewElement && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {previewElement}
          </div>
        )}

        {/* Render robots */}
        {playersHere.map((player, index) => {
          const playerIndex = Object.keys(players).indexOf(player.id);
          const robotColor = ROBOT_COLORS[playerIndex % ROBOT_COLORS.length];
          
          return (
            <div key={player.id} className="absolute inset-1 z-30">
              <Robot
                player={player}
                color={robotColor}
                isCurrentPlayer={player.id === currentPlayerId}
                size={tileSize - 8}
              />
            </div>
          );
        })}

        {/* Grid coordinates overlay */}
        {showCoordinates && tileSize >= 30 && (
          <div className="absolute top-0 left-0 text-xs text-gray-800 bg-white bg-opacity-75 px-1 rounded-br leading-none pointer-events-none z-40">
            {x},{y}
          </div>
        )}
      </div>
    );
  };

  // Render laser beams (for game mode)
  const renderLaserBeams = () => {
    if (editMode) return null;
    
    // This would need the laser beam calculation logic from the original Board component
    // For now, returning null to keep it simple
    return null;
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No board data</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center"
      style={{ 
        width: '100%',
        height: '100%'
      }}
    >
      <div 
        className="relative bg-gray-800 p-2"
        style={{
          width: board.width * tileSize + 16,
          height: board.height * tileSize + 16
        }}
      >
        <div className="grid" style={{ 
          gridTemplateColumns: `repeat(${board.width}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${board.height}, ${tileSize}px)`
        }}>
          {Array.from({ length: board.height }, (_, y) =>
            Array.from({ length: board.width }, (_, x) => renderTile(x, y))
          )}
        </div>

        {renderLaserBeams()}

        {/* Active laser animations - only in game mode */}
        {!editMode && activeLasers.length > 0 && (
          <RobotLaserAnimation 
            players={players}
            activeLasers={activeLasers} 
            tileSize={tileSize} 
          />
        )}
      </div>
    </div>
  );
}