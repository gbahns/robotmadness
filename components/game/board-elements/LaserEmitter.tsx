import React from 'react';
import { Direction } from '@/lib/game/types';

interface LaserEmitterProps {
  direction: number;
  damage: number;
  tileSize: number;
}

export default function LaserEmitter({ direction, damage, tileSize }: LaserEmitterProps) {
  const indicatorSize = Math.floor(tileSize * 0.15);
  const indicatorOffset = 2;
  
  // For double lasers, create two separate blocks
  if (damage > 1) {
    const spacing = 6;
    const blockSize = indicatorSize * 1.4;
    
    return (
      <>
        {/* First block */}
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#fde047',
            border: '1px solid #a16207',
            zIndex: 5,
            ...(direction === Direction.UP ? {
              bottom: indicatorOffset,
              left: '50%',
              transform: `translateX(calc(-50% - ${spacing}px))`,
              width: blockSize,
              height: indicatorSize
            } : direction === Direction.RIGHT ? {
              left: indicatorOffset,
              top: '50%',
              transform: `translateY(calc(-50% - ${spacing}px))`,
              width: indicatorSize,
              height: blockSize
            } : direction === Direction.DOWN ? {
              top: indicatorOffset,
              left: '50%',
              transform: `translateX(calc(-50% - ${spacing}px))`,
              width: blockSize,
              height: indicatorSize
            } : {
              right: indicatorOffset,
              top: '50%',
              transform: `translateY(calc(-50% - ${spacing}px))`,
              width: indicatorSize,
              height: blockSize
            })
          }}
        />
        {/* Second block */}
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#fde047',
            border: '1px solid #a16207',
            zIndex: 5,
            ...(direction === Direction.UP ? {
              bottom: indicatorOffset,
              left: '50%',
              transform: `translateX(calc(-50% + ${spacing}px))`,
              width: blockSize,
              height: indicatorSize
            } : direction === Direction.RIGHT ? {
              left: indicatorOffset,
              top: '50%',
              transform: `translateY(calc(-50% + ${spacing}px))`,
              width: indicatorSize,
              height: blockSize
            } : direction === Direction.DOWN ? {
              top: indicatorOffset,
              left: '50%',
              transform: `translateX(calc(-50% + ${spacing}px))`,
              width: blockSize,
              height: indicatorSize
            } : {
              right: indicatorOffset,
              top: '50%',
              transform: `translateY(calc(-50% + ${spacing}px))`,
              width: indicatorSize,
              height: blockSize
            })
          }}
        />
      </>
    );
  }
  
  // Single laser
  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: '#fde047',
        border: '1px solid #a16207',
        zIndex: 5,
        ...(direction === Direction.UP ? {
          bottom: indicatorOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          width: indicatorSize * 2,
          height: indicatorSize
        } : direction === Direction.RIGHT ? {
          left: indicatorOffset,
          top: '50%',
          transform: 'translateY(-50%)',
          width: indicatorSize,
          height: indicatorSize * 2
        } : direction === Direction.DOWN ? {
          top: indicatorOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          width: indicatorSize * 2,
          height: indicatorSize
        } : {
          right: indicatorOffset,
          top: '50%',
          transform: 'translateY(-50%)',
          width: indicatorSize,
          height: indicatorSize * 2
        })
      }}
    />
  );
}