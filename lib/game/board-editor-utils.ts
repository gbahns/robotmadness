// lib/game/board-editor-utils.ts
// Utilities for the board editor

import { BoardDefinition, TileElement, LaserElement, WallElement, StartingPosition, TileType, Direction } from './types';

/**
 * Validates a board definition to ensure it's valid for gameplay
 */
export interface BoardValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateBoardDefinition(boardDef: BoardDefinition): BoardValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!boardDef.id || boardDef.id.trim() === '') {
        errors.push('Board must have a valid ID');
    }

    if (!boardDef.name || boardDef.name.trim() === '') {
        errors.push('Board must have a valid name');
    }

    if (boardDef.width < 1 || boardDef.width > 20) {
        errors.push('Board width must be between 1 and 20');
    }

    if (boardDef.height < 1 || boardDef.height > 20) {
        errors.push('Board height must be between 1 and 20');
    }

    // Starting positions validation
    if (boardDef.startingPositions.length === 0) {
        warnings.push('Board has no starting positions - players cannot spawn');
    }

    if (boardDef.startingPositions.length < 2) {
        warnings.push('Board has fewer than 2 starting positions - multiplayer games may not work');
    }

    if (boardDef.startingPositions.length > 8) {
        warnings.push('Board has more than 8 starting positions - maximum player count is 8');
    }

    // Check for duplicate starting position numbers
    const startingNumbers = boardDef.startingPositions.map(pos => pos.number);
    const duplicateNumbers = startingNumbers.filter((num, index) => startingNumbers.indexOf(num) !== index);
    if (duplicateNumbers.length > 0) {
        errors.push(`Duplicate starting position numbers: ${duplicateNumbers.join(', ')}`);
    }

    // Check starting positions are within bounds
    for (const startPos of boardDef.startingPositions) {
        if (startPos.position.x < 0 || startPos.position.x >= boardDef.width ||
            startPos.position.y < 0 || startPos.position.y >= boardDef.height) {
            errors.push(`Starting position ${startPos.number} is outside board bounds`);
        }
    }

    // Check tiles are within bounds
    if (boardDef.tiles) {
        for (const tile of boardDef.tiles) {
            if (tile.position.x < 0 || tile.position.x >= boardDef.width ||
                tile.position.y < 0 || tile.position.y >= boardDef.height) {
                errors.push(`Tile at (${tile.position.x}, ${tile.position.y}) is outside board bounds`);
            }
        }
    }

    // Check lasers are within bounds
    if (boardDef.lasers) {
        for (const laser of boardDef.lasers) {
            if (laser.position.x < 0 || laser.position.x >= boardDef.width ||
                laser.position.y < 0 || laser.position.y >= boardDef.height) {
                errors.push(`Laser at (${laser.position.x}, ${laser.position.y}) is outside board bounds`);
            }
        }
    }

    // Check walls are within bounds
    if (boardDef.walls) {
        for (const wall of boardDef.walls) {
            if (wall.position.x < 0 || wall.position.x >= boardDef.width ||
                wall.position.y < 0 || wall.position.y >= boardDef.height) {
                errors.push(`Wall at (${wall.position.x}, ${wall.position.y}) is outside board bounds`);
            }
        }
    }

    // Check for overlapping starting positions
    const startingPositions = boardDef.startingPositions.map(pos => `${pos.position.x},${pos.position.y}`);
    const duplicatePositions = startingPositions.filter((pos, index) => startingPositions.indexOf(pos) !== index);
    if (duplicatePositions.length > 0) {
        errors.push(`Multiple starting positions at same location: ${duplicatePositions.join(', ')}`);
    }

    // Gameplay warnings
    const hazardTiles = boardDef.tiles?.filter(tile => tile.type === TileType.PIT) || [];
    if (hazardTiles.length === 0) {
        warnings.push('Board has no pits - may be too easy');
    }

    const repairTiles = boardDef.tiles?.filter(tile => tile.type === TileType.REPAIR) || [];
    if (repairTiles.length === 0) {
        warnings.push('Board has no repair sites - players cannot recover damage');
    }

    const movementTiles = boardDef.tiles?.filter(tile =>
        tile.type === TileType.CONVEYOR ||
        tile.type === TileType.EXPRESS_CONVEYOR ||
        tile.type === TileType.GEAR_CW ||
        tile.type === TileType.GEAR_CCW
    ) || [];

    if (movementTiles.length === 0) {
        warnings.push('Board has no movement elements (conveyors, gears) - may be static');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Creates a new empty board definition with default values
 */
export function createEmptyBoard(id: string = 'new-board', name: string = 'New Board'): BoardDefinition {
    return {
        id,
        name,
        width: 12,
        height: 12,
        tiles: [],
        lasers: [],
        walls: [],
        startingPositions: []
    };
}

/**
 * Clones a board definition
 */
export function cloneBoardDefinition(original: BoardDefinition): BoardDefinition {
    return JSON.parse(JSON.stringify(original));
}

/**
 * Resizes a board definition, preserving existing elements where possible
 */
export function resizeBoardDefinition(
    boardDef: BoardDefinition,
    newWidth: number,
    newHeight: number
): BoardDefinition {
    const resized = { ...boardDef, width: newWidth, height: newHeight };

    // Filter out elements that are now outside bounds
    resized.tiles = boardDef.tiles?.filter(tile =>
        tile.position.x < newWidth && tile.position.y < newHeight
    ) || [];

    resized.lasers = boardDef.lasers?.filter(laser =>
        laser.position.x < newWidth && laser.position.y < newHeight
    ) || [];

    resized.walls = boardDef.walls?.filter(wall =>
        wall.position.x < newWidth && wall.position.y < newHeight
    ) || [];

    resized.startingPositions = boardDef.startingPositions.filter(pos =>
        pos.position.x < newWidth && pos.position.y < newHeight
    );

    return resized;
}

/**
 * Rotates the entire board 90 degrees clockwise
 */
export function rotateBoardClockwise(boardDef: BoardDefinition): BoardDefinition {
    const rotated = cloneBoardDefinition(boardDef);

    // Swap width and height
    const newWidth = boardDef.height;
    const newHeight = boardDef.width;
    rotated.width = newWidth;
    rotated.height = newHeight;

    // Rotate all positions: (x, y) -> (height - 1 - y, x)
    const rotatePosition = (x: number, y: number) => ({
        x: boardDef.height - 1 - y,
        y: x
    });

    // Rotate all directions: add 1 (mod 4)
    const rotateDirection = (dir: Direction): Direction => (dir + 1) % 4;

    // Rotate tiles
    if (rotated.tiles) {
        for (const tile of rotated.tiles) {
            tile.position = rotatePosition(tile.position.x, tile.position.y);
            if (tile.direction !== undefined) {
                tile.direction = rotateDirection(tile.direction);
            }
        }
    }

    // Rotate lasers
    if (rotated.lasers) {
        for (const laser of rotated.lasers) {
            laser.position = rotatePosition(laser.position.x, laser.position.y);
            laser.direction = rotateDirection(laser.direction);
        }
    }

    // Rotate walls
    if (rotated.walls) {
        for (const wall of rotated.walls) {
            wall.position = rotatePosition(wall.position.x, wall.position.y);
            wall.sides = wall.sides.map(rotateDirection);
        }
    }

    // Rotate starting positions
    for (const startPos of rotated.startingPositions) {
        startPos.position = rotatePosition(startPos.position.x, startPos.position.y);
        startPos.direction = rotateDirection(startPos.direction);
    }

    return rotated;
}

/**
 * Mirrors the board horizontally
 */
export function mirrorBoardHorizontally(boardDef: BoardDefinition): BoardDefinition {
    const mirrored = cloneBoardDefinition(boardDef);

    // Mirror all x positions: x -> width - 1 - x
    const mirrorPosition = (x: number, y: number) => ({
        x: boardDef.width - 1 - x,
        y: y
    });

    // Mirror horizontal directions: LEFT <-> RIGHT
    const mirrorDirection = (dir: Direction): Direction => {
        switch (dir) {
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
            default: return dir;
        }
    };

    // Mirror tiles
    if (mirrored.tiles) {
        for (const tile of mirrored.tiles) {
            tile.position = mirrorPosition(tile.position.x, tile.position.y);
            if (tile.direction !== undefined) {
                tile.direction = mirrorDirection(tile.direction);
            }
        }
    }

    // Mirror lasers
    if (mirrored.lasers) {
        for (const laser of mirrored.lasers) {
            laser.position = mirrorPosition(laser.position.x, laser.position.y);
            laser.direction = mirrorDirection(laser.direction);
        }
    }

    // Mirror walls
    if (mirrored.walls) {
        for (const wall of mirrored.walls) {
            wall.position = mirrorPosition(wall.position.x, wall.position.y);
            wall.sides = wall.sides.map(mirrorDirection);
        }
    }

    // Mirror starting positions
    for (const startPos of mirrored.startingPositions) {
        startPos.position = mirrorPosition(startPos.position.x, startPos.position.y);
        startPos.direction = mirrorDirection(startPos.direction);
    }

    return mirrored;
}

/**
 * Gets a summary of board statistics
 */
export interface BoardStats {
    totalTiles: number;
    tilesByType: Record<TileType, number>;
    totalLasers: number;
    totalWalls: number;
    totalStartingPositions: number;
    boardSize: string;
}

export function getBoardStats(boardDef: BoardDefinition): BoardStats {
    const tilesByType = Object.values(TileType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
    }, {} as Record<TileType, number>);

    if (boardDef.tiles) {
        for (const tile of boardDef.tiles) {
            tilesByType[tile.type]++;
        }
    }

    return {
        totalTiles: boardDef.tiles?.length || 0,
        tilesByType,
        totalLasers: boardDef.lasers?.length || 0,
        totalWalls: boardDef.walls?.length || 0,
        totalStartingPositions: boardDef.startingPositions.length,
        boardSize: `${boardDef.width}×${boardDef.height}`
    };
}

