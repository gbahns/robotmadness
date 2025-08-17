import { Position, Direction, WallElement, Tile, Course } from './types';
import { getTileAt } from './tile-utils';

/**
 * Check if there's a wall blocking movement from one position to another adjacent position
 * @param from - Starting position
 * @param to - Target position (must be adjacent)
 * @param board - The game board
 * @returns true if movement is blocked by a wall
 */
export function hasWallBetween(from: Position, to: Position, board: Course['board']): boolean {
    // Determine direction of movement
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    let movementDirection: Direction;
    if (dy === -1) movementDirection = Direction.UP;
    else if (dx === 1) movementDirection = Direction.RIGHT;
    else if (dy === 1) movementDirection = Direction.DOWN;
    else if (dx === -1) movementDirection = Direction.LEFT;
    else return false; // Not adjacent positions

    // Check if there's a wall on the 'from' tile blocking exit in the movement direction
    const fromTile = getTileAt(board, from.x, from.y);
    if (fromTile && fromTile.walls.includes(movementDirection)) {
        return true;
    }

    // Check if there's a wall on the 'to' tile blocking entry from the opposite direction
    const oppositeDirection = (movementDirection + 2) % 4;
    const toTile = getTileAt(board, to.x, to.y);
    if (toTile && toTile.walls.includes(oppositeDirection)) {
        return true;
    }

    return false;
}

/**
 * Check if a position can be moved to (considering walls from current position)
 * @param from - Current position
 * @param direction - Direction to move
 * @param board - The game board
 * @returns true if the move is blocked by a wall
 */
export function isWallBlocking(from: Position, direction: Direction, board: Course['board']): boolean {
    // Calculate target position
    const directionVectors: Record<Direction, { x: number; y: number }> = {
        [Direction.UP]: { x: 0, y: -1 },
        [Direction.RIGHT]: { x: 1, y: 0 },
        [Direction.DOWN]: { x: 0, y: 1 },
        [Direction.LEFT]: { x: -1, y: 0 }
    };

    const vector = directionVectors[direction];
    const to = {
        x: from.x + vector.x,
        y: from.y + vector.y
    };

    return hasWallBetween(from, to, board);
}