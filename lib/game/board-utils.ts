import { Board, BoardDefinition, Tile, TileType, Direction, Laser } from './types';
import { EXCHANGE_FACTORY_FLOOR } from './boards/exchange';
import { EXCHANGE_FACTORY_FLOOR_TEST } from './boards/exchange-test';
import { CROSS_BOARD } from './boards/cross';
import { CHESS_BOARD } from './boards/chess';
import { TEST_BOARD } from './boards/test';
import { DIZZY_DASH_BOARD } from './boards/dizzy-dash';
import { ISLAND_HOP_BOARD } from './boards/island-hop';
import { DOCKING_BAY_1 } from './boards/docking-bay/docking-bay-1';
import { DOCKING_BAY_2 } from './boards/docking-bay/docking-bay-2';
import { CHOP_SHOP_BOARD } from './boards/chop-shop';

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

// Docking bay boards
export const DOCKING_BAY_BOARDS: BoardDefinition[] = [
    DOCKING_BAY_1,
    DOCKING_BAY_2,
];

// Official boards from exchange files
const OFFICIAL_BOARD_DEFINITIONS: BoardDefinition[] = [
    EXCHANGE_FACTORY_FLOOR,
    EXCHANGE_FACTORY_FLOOR_TEST
];

// All board definitions from different sources
const SINGLE_BOARD_DEFINITIONS: BoardDefinition[] = [
    TEST_BOARD,
    DIZZY_DASH_BOARD,
    ISLAND_HOP_BOARD,
    CROSS_BOARD,
    CHESS_BOARD,
    CHOP_SHOP_BOARD
];

// All board definitions combined
export const ALL_BOARD_DEFINITIONS: BoardDefinition[] = [
    ...SINGLE_BOARD_DEFINITIONS,
    ...OFFICIAL_BOARD_DEFINITIONS,
    ...DOCKING_BAY_BOARDS,
];

// Get board definition by ID
export function getBoardDefinitionById(boardId: string): BoardDefinition | undefined {
    return ALL_BOARD_DEFINITIONS.find(board => board.id === boardId);
}