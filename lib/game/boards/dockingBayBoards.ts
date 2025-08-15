// lib/game/boards/dockingBayBoards.ts - Replace your existing file with this

import { CourseDefinition, BoardDefinition, TileElement, LaserElement, WallElement } from './factoryFloorBoards';
import { Direction, TileType } from '../types';

export const DOCKING_BAY_4P: BoardDefinition = {
    id: 'docking-bay-4p',
    name: 'Docking Bay (4 Players)',
    width: 12,
    height: 4,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        { position: { x: 1, y: 0 }, direction: Direction.UP },
        { position: { x: 4, y: 0 }, direction: Direction.UP },
        { position: { x: 7, y: 0 }, direction: Direction.UP },
        { position: { x: 10, y: 0 }, direction: Direction.UP }
    ],
    tiles: [
        // Simple conveyors leading out of the docking bay
        { position: { x: 1, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 4, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

export const DOCKING_BAY_8P: BoardDefinition = {
    id: 'docking-bay-8p',
    name: 'Docking Bay (8 Players)',
    width: 12,
    height: 6,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        // Front row
        { position: { x: 1, y: 0 }, direction: Direction.UP },
        { position: { x: 3, y: 0 }, direction: Direction.UP },
        { position: { x: 5, y: 0 }, direction: Direction.UP },
        { position: { x: 7, y: 0 }, direction: Direction.UP },
        { position: { x: 9, y: 0 }, direction: Direction.UP },
        { position: { x: 11, y: 0 }, direction: Direction.UP },
        // Back row
        { position: { x: 2, y: 1 }, direction: Direction.UP },
        { position: { x: 10, y: 1 }, direction: Direction.UP }
    ],
    tiles: [
        // Conveyors from front row
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        // Conveyors from back row
        { position: { x: 2, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

export const DOCKING_BAY_WIDE: BoardDefinition = {
    id: 'docking-bay-wide',
    name: 'Wide Docking Bay',
    width: 12,
    height: 3,
    checkpoints: [],
    startingPositions: [
        { position: { x: 0, y: 0 }, direction: Direction.UP },
        { position: { x: 2, y: 0 }, direction: Direction.UP },
        { position: { x: 4, y: 0 }, direction: Direction.UP },
        { position: { x: 6, y: 0 }, direction: Direction.UP },
        { position: { x: 8, y: 0 }, direction: Direction.UP },
        { position: { x: 10, y: 0 }, direction: Direction.UP }
    ],
    tiles: [
        // Central conveyor line leading to factory floor
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 4, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT }
    ],
    lasers: [],
    walls: [
        // Side walls to contain the docking area
        { position: { x: 0, y: 1 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 1 }, sides: [Direction.LEFT] }
    ]
};

export const DOCKING_BAY_COMPACT: BoardDefinition = {
    id: 'docking-bay-compact',
    name: 'Compact Docking Bay',
    width: 12,
    height: 2,
    checkpoints: [],
    startingPositions: [
        { position: { x: 2, y: 0 }, direction: Direction.UP },
        { position: { x: 4, y: 0 }, direction: Direction.UP },
        { position: { x: 6, y: 0 }, direction: Direction.UP },
        { position: { x: 8, y: 0 }, direction: Direction.UP }
    ],
    tiles: [
        // Simple exit conveyors
        { position: { x: 2, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 4, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

export const DOCKING_BAY_BOARDS: BoardDefinition[] = [
    DOCKING_BAY_4P,
    DOCKING_BAY_8P,
    DOCKING_BAY_WIDE,
    DOCKING_BAY_COMPACT
];

/**
 * Combines a docking bay board with a factory floor board vertically.
 * The docking bay is placed at the bottom (higher y coordinates) with starting positions,
 * and the factory floor is placed above it.
 */
export function combineBoardsVertically(dockingBay: BoardDefinition, factoryFloor: BoardDefinition): BoardDefinition {
    const combinedHeight = factoryFloor.height + dockingBay.height;

    // Offset all docking bay elements by the factory floor height
    const offsetDockingBayTiles: TileElement[] = (dockingBay.tiles || []).map(tile => ({
        ...tile,
        position: {
            x: tile.position.x,
            y: tile.position.y + factoryFloor.height
        }
    }));

    const offsetDockingBayLasers: LaserElement[] = (dockingBay.lasers || []).map(laser => ({
        ...laser,
        position: {
            x: laser.position.x,
            y: laser.position.y + factoryFloor.height
        }
    }));

    const offsetDockingBayWalls: WallElement[] = (dockingBay.walls || []).map(wall => ({
        ...wall,
        position: {
            x: wall.position.x,
            y: wall.position.y + factoryFloor.height
        }
    }));

    const offsetDockingBayStartingPositions = dockingBay.startingPositions.map(sp => ({
        ...sp,
        position: {
            x: sp.position.x,
            y: sp.position.y + factoryFloor.height
        }
    }));

    // Combine all elements
    const combinedTiles: TileElement[] = [
        ...(factoryFloor.tiles || []),
        ...offsetDockingBayTiles
    ];

    const combinedLasers: LaserElement[] = [
        ...(factoryFloor.lasers || []),
        ...offsetDockingBayLasers
    ];

    const combinedWalls: WallElement[] = [
        ...(factoryFloor.walls || []),
        ...offsetDockingBayWalls
    ];

    return {
        id: `${factoryFloor.id}-with-${dockingBay.id}`,
        name: `${factoryFloor.name} with ${dockingBay.name}`,
        width: Math.max(factoryFloor.width, dockingBay.width), // Use the wider board
        height: combinedHeight,
        checkpoints: factoryFloor.checkpoints, // Only factory floor has checkpoints
        startingPositions: offsetDockingBayStartingPositions, // Only docking bay has starting positions
        tiles: combinedTiles.length > 0 ? combinedTiles : undefined,
        lasers: combinedLasers.length > 0 ? combinedLasers : undefined,
        walls: combinedWalls.length > 0 ? combinedWalls : undefined
    };
}

/**
 * Creates a complete course with docking bay + factory floor combination
 * Returns both the combined board definition and course definition
 */
export function createCombinedCourse(
    courseId: string,
    courseName: string,
    description: string,
    difficulty: 'beginner' | 'intermediate' | 'expert',
    factoryFloorBoard: BoardDefinition,
    dockingBayBoard: BoardDefinition = DOCKING_BAY_4P
): { board: BoardDefinition; course: CourseDefinition } {
    const combinedBoard = combineBoardsVertically(dockingBayBoard, factoryFloorBoard);
    // Ensure the combined board has a proper ID for referencing
    combinedBoard.id = `${courseId}-board`;
    combinedBoard.name = `${courseName} Board`;

    const course: CourseDefinition = {
        id: courseId,
        name: courseName,
        description,
        difficulty,
        minPlayers: 2,
        maxPlayers: Math.min(8, dockingBayBoard.startingPositions.length),
        boards: [combinedBoard.id] // Reference the board ID, not the board itself
    };

    return { board: combinedBoard, course };
}

// Example factory floor boards for combination
export const SIMPLE_FACTORY_FLOOR: BoardDefinition = {
    id: 'simple-factory',
    name: 'Simple Factory Floor',
    width: 12,
    height: 8,
    checkpoints: [
        { position: { x: 6, y: 2 }, number: 1 },
        { position: { x: 2, y: 6 }, number: 2 },
        { position: { x: 10, y: 6 }, number: 3 }
    ],
    startingPositions: [], // Will be provided by docking bay
    tiles: [
        // Central conveyor belt
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        // Repair sites near checkpoints
        { position: { x: 6, y: 1 }, type: TileType.REPAIR },
        { position: { x: 1, y: 6 }, type: TileType.REPAIR },
        { position: { x: 11, y: 6 }, type: TileType.REPAIR },
        // Some gears for rotation
        { position: { x: 3, y: 3 }, type: TileType.GEAR_CW },
        { position: { x: 9, y: 3 }, type: TileType.GEAR_CCW }
    ],
    lasers: [
        { position: { x: 0, y: 2 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 5 }, direction: Direction.LEFT, damage: 1 }
    ],
    walls: [
        { position: { x: 4, y: 2 }, sides: [Direction.UP] },
        { position: { x: 8, y: 2 }, sides: [Direction.UP] }
    ]
};

export const CONVEYOR_FACTORY_FLOOR: BoardDefinition = {
    id: 'conveyor-factory',
    name: 'Conveyor Factory Floor',
    width: 12,
    height: 10,
    checkpoints: [
        { position: { x: 2, y: 2 }, number: 1 },
        { position: { x: 10, y: 2 }, number: 2 },
        { position: { x: 6, y: 8 }, number: 3 }
    ],
    startingPositions: [],
    tiles: [
        // Complex conveyor system
        { position: { x: 1, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 3, y: 4 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 3, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 4 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        // Regular conveyors
        { position: { x: 1, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        // Gears at strategic points
        { position: { x: 2, y: 1 }, type: TileType.GEAR_CW },
        { position: { x: 10, y: 1 }, type: TileType.GEAR_CCW },
        { position: { x: 6, y: 9 }, type: TileType.GEAR_CW },
        // Repair sites
        { position: { x: 0, y: 5 }, type: TileType.REPAIR },
        { position: { x: 11, y: 5 }, type: TileType.REPAIR }
    ],
    lasers: [
        { position: { x: 6, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 0, y: 9 }, direction: Direction.RIGHT, damage: 2 },
        { position: { x: 11, y: 9 }, direction: Direction.LEFT, damage: 2 }
    ],
    walls: [
        { position: { x: 1, y: 1 }, sides: [Direction.UP, Direction.LEFT] },
        { position: { x: 11, y: 1 }, sides: [Direction.UP, Direction.RIGHT] },
        { position: { x: 5, y: 6 }, sides: [Direction.UP] },
        { position: { x: 7, y: 6 }, sides: [Direction.UP] }
    ]
};

// Create combined course data
const simpleStartData = createCombinedCourse(
    'simple-start',
    'Simple Start',
    'A beginner-friendly course with basic elements and a standard docking bay.',
    'beginner',
    SIMPLE_FACTORY_FLOOR,
    DOCKING_BAY_4P
);

const conveyorChaosData = createCombinedCourse(
    'conveyor-chaos',
    'Conveyor Chaos',
    'Navigate through complex conveyor belts in this intermediate challenge.',
    'intermediate',
    CONVEYOR_FACTORY_FLOOR,
    DOCKING_BAY_8P
);

const wideEntryData = createCombinedCourse(
    'wide-entry',
    'Wide Entry',
    'A course with a wide docking bay allowing for interesting starting strategies.',
    'beginner',
    SIMPLE_FACTORY_FLOOR,
    DOCKING_BAY_WIDE
);

const compactChallengeData = createCombinedCourse(
    'compact-challenge',
    'Compact Challenge',
    'Start from a compact docking bay and navigate the conveyor factory floor.',
    'intermediate',
    CONVEYOR_FACTORY_FLOOR,
    DOCKING_BAY_COMPACT
);

// Export the board definitions
export const COMBINED_BOARD_DEFINITIONS: BoardDefinition[] = [
    simpleStartData.board,
    conveyorChaosData.board,
    wideEntryData.board,
    compactChallengeData.board
];

// Export the course definitions
export const COMBINED_COURSES: CourseDefinition[] = [
    simpleStartData.course,
    conveyorChaosData.course,
    wideEntryData.course,
    compactChallengeData.course
];