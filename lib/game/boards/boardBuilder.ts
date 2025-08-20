import { Board, BoardDefinition, Tile, TileType, Direction, Laser } from '../types';

/**
 * Builds a Board object from a BoardDefinition
 */
export function buildBoard(boardDef: BoardDefinition): Board {
    // Initialize empty board
    const tiles: Tile[][] = [];
    for (let y = 0; y < boardDef.height; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < boardDef.width; x++) {
            row.push({
                position: { x, y },
                type: TileType.EMPTY,
                walls: [] // Initialize empty walls array for each tile
            });
        }
        tiles.push(row);
    }

    // Place special tiles
    if (boardDef.tiles) {
        for (const tileDef of boardDef.tiles) {
            const { x, y } = tileDef.position;
            if (x >= 0 && x < boardDef.width && y >= 0 && y < boardDef.height) {
                tiles[y][x] = {
                    position: { x, y },
                    type: tileDef.type,
                    walls: [], // Will be populated below
                    direction: tileDef.direction,
                    rotate: tileDef.rotate,
                    registers: tileDef.registers
                };
            }
        }
    }

    // Add walls to tiles
    if (boardDef.walls) {
        for (const wallDef of boardDef.walls) {
            const { x, y } = wallDef.position;
            if (x >= 0 && x < boardDef.width && y >= 0 && y < boardDef.height) {
                // Add the wall sides to the tile's walls array
                tiles[y][x].walls = [...tiles[y][x].walls, ...wallDef.sides];
            }
        }
    }

    // Build laser array if present
    const lasers: Laser[] | undefined = boardDef.lasers ?
        boardDef.lasers.map(laserDef => ({
            position: laserDef.position,
            direction: laserDef.direction,
            damage: laserDef.damage
        })) : undefined;

    const board: Board = {
        width: boardDef.width,
        height: boardDef.height,
        tiles,
        startingPositions: boardDef.startingPositions,
        lasers,
        walls: boardDef.walls  // Pass walls for easier lookup
    };

    return board;
}


/**
 * Validates that starting positions don't overlap with pits or other hazards
 */
// export function validateBoardConfiguration(board: Course): { valid: boolean; errors: string[] } {
//     const errors: string[] = [];

//     // Check starting positions
//     for (const startPos of board.startingPositions) {
//         const { x, y } = startPos.position;

//         if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
//             errors.push(`Starting position (${x}, ${y}) is outside board boundaries`);
//             continue;
//         }

//         const tile = board.tiles[y][x];
//         if (tile.type === TileType.PIT) {
//             errors.push(`Starting position (${x}, ${y}) is on a pit`);
//         }
//     }

//     // Check checkpoints
//     for (const checkpoint of board.checkpoints) {
//         const { x, y } = checkpoint.position;

//         if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
//             errors.push(`Checkpoint ${checkpoint.number} at (${x}, ${y}) is outside board boundaries`);
//             continue;
//         }

//         const tile = board.tiles[y][x];
//         if (tile.type === TileType.PIT) {
//             errors.push(`Checkpoint ${checkpoint.number} at (${x}, ${y}) is on a pit`);
//         }
//     }

//     // Check for duplicate checkpoint numbers
//     const checkpointNumbers = board.checkpoints.map(cp => cp.number);
//     const uniqueNumbers = new Set(checkpointNumbers);
//     if (checkpointNumbers.length !== uniqueNumbers.size) {
//         errors.push('Duplicate checkpoint numbers found');
//     }

//     // Check for sequential checkpoint numbers
//     const sortedNumbers = [...uniqueNumbers].sort((a, b) => a - b);
//     for (let i = 0; i < sortedNumbers.length; i++) {
//         if (sortedNumbers[i] !== i + 1) {
//             errors.push(`Checkpoint numbers are not sequential (missing checkpoint ${i + 1})`);
//             break;
//         }
//     }

//     return {
//         valid: errors.length === 0,
//         errors
//     };
// }

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