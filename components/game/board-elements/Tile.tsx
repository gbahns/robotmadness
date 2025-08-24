import React from 'react';
import { Tile as TileType, Checkpoint as CheckpointType, StartingPosition as StartingPosType } from '@/lib/game/types';
import ConveyorBelt from './ConveyorBelt';
import Gear from './Gear';
import Pit from './Pit';
import RepairSite from './RepairSite';
import Pusher from './Pusher';
import Wall from './Wall';
import Checkpoint from './Checkpoint';
import StartingPosition from './StartingPosition';
import LaserEmitter from './LaserEmitter';

interface TileProps {
  tile?: TileType;
  walls?: number[];
  checkpoint?: CheckpointType;
  startingPosition?: StartingPosType;
  laser?: { position: { x: number; y: number }; direction: number; damage: number };
  visitedBy?: string[]; // For checkpoints
  tileSize: number;
  showGrid?: boolean;
  onClick?: () => void;
}

export default function Tile({ 
  tile, 
  walls = [], 
  checkpoint, 
  startingPosition,
  laser,
  visitedBy = [],
  tileSize, 
  showGrid = true,
  onClick
}: TileProps) {
  return (
    <div 
      className="relative"
      style={{ width: `${tileSize}px`, height: `${tileSize}px` }}
      onClick={onClick}
    >
      {/* Base tile */}
      <div 
        className={`absolute inset-0 bg-gray-400 ${showGrid ? 'border border-gray-600' : ''}`}
      />
      
      {/* Tile content based on type */}
      {tile && (
        <>
          {(tile.type === 'conveyor' || tile.type === 'express') && (
            <ConveyorBelt
              type={tile.type}
              direction={tile.direction || 0}
              rotate={tile.rotate}
              tileSize={tileSize}
            />
          )}
          
          {(tile.type === 'gear_cw' || tile.type === 'gear_ccw') && (
            <Gear type={tile.type} tileSize={tileSize} />
          )}
          
          {tile.type === 'pit' && (
            <Pit />
          )}
          
          {(tile.type === 'repair' || tile.type === 'option') && (
            <RepairSite type={tile.type} tileSize={tileSize} />
          )}
          
          {tile.type === 'pusher' && (
            <Pusher
              direction={tile.direction || 0}
              registers={tile.registers}
              tileSize={tileSize}
            />
          )}
        </>
      )}
      
      {/* Checkpoint */}
      {checkpoint && (
        <Checkpoint
          number={checkpoint.number}
          tileSize={tileSize}
          visitedBy={visitedBy}
        />
      )}
      
      {/* Starting position */}
      {startingPosition && (
        <StartingPosition
          number={startingPosition.number}
          tileSize={tileSize}
        />
      )}
      
      {/* Laser emitter */}
      {laser && (
        <LaserEmitter
          direction={laser.direction}
          damage={laser.damage}
          tileSize={tileSize}
        />
      )}
      
      {/* Walls - rendered last so they appear on top */}
      {walls.length > 0 && (
        <Wall directions={walls} tileSize={tileSize} />
      )}
    </div>
  );
}