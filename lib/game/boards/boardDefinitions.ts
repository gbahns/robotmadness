import { Board, Checkpoint, StartingPosition, TileType, Direction } from '../types';
import { buildBoard } from './boardBuilder';
import { DOCKING_BAY_BOARDS } from './dockingBayBoards';
import { LEGACY_COURSES } from './legacyBoards';

export interface CourseDefinition {
    id: string;
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    minPlayers: number;
    maxPlayers: number;
    boards: BoardDefinition[];
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

// Beginner Course Definitions based on official RoboRally manual

export const RISKY_EXCHANGE: CourseDefinition = {
    id: 'risky_exchange',
    name: 'Risky Exchange',
    description: 'An easy course to start on, but don\'t fall off the edge!',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: [
        {
            id: 'exchange',
            name: 'Exchange',
            width: 12,
            height: 12,
            checkpoints: [
                { position: { x: 10, y: 5 }, number: 1 },
                { position: { x: 10, y: 10 }, number: 2 },
                { position: { x: 1, y: 10 }, number: 3 }
            ],
            startingPositions: [
                { position: { x: 0, y: 4 }, direction: Direction.RIGHT },
                { position: { x: 0, y: 5 }, direction: Direction.RIGHT },
                { position: { x: 0, y: 6 }, direction: Direction.RIGHT },
                { position: { x: 0, y: 7 }, direction: Direction.RIGHT },
                { position: { x: 11, y: 4 }, direction: Direction.LEFT },
                { position: { x: 11, y: 5 }, direction: Direction.LEFT },
                { position: { x: 11, y: 6 }, direction: Direction.LEFT },
                { position: { x: 11, y: 7 }, direction: Direction.LEFT }
            ],
            tiles: [
                // Express conveyor belt across the middle
                { position: { x: 1, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 2, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 3, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 4, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 5, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 6, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
                { position: { x: 7, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
                { position: { x: 8, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
                { position: { x: 9, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
                { position: { x: 10, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
                // Repair sites
                { position: { x: 3, y: 3 }, type: TileType.REPAIR },
                { position: { x: 8, y: 8 }, type: TileType.REPAIR },
                // Gear tiles
                { position: { x: 2, y: 2 }, type: TileType.GEAR_CW },
                { position: { x: 9, y: 9 }, type: TileType.GEAR_CCW }
            ],
            lasers: [
                { position: { x: 5, y: 1 }, direction: Direction.DOWN, damage: 1 },
                { position: { x: 6, y: 10 }, direction: Direction.UP, damage: 1 }
            ]
        }
    ]
};

export const CHECKMATE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Another easy course—just push the other robots into pits. Checkmate!',
    difficulty: 'beginner',
    minPlayers: 5,
    maxPlayers: 8,
    boards: [
        {
            id: 'chess',
            name: 'Chess',
            width: 12,
            height: 12,
            checkpoints: [
                { position: { x: 5, y: 5 }, number: 1 },
                { position: { x: 3, y: 8 }, number: 2 }
            ],
            startingPositions: [
                { position: { x: 1, y: 1 }, direction: Direction.UP },
                { position: { x: 3, y: 1 }, direction: Direction.UP },
                { position: { x: 5, y: 1 }, direction: Direction.UP },
                { position: { x: 7, y: 1 }, direction: Direction.UP },
                { position: { x: 9, y: 1 }, direction: Direction.UP },
                { position: { x: 10, y: 3 }, direction: Direction.LEFT },
                { position: { x: 10, y: 5 }, direction: Direction.LEFT },
                { position: { x: 10, y: 7 }, direction: Direction.LEFT }
            ],
            tiles: [
                // Pit tiles (chess pattern)
                { position: { x: 3, y: 3 }, type: TileType.PIT },
                { position: { x: 5, y: 3 }, type: TileType.PIT },
                { position: { x: 7, y: 3 }, type: TileType.PIT },
                { position: { x: 2, y: 4 }, type: TileType.PIT },
                { position: { x: 4, y: 4 }, type: TileType.PIT },
                { position: { x: 6, y: 4 }, type: TileType.PIT },
                { position: { x: 8, y: 4 }, type: TileType.PIT },
                { position: { x: 3, y: 5 }, type: TileType.PIT },
                { position: { x: 7, y: 5 }, type: TileType.PIT },
                { position: { x: 2, y: 6 }, type: TileType.PIT },
                { position: { x: 4, y: 6 }, type: TileType.PIT },
                { position: { x: 6, y: 6 }, type: TileType.PIT },
                { position: { x: 8, y: 6 }, type: TileType.PIT },
                { position: { x: 3, y: 7 }, type: TileType.PIT },
                { position: { x: 5, y: 7 }, type: TileType.PIT },
                { position: { x: 7, y: 7 }, type: TileType.PIT },
                { position: { x: 4, y: 8 }, type: TileType.PIT },
                { position: { x: 6, y: 8 }, type: TileType.PIT },
                // Repair sites
                { position: { x: 1, y: 10 }, type: TileType.REPAIR },
                { position: { x: 10, y: 10 }, type: TileType.REPAIR }
            ]
        }
    ]
};

export const DIZZY_DASH: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: [
        {
            id: 'spin_zone',
            name: 'Spin Zone',
            width: 12,
            height: 12,
            checkpoints: [
                { position: { x: 2, y: 2 }, number: 1 },
                { position: { x: 9, y: 2 }, number: 2 },
                { position: { x: 9, y: 9 }, number: 3 }
            ],
            startingPositions: [
                { position: { x: 1, y: 10 }, direction: Direction.UP },
                { position: { x: 2, y: 10 }, direction: Direction.UP },
                { position: { x: 3, y: 10 }, direction: Direction.UP },
                { position: { x: 4, y: 10 }, direction: Direction.UP },
                { position: { x: 7, y: 10 }, direction: Direction.UP },
                { position: { x: 8, y: 10 }, direction: Direction.UP },
                { position: { x: 9, y: 10 }, direction: Direction.UP },
                { position: { x: 10, y: 10 }, direction: Direction.UP }
            ],
            tiles: [
                // Gear tiles creating confusion
                { position: { x: 2, y: 5 }, type: TileType.GEAR_CW },
                { position: { x: 3, y: 5 }, type: TileType.GEAR_CCW },
                { position: { x: 4, y: 5 }, type: TileType.GEAR_CW },
                { position: { x: 5, y: 5 }, type: TileType.GEAR_CCW },
                { position: { x: 6, y: 5 }, type: TileType.GEAR_CW },
                { position: { x: 7, y: 5 }, type: TileType.GEAR_CCW },
                { position: { x: 8, y: 5 }, type: TileType.GEAR_CW },
                { position: { x: 9, y: 5 }, type: TileType.GEAR_CCW },
                // Conveyor belts
                { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 6, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
                { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
                { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
                // Repair sites
                { position: { x: 1, y: 1 }, type: TileType.REPAIR },
                { position: { x: 10, y: 1 }, type: TileType.REPAIR }
            ]
        }
    ]
};

export const ISLAND_HOP: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the Island or around?',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: [
        {
            id: 'island',
            name: 'Island',
            width: 12,
            height: 12,
            checkpoints: [
                { position: { x: 6, y: 6 }, number: 1 },
                { position: { x: 1, y: 10 }, number: 2 },
                { position: { x: 10, y: 1 }, number: 3 }
            ],
            startingPositions: [
                { position: { x: 0, y: 1 }, direction: Direction.RIGHT },
                { position: { x: 0, y: 2 }, direction: Direction.RIGHT },
                { position: { x: 1, y: 0 }, direction: Direction.DOWN },
                { position: { x: 2, y: 0 }, direction: Direction.DOWN },
                { position: { x: 11, y: 9 }, direction: Direction.LEFT },
                { position: { x: 11, y: 10 }, direction: Direction.LEFT },
                { position: { x: 9, y: 11 }, direction: Direction.UP },
                { position: { x: 10, y: 11 }, direction: Direction.UP }
            ],
            tiles: [
                // Water (pit) tiles around the edges
                { position: { x: 3, y: 3 }, type: TileType.PIT },
                { position: { x: 3, y: 4 }, type: TileType.PIT },
                { position: { x: 3, y: 5 }, type: TileType.PIT },
                { position: { x: 3, y: 6 }, type: TileType.PIT },
                { position: { x: 3, y: 7 }, type: TileType.PIT },
                { position: { x: 3, y: 8 }, type: TileType.PIT },
                { position: { x: 4, y: 3 }, type: TileType.PIT },
                { position: { x: 4, y: 8 }, type: TileType.PIT },
                { position: { x: 5, y: 3 }, type: TileType.PIT },
                { position: { x: 5, y: 8 }, type: TileType.PIT },
                { position: { x: 6, y: 3 }, type: TileType.PIT },
                { position: { x: 6, y: 8 }, type: TileType.PIT },
                { position: { x: 7, y: 3 }, type: TileType.PIT },
                { position: { x: 7, y: 8 }, type: TileType.PIT },
                { position: { x: 8, y: 3 }, type: TileType.PIT },
                { position: { x: 8, y: 4 }, type: TileType.PIT },
                { position: { x: 8, y: 5 }, type: TileType.PIT },
                { position: { x: 8, y: 6 }, type: TileType.PIT },
                { position: { x: 8, y: 7 }, type: TileType.PIT },
                { position: { x: 8, y: 8 }, type: TileType.PIT },
                // Repair site on the island
                { position: { x: 5, y: 6 }, type: TileType.REPAIR }
            ]
        }
    ]
};

// Simple test board for development
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

// All course definitions
export const COURSES: CourseDefinition[] = [
    RISKY_EXCHANGE,
    CHECKMATE,
    DIZZY_DASH,
    ISLAND_HOP,
    // ...DOCKING_BAY_BOARDS.map(board => ({
    //     id: board.id,
    //     name: board.name,
    //     description: 'A docking bay board.',
    //     //difficulty: 'beginner',
    //     minPlayers: 2,
    //     maxPlayers: 8,
    //     boards: [board]
    //}))
];

// Combine new and legacy courses
export const ALL_COURSES: CourseDefinition[] = [...COURSES, ...LEGACY_COURSES];

// Helper function to get a course by ID
export function getCourseById(courseId: string): CourseDefinition | undefined {
    return ALL_COURSES.find(course => course.id === courseId);
}

// Helper function to get a board by ID
export function getBoardById(boardId: string): Board {
    for (const course of ALL_COURSES) {
        const board = course.boards.find(b => b.id === boardId);
        if (board) return buildBoard(board);
        board;
    }
    return buildBoard(TEST_BOARD);
}

// Helper function to create an empty board
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