import React from 'react';
import { Laser, Position, Direction } from '@/lib/game/types';

interface LaserBeamRendererProps {
  lasers: Laser[];
  boardWidth: number;
  boardHeight: number;
  tileSize: number;
  getWallsAt: (x: number, y: number) => Direction[];
}

export const calculateLaserBeamPath = (
  laser: Laser,
  boardWidth: number,
  boardHeight: number,
  getWallsAt: (x: number, y: number) => Direction[]
): Position[] => {
  const path: Position[] = [];
  let currentX = laser.position.x;
  let currentY = laser.position.y;
  
  // Direction vectors: 0=North, 1=East, 2=South, 3=West
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  
  const direction = Number(laser.direction);
  
  // Start from the laser source tile itself
  path.push({ x: currentX, y: currentY });
  
  // Check if laser is blocked by wall at source
  const walls = getWallsAt(currentX, currentY);
  if (walls.includes(direction)) {
    return path; // Laser blocked immediately but still show on source tile
  }
  
  // Move to next tile
  currentX += dx[direction];
  currentY += dy[direction];
  
  // Trace the full path until hitting board edge or wall
  while (currentX >= 0 && currentX < boardWidth && 
         currentY >= 0 && currentY < boardHeight) {
    
    // Check if entry to this tile is blocked by a wall
    const targetWalls = getWallsAt(currentX, currentY);
    const oppositeDir = ((direction + 2) % 4) as Direction;
    if (targetWalls.includes(oppositeDir)) {
      break; // Wall blocks entry to this tile
    }
    
    // Add this position to the path
    path.push({ x: currentX, y: currentY });
    
    // Check if exit from this tile is blocked by a wall
    const currentWalls = getWallsAt(currentX, currentY);
    if (currentWalls.includes(direction)) {
      break; // Wall blocks exit from this tile
    }
    
    // Move to next tile
    currentX += dx[direction];
    currentY += dy[direction];
  }
  
  return path;
};

const LaserBeamRenderer: React.FC<LaserBeamRendererProps> = ({
  lasers,
  boardWidth,
  boardHeight,
  tileSize,
  getWallsAt
}) => {
  const renderBeams = () => {
    const allBeams: React.ReactElement[] = [];
    
    lasers.forEach((laser, laserIndex) => {
      const path = calculateLaserBeamPath(laser, boardWidth, boardHeight, getWallsAt);
      const direction = Number(laser.direction);
      const isHorizontal = direction === 1 || direction === 3;
      const isTripleLaser = laser.damage >= 3;
      const isDoubleLaser = laser.damage === 2;
      const beamWidth = isDoubleLaser ? 8 : 4;
      
      
      path.forEach((pos, pathIndex) => {
        let left = pos.x * tileSize;
        let top = pos.y * tileSize;
        let beamLength = tileSize; // Default beam length
        
        // Adjust starting position and length for source tile (first segment)
        if (pathIndex === 0) {
          const indicatorSize = Math.floor(tileSize * 0.2);
          const indicatorOffset = 2;
          const adjustment = indicatorSize - indicatorOffset;
          
          switch (direction) {
            case 0: // North - beam goes up
              // Don't adjust position, just shorten from bottom
              beamLength -= adjustment; // Shorten from bottom
              break;
            case 1: // East - beam goes right
              left += adjustment;
              beamLength -= adjustment; // Shorten from left
              break;
            case 2: // South - beam goes down
              top += adjustment;
              beamLength -= adjustment; // Shorten from top
              break;
            case 3: // West - beam goes left
              // Don't adjust position, just shorten from left side
              beamLength -= adjustment; // Shorten from left
              break;
          }
        }
        
        // Center the beam within the tile for single lasers
        if (!isTripleLaser && !isDoubleLaser) {
          if (isHorizontal) {
            top += (tileSize - beamWidth) / 2;
          } else {
            left += (tileSize - beamWidth) / 2;
          }
        }
        
        if (isTripleLaser) {
          // Triple laser - render 3 beams with perpendicular offset
          const beamSpacing = 10;
          const singleBeamWidth = 2;
          
          // Center beam should be at tile center
          const tileCenter = tileSize / 2;
          
          for (let i = -1; i <= 1; i++) {
            const offset = i * beamSpacing;
            allBeams.push(
              <div
                key={`laser-${laserIndex}-${pathIndex}-beam${i}`}
                className="absolute animate-pulse pointer-events-none"
                style={{
                  left: isHorizontal ? `${left}px` : `${left + tileCenter - singleBeamWidth/2 + offset}px`,
                  top: isHorizontal ? `${top + tileCenter - singleBeamWidth/2 + offset}px` : `${top}px`,
                  width: isHorizontal ? `${beamLength}px` : `${singleBeamWidth}px`,
                  height: isHorizontal ? `${singleBeamWidth}px` : `${beamLength}px`,
                  backgroundColor: 'rgba(220, 38, 38, 0.7)',
                  boxShadow: '0 0 4px rgba(220, 38, 38, 0.8)',
                  zIndex: 15
                }}
              />
            );
          }
        } else if (isDoubleLaser) {
          // Double laser - render 2 beams with perpendicular offset
          const beamSpacing = 10;
          const singleBeamWidth = 3;
          
          // Center the group of beams
          const centerOffset = (tileSize - beamSpacing) / 2;
          
          for (let i = 0; i <= 1; i++) {
            const offset = i * beamSpacing;
            allBeams.push(
              <div
                key={`laser-${laserIndex}-${pathIndex}-beam${i}`}
                className="absolute animate-pulse pointer-events-none"
                style={{
                  left: isHorizontal ? `${left}px` : `${left + centerOffset + offset}px`,
                  top: isHorizontal ? `${top + centerOffset + offset}px` : `${top}px`,
                  width: isHorizontal ? `${beamLength}px` : `${singleBeamWidth}px`,
                  height: isHorizontal ? `${singleBeamWidth}px` : `${beamLength}px`,
                  backgroundColor: 'rgba(220, 38, 38, 0.7)',
                  boxShadow: '0 0 4px rgba(220, 38, 38, 0.8)',
                  zIndex: 15
                }}
              />
            );
          }
        } else {
          allBeams.push(
            <div
              key={`laser-${laserIndex}-${pathIndex}`}
              className="absolute animate-pulse pointer-events-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: isHorizontal ? `${beamLength}px` : `${beamWidth}px`,
                height: isHorizontal ? `${beamWidth}px` : `${beamLength}px`,
                backgroundColor: 'rgba(220, 38, 38, 0.7)',
                boxShadow: '0 0 4px rgba(220, 38, 38, 0.8)',
                zIndex: 15
              }}
            />
          );
        }
      });
    });
    
    return allBeams;
  };

  return <>{renderBeams()}</>;
};

export default LaserBeamRenderer;