/**
 * Generates a preview/thumbnail of the board as a simple 2D array
 */
export function generateBoardPreview(boardDef: BoardDefinition): string[][] {
    // Initialize with empty tiles
    const preview: string[][] = [];
    for (let y = 0; y < boardDef.height; y++) {
        const row: string[] = [];
        for (let x = 0; x < boardDef.width; x++) {
            row.push('.');
        }
        preview.push(row);
    }

    // Place tiles
    if (boardDef.tiles) {
        for (const tile of boardDef.tiles) {
            const { x, y } = tile.position;
            if (x >= 0 && x < boardDef.width && y >= 0 && y < boardDef.height) {
                switch (tile.type) {
                    case TileType.PIT: preview[y][x] = 'X'; break;
                    case TileType.REPAIR: preview[y][x] = 'R'; break;
                    case TileType.OPTION: preview[y][x] = 'O'; break;
                    case TileType.CONVEYOR: preview[y][x] = '>'; break;
                    case TileType.EXPRESS_CONVEYOR: preview[y][x] = '»'; break;
                    case TileType.GEAR_CW: preview[y][x] = '↻'; break;
                    case TileType.GEAR_CCW: preview[y][x] = '↺'; break;
                    case TileType.PUSHER: preview[y][x] = 'P'; break;
                }
            }
        }
    }

    // Place starting positions
    for (const startPos of boardDef.startingPositions) {
        const { x, y } = startPos.position;
        if (x >= 0 && x < boardDef.width && y >= 0 && y < boardDef.height) {
            preview[y][x] = startPos.number.toString();
        }
    }

    return preview;
}

/**
 * Export board definition to TypeScript code
 */
export function exportToTypeScript(boardDef: BoardDefinition): string {
    const lines: string[] = [];

    lines.push(`import { BoardDefinition, TileType, Direction } from '../types';`);
    lines.push('');
    lines.push(`export const ${boardDef.id.toUpperCase().replace(/-/g, '_')}: BoardDefinition = {`);
    lines.push(`  id: '${boardDef.id}',`);
    lines.push(`  name: '${boardDef.name}',`);
    lines.push(`  width: ${boardDef.width},`);
    lines.push(`  height: ${boardDef.height},`);
    lines.push('');

    // Starting positions
    lines.push('  startingPositions: [');
    for (const startPos of boardDef.startingPositions) {
        lines.push(`    { number: ${startPos.number}, position: { x: ${startPos.position.x}, y: ${startPos.position.y} }, direction: Direction.${Direction[startPos.direction]} },`);
    }
    lines.push('  ],');
    lines.push('');

    // Tiles
    if (boardDef.tiles && boardDef.tiles.length > 0) {
        lines.push('  tiles: [');
        for (const tile of boardDef.tiles) {
            let tileLine = `    { position: { x: ${tile.position.x}, y: ${tile.position.y} }, type: TileType.${tile.type}`;
            if (tile.direction !== undefined) {
                tileLine += `, direction: Direction.${Direction[tile.direction]}`;
            }
            if (tile.rotate) {
                tileLine += `, rotate: '${tile.rotate}'`;
            }
            if (tile.registers && tile.registers.length > 0) {
                tileLine += `, registers: [${tile.registers.join(', ')}]`;
            }
            tileLine += ' },';
            lines.push(tileLine);
        }
        lines.push('  ],');
    }

    // Lasers
    if (boardDef.lasers && boardDef.lasers.length > 0) {
        lines.push('');
        lines.push('  lasers: [');
        for (const laser of boardDef.lasers) {
            lines.push(`    { position: { x: ${laser.position.x}, y: ${laser.position.y} }, direction: Direction.${Direction[laser.direction]}, damage: ${laser.damage} },`);
        }
        lines.push('  ],');
    }

    // Walls
    if (boardDef.walls && boardDef.walls.length > 0) {
        lines.push('');
        lines.push('  walls: [');
        for (const wall of boardDef.walls) {
            const sides = wall.sides.map(side => `Direction.${Direction[side]}`).join(', ');
            lines.push(`    { position: { x: ${wall.position.x}, y: ${wall.position.y} }, sides: [${sides}] },`);
        }
        lines.push('  ],');
    }

    lines.push('};');

    return lines.join('\n');
}