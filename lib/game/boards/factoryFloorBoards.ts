import { Board, Checkpoint, StartingPosition, TileType, Direction, BoardDefinition } from '../types';
import { buildBoard } from './boardBuilder';
import { OFFICIAL_BOARD_DEFINITIONS } from './officialBoards';
import { DOCKING_BAY_BOARDS } from './dockingBayBoards';

// =============================================================================
// BOARD DEFINITIONS (Individual Boards)
// =============================================================================

// Test board for development
export const TEST_BOARD: BoardDefinition = {
    id: 'test',
    name: 'Test Board',
    width: 12,
    height: 12,
    startingPositions: [
        { position: { x: 1, y: 1 }, direction: Direction.UP },
        { position: { x: 10, y: 1 }, direction: Direction.UP },
        { position: { x: 10, y: 10 }, direction: Direction.DOWN },
        { position: { x: 1, y: 10 }, direction: Direction.DOWN },
        { position: { x: 5, y: 5 }, direction: Direction.RIGHT },
        { position: { x: 6, y: 6 }, direction: Direction.LEFT },
        { position: { x: 3, y: 3 }, direction: Direction.DOWN },
        { position: { x: 8, y: 8 }, direction: Direction.UP }
    ],
    tiles: []
};

// Checkmate board (single 12x12 board with starting positions)
export const CHECKMATE_BOARD: BoardDefinition = {
    id: 'checkmate-board',
    name: 'Checkmate',
    width: 12,
    height: 12,
    startingPositions: [],
    tiles: [
        // Central pit area
        { position: { x: 5, y: 5 }, type: TileType.PIT },
        { position: { x: 6, y: 5 }, type: TileType.PIT },
        { position: { x: 7, y: 5 }, type: TileType.PIT },
        { position: { x: 5, y: 6 }, type: TileType.PIT },
        { position: { x: 7, y: 6 }, type: TileType.PIT },
        { position: { x: 5, y: 7 }, type: TileType.PIT },
        { position: { x: 6, y: 7 }, type: TileType.PIT },
        { position: { x: 7, y: 7 }, type: TileType.PIT },
        // Conveyors pushing toward center
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        // Repair sites at corners
        { position: { x: 1, y: 1 }, type: TileType.REPAIR },
        { position: { x: 10, y: 1 }, type: TileType.REPAIR },
        { position: { x: 1, y: 10 }, type: TileType.REPAIR },
        { position: { x: 10, y: 10 }, type: TileType.REPAIR }
    ],
    lasers: []
};

// Dizzy Dash board (single 12x12 board with starting positions)
export const DIZZY_DASH_BOARD: BoardDefinition = {
    id: 'dizzy-dash-board',
    name: 'Dizzy Dash',
    width: 12,
    height: 12,
    startingPositions: [],
    tiles: [
        // Multiple gear clusters for confusion
        { position: { x: 2, y: 2 }, type: TileType.GEAR_CW },
        { position: { x: 3, y: 2 }, type: TileType.GEAR_CCW },
        { position: { x: 2, y: 3 }, type: TileType.GEAR_CCW },
        { position: { x: 3, y: 3 }, type: TileType.GEAR_CW },

        { position: { x: 8, y: 2 }, type: TileType.GEAR_CCW },
        { position: { x: 9, y: 2 }, type: TileType.GEAR_CW },
        { position: { x: 8, y: 3 }, type: TileType.GEAR_CW },
        { position: { x: 10, y: 3 }, type: TileType.GEAR_CCW },

        { position: { x: 2, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 3, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 2, y: 9 }, type: TileType.GEAR_CCW },
        { position: { x: 3, y: 9 }, type: TileType.GEAR_CW },

        { position: { x: 8, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 9, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 8, y: 9 }, type: TileType.GEAR_CW },
        { position: { x: 9, y: 10 }, type: TileType.GEAR_CCW },

        // Some conveyors for navigation
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Repair site in center
        { position: { x: 5, y: 6 }, type: TileType.REPAIR }
    ],
    lasers: []
};

// Island Hop board (single 12x12 board with starting positions)
export const ISLAND_HOP_BOARD: BoardDefinition = {
    id: 'island-hop-board',
    name: 'Island Hop',
    width: 12,
    height: 12,
    startingPositions: [],
    tiles: [
        // Central "island" of pits
        { position: { x: 5, y: 5 }, type: TileType.PIT },
        { position: { x: 6, y: 5 }, type: TileType.PIT },
        { position: { x: 7, y: 5 }, type: TileType.PIT },
        { position: { x: 5, y: 6 }, type: TileType.PIT },
        { position: { x: 6, y: 6 }, type: TileType.PIT },
        { position: { x: 7, y: 6 }, type: TileType.PIT },
        { position: { x: 5, y: 7 }, type: TileType.PIT },
        { position: { x: 6, y: 7 }, type: TileType.PIT },
        { position: { x: 7, y: 7 }, type: TileType.PIT },

        // Conveyors around the island
        { position: { x: 4, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Repair sites at strategic locations
        { position: { x: 1, y: 6 }, type: TileType.REPAIR },
        { position: { x: 11, y: 6 }, type: TileType.REPAIR },
        { position: { x: 6, y: 1 }, type: TileType.REPAIR },
        { position: { x: 6, y: 11 }, type: TileType.REPAIR }
    ],
    lasers: [
        // Lasers across the island gaps
        { position: { x: 0, y: 6 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT, damage: 1 },
        { position: { x: 6, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 6, y: 11 }, direction: Direction.UP, damage: 1 }
    ]
};

// All board definitions from different sources
const SINGLE_BOARD_DEFINITIONS: BoardDefinition[] = [
    TEST_BOARD,
    CHECKMATE_BOARD,
    DIZZY_DASH_BOARD,
    ISLAND_HOP_BOARD
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

// Get built board by ID (for game engine)
export function getBoardById(boardId: string): Board {
    const boardDef = getBoardDefinitionById(boardId);
    if (boardDef) {
        return buildBoard(boardDef);
    }
    return buildBoard(TEST_BOARD);
}


// Create empty board
export function createEmptyBoard(width: number = 12, height: number = 12): Board {
    const tiles = Array(height).fill(null).map(() =>
        Array(width).fill(null).map(() => ({
            type: TileType.EMPTY,
            position: { x: 0, y: 0 },
            walls: []
        }))
    );

    return {
        width,
        height,
        tiles,
        checkpoints: [],
        startingPositions: []
    };
}
