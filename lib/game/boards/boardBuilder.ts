import { Board, Tile, TileType, Direction, Checkpoint, StartingPosition, Laser } from '../types';
import { BoardDefinition, TileElement, LaserElement, WallElement } from './boardDefinitions';

/**
 * Builds a Board object from a BoardDefinition
 */
export function buildBoard(definition: BoardDefinition): Board {
    // Initialize empty tile grid
    const tiles: Tile[][] = Array(definition.height).fill(null).map(() =>
        Array(definition.width).fill(null).map(() => ({
            type: TileType.EMPTY,
            walls: []
        }))
    );

    // Apply tile elements
    if (definition.tiles) {
        for (const tileElement of definition.tiles) {
            const { x, y } = tileElement.position;
            if (x >= 0 && x < definition.width && y >= 0 && y < definition.height) {
                tiles[y][x] = {
                    type: tileElement.type,
                    walls: [] // Walls will be added separately
                };

                // Add any tile-specific properties (for future enhancement)
                // These would be stored in a separate enhanced tiles array
                // For now, we're using the basic tile system
            }
        }
    }

    // Apply walls
    if (definition.walls) {
        for (const wall of definition.walls) {
            const { x, y } = wall.position;
            if (x >= 0 && x < definition.width && y >= 0 && y < definition.height) {
                tiles[y][x].walls = wall.sides;
            }
        }
    }

    // Convert lasers to the format expected by the Board
    const lasers: Laser[] = definition.lasers?.map(laser => ({
        position: laser.position,
        direction: laser.direction,
        damage: laser.damage
    })) || [];

    // Create the board
    const board: Board = {
        width: definition.width,
        height: definition.height,
        tiles,
        checkpoints: definition.checkpoints,
        startingPositions: definition.startingPositions,
        lasers: lasers.length > 0 ? lasers : undefined
    };

    return board;
}

/**
 * Creates a board with walls around the edges to prevent robots from falling off
 */
export function addBoardEdgeWalls(board: Board): Board {
    const tiles = board.tiles.map(row => row.map(tile => ({ ...tile, walls: [...tile.walls] })));

    // Add walls to edges
    for (let x = 0; x < board.width; x++) {
        // Top edge
        if (!tiles[0][x].walls.includes(Direction.UP)) {
            tiles[0][x].walls.push(Direction.UP);
        }
        // Bottom edge
        if (!tiles[board.height - 1][x].walls.includes(Direction.DOWN)) {
            tiles[board.height - 1][x].walls.push(Direction.DOWN);
        }
    }

    for (let y = 0; y < board.height; y++) {
        // Left edge
        if (!tiles[y][0].walls.includes(Direction.LEFT)) {
            tiles[y][0].walls.push(Direction.LEFT);
        }
        // Right edge
        if (!tiles[y][board.width - 1].walls.includes(Direction.RIGHT)) {
            tiles[y][board.width - 1].walls.push(Direction.RIGHT);
        }
    }

    return {
        ...board,
        tiles
    };
}

/**
 * Validates that starting positions don't overlap with pits or other hazards
 */
export function validateBoardConfiguration(board: Board): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check starting positions
    for (const startPos of board.startingPositions) {
        const { x, y } = startPos.position;

        if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
            errors.push(`Starting position (${x}, ${y}) is outside board boundaries`);
            continue;
        }

        const tile = board.tiles[y][x];
        if (tile.type === TileType.PIT) {
            errors.push(`Starting position (${x}, ${y}) is on a pit`);
        }
    }

    // Check checkpoints
    for (const checkpoint of board.checkpoints) {
        const { x, y } = checkpoint.position;

        if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
            errors.push(`Checkpoint ${checkpoint.number} at (${x}, ${y}) is outside board boundaries`);
            continue;
        }

        const tile = board.tiles[y][x];
        if (tile.type === TileType.PIT) {
            errors.push(`Checkpoint ${checkpoint.number} at (${x}, ${y}) is on a pit`);
        }
    }

    // Check for duplicate checkpoint numbers
    const checkpointNumbers = board.checkpoints.map(cp => cp.number);
    const uniqueNumbers = new Set(checkpointNumbers);
    if (checkpointNumbers.length !== uniqueNumbers.size) {
        errors.push('Duplicate checkpoint numbers found');
    }

    // Check for sequential checkpoint numbers
    const sortedNumbers = [...uniqueNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sortedNumbers.length; i++) {
        if (sortedNumbers[i] !== i + 1) {
            errors.push(`Checkpoint numbers are not sequential (missing checkpoint ${i + 1})`);
            break;
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Helper function to rotate a direction
 */
export function rotateDirection(direction: Direction, rotation: 'clockwise' | 'counterclockwise'): Direction {
    if (rotation === 'clockwise') {
        return (direction + 1) % 4;
    } else {
        return (direction + 3) % 4; // +3 is same as -1 mod 4
    }
}

/**
 * Helper function to get the opposite direction
 */
export function oppositeDirection(direction: Direction): Direction {
    return (direction + 2) % 4;
}

/**
 * Helper function to apply a direction to a position
 */
export function applyDirection(position: { x: number; y: number }, direction: Direction): { x: number; y: number } {
    const dx = [0, 1, 0, -1]; // UP, RIGHT, DOWN, LEFT
    const dy = [-1, 0, 1, 0];

    return {
        x: position.x + dx[direction],
        y: position.y + dy[direction]
    };
}