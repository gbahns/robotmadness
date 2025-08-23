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
  playerName?: string; // For starting position
  visitedBy?: string[]; // For checkpoints
  tileSize: number;
  x: number;
  y: number;
  showGrid?: boolean;
  onClick?: () => void;
}

export default function Tile({ 
  tile, 
  walls = [], 
  checkpoint, 
  startingPosition,
  laser,
  playerName,
  visitedBy = [],
  tileSize, 
  x, 
  y,
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
              direction={(tile as any).direction || 0}
              rotate={(tile as any).rotate}
              tileSize={tileSize}
            />
          )}
          
          {(tile.type === 'gear_cw' || tile.type === 'gear_ccw') && (
            <Gear type={tile.type} tileSize={tileSize} />
          )}
          
          {tile.type === 'pit' && (
            <Pit tileSize={tileSize} />
          )}
          
          {(tile.type === 'repair' || tile.type === 'option') && (
            <RepairSite type={tile.type} tileSize={tileSize} />
          )}
          
          {tile.type === 'pusher' && (
            <Pusher
              direction={(tile as any).direction || 0}
              registers={(tile as any).registers}
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
          playerName={playerName}
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