// Helper functions for board editor operations
// These work with BoardDefinition format, not the runtime Board format
//
// IMPORTANT: These functions are different from tile-utils.ts functions:
// - These work with BoardDefinition (editor/definition format)
// - tile-utils.ts works with Board/Course (runtime game format)
// 
// BoardDefinition uses separate arrays for tiles, walls, lasers, etc.
// Board uses a 2D array of Tile objects with embedded properties

import { BoardDefinition, TileElement, LaserElement, StartingPosition, Direction } from './types';

/**
 * Get tile element at a specific position in a board definition
 */
export function getTileElementAt(boardDef: BoardDefinition, x: number, y: number): TileElement | undefined {
    return boardDef.tiles?.find(tile => tile.position.x === x && tile.position.y === y);
}

/**
 * Get starting position at a specific position in a board definition
 */
export function getStartingPositionAt(boardDef: BoardDefinition, x: number, y: number): StartingPosition | undefined {
    return boardDef.startingPositions?.find(pos => pos.position.x === x && pos.position.y === y);
}

/**
 * Get laser element at a specific position in a board definition
 */
export function getLaserElementAt(boardDef: BoardDefinition, x: number, y: number): LaserElement | undefined {
    return boardDef.lasers?.find(laser => laser.position.x === x && laser.position.y === y);
}

/**
 * Get walls at a specific position in a board definition
 */
export function getWallsAt(boardDef: BoardDefinition, x: number, y: number): Direction[] {
    const wallElement = boardDef.walls?.find(wall => wall.position.x === x && wall.position.y === y);
    return wallElement?.sides || [];
}

/**
 * Check if a position has a specific wall side
 */
export function hasWallSide(boardDef: BoardDefinition, x: number, y: number, side: Direction): boolean {
    const walls = getWallsAt(boardDef, x, y);
    return walls.includes(side);
}