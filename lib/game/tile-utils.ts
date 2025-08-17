import { Position, Tile, Course } from './types';

/**
 * Get tile at a specific position on the board
 * This is the canonical implementation that should be used throughout the codebase
 * 
 * @param board - The game board (Course['board'] containing tiles: Tile[][])
 * @param x - X coordinate 
 * @param y - Y coordinate
 * @returns Tile at position or undefined if invalid position or no tile
 */
export function getTileAt(board: Course['board'] | Tile[][], x: number, y: number): Tile | undefined {
    let tiles: Tile[][];

    // Handle Course['board'] format
    if ('tiles' in board && board.tiles) {
        tiles = board.tiles;
    } else if (Array.isArray(board)) {
        // Handle direct Tile[][] format
        tiles = board;
    } else {
        return undefined;
    }

    // Bounds checking
    if (!Array.isArray(tiles) || tiles.length === 0) {
        return undefined;
    }

    if (y < 0 || y >= tiles.length) {
        return undefined;
    }

    const row = tiles[y];
    if (!Array.isArray(row) || x < 0 || x >= row.length) {
        return undefined;
    }

    return row[x];
}

/**
 * Get tile at a specific position using Position object
 * @param board - The game board
 * @param position - Position object with x,y coordinates
 * @returns Tile at position or undefined
 */
export function getTileAtPosition(board: Course['board'] | Tile[][], position: Position): Tile | undefined {
    return getTileAt(board, position.x, position.y);
}

/**
 * Check if a position has a valid tile (not undefined/null)
 * @param board - The game board
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns true if position has a valid tile
 */
export function hasTileAt(board: Course['board'] | Tile[][], x: number, y: number): boolean {
    return getTileAt(board, x, y) !== undefined;
}

/**
 * Check if coordinates are within board bounds
 * @param board - The game board
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns true if coordinates are valid
 */
export function isValidPosition(board: Course['board'] | Tile[][], x: number, y: number): boolean {
    let tiles: Tile[][];

    if ('tiles' in board && board.tiles) {
        tiles = board.tiles;
    } else if (Array.isArray(board)) {
        tiles = board;
    } else {
        return false;
    }

    if (!Array.isArray(tiles) || tiles.length === 0) {
        return false;
    }

    return y >= 0 && y < tiles.length &&
        x >= 0 && x < (tiles[y]?.length || 0);
}