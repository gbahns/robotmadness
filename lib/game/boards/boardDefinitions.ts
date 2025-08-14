// lib/game/boards/boardDefinitions.ts - Final version with proper separation

import { Board, Checkpoint, StartingPosition, TileType, Direction } from '../types';
import { buildBoard } from './boardBuilder';
import { DOCKING_BAY_BOARDS, COMBINED_COURSES, COMBINED_BOARD_DEFINITIONS } from './dockingBayBoards';
import { OFFICIAL_BOARD_DEFINITIONS, OFFICIAL_COURSE_DEFINITIONS } from './officialBoards';

export interface CourseDefinition {
    id: string;
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    minPlayers: number;
    maxPlayers: number;
    boards: string[]; // Array of board IDs, not embedded boards
}

export interface BoardDefinition {
    id: string;
    name: string;
    width: number;
    height: number;
    checkpoints: Checkpoint[];
    startingPositions: StartingPosition[];
    tiles?: TileElement[];
    lasers?: LaserElement[];
    walls?: WallElement[];
}

export interface TileElement {
    position: { x: number; y: number };
    type: TileType;
    direction?: Direction;
    rotate?: 'clockwise' | 'counterclockwise';
    registers?: number[]; // For pushers
}

export interface LaserElement {
    position: { x: number; y: number };
    direction: Direction;
    damage: number;
}

export interface WallElement {
    position: { x: number; y: number };
    sides: Direction[]; // Which sides of the tile have walls
}

// =============================================================================
// BOARD DEFINITIONS (Individual Boards)
// =============================================================================

// Test board for development
export const TEST_BOARD: BoardDefinition = {
    id: 'test',
    name: 'Test Board',
    width: 12,
    height: 12,
    checkpoints: [
        { position: { x: 6, y: 3 }, number: 1 },
        { position: { x: 9, y: 9 }, number: 2 },
        { position: { x: 3, y: 6 }, number: 3 }
    ],
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
    checkpoints: [
        { position: { x: 6, y: 6 }, number: 1 },
        { position: { x: 2, y: 2 }, number: 2 },
        { position: { x: 10, y: 10 }, number: 3 }
    ],
    startingPositions: [
        { position: { x: 0, y: 0 }, direction: Direction.RIGHT },
        { position: { x: 11, y: 0 }, direction: Direction.LEFT },
        { position: { x: 11, y: 11 }, direction: Direction.LEFT },
        { position: { x: 0, y: 11 }, direction: Direction.RIGHT },
        { position: { x: 5, y: 0 }, direction: Direction.DOWN },
        { position: { x: 6, y: 0 }, direction: Direction.DOWN },
        { position: { x: 5, y: 11 }, direction: Direction.UP },
        { position: { x: 6, y: 11 }, direction: Direction.UP }
    ],
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
    checkpoints: [
        { position: { x: 9, y: 3 }, number: 1 },
        { position: { x: 9, y: 9 }, number: 2 },
        { position: { x: 3, y: 6 }, number: 3 }
    ],
    startingPositions: [
        { position: { x: 0, y: 5 }, direction: Direction.RIGHT },
        { position: { x: 0, y: 6 }, direction: Direction.RIGHT },
        { position: { x: 11, y: 5 }, direction: Direction.LEFT },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT },
        { position: { x: 5, y: 0 }, direction: Direction.DOWN },
        { position: { x: 6, y: 0 }, direction: Direction.DOWN },
        { position: { x: 5, y: 11 }, direction: Direction.UP },
        { position: { x: 6, y: 11 }, direction: Direction.UP }
    ],
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
    checkpoints: [
        { position: { x: 6, y: 2 }, number: 1 },
        { position: { x: 10, y: 6 }, number: 2 },
        { position: { x: 6, y: 10 }, number: 3 }
    ],
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
    ...COMBINED_BOARD_DEFINITIONS
];

// =============================================================================
// COURSE DEFINITIONS (References to Boards)
// =============================================================================

export const CHECKMATE_COURSE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Another easy course—just push the other robots into pits.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['checkmate-board'] // Reference to board ID
};

export const DIZZY_DASH_COURSE: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['dizzy-dash-board'] // Reference to board ID
};

export const ISLAND_HOP_COURSE: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the island or around?',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['island-hop-board'] // Reference to board ID
};

// Single board course definitions
const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
    CHECKMATE_COURSE,
    DIZZY_DASH_COURSE,
    ISLAND_HOP_COURSE
];

// All course definitions combined
export const ALL_COURSE_DEFINITIONS: CourseDefinition[] = [
    ...OFFICIAL_COURSE_DEFINITIONS, // Official courses first!
    ...SINGLE_BOARD_COURSE_DEFINITIONS,
    ...COMBINED_COURSES // Now properly separated!
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get course by ID
export function getCourseById(courseId: string): CourseDefinition | undefined {
    return ALL_COURSE_DEFINITIONS.find(course => course.id === courseId);
}

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

// Get all boards for a course
export function getBoardsForCourse(courseId: string): BoardDefinition[] {
    const course = getCourseById(courseId);
    if (!course) return [];

    return course.boards
        .map(boardId => getBoardDefinitionById(boardId))
        .filter((board): board is BoardDefinition => board !== undefined);
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

// Backward compatibility exports
export const ALL_COURSES = ALL_COURSE_DEFINITIONS;
export const COURSES = ALL_COURSE_DEFINITIONS;