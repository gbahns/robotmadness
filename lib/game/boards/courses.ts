import { BoardDefinition, TileElement, LaserElement, WallElement } from '../types';
import { RISKY_EXCHANGE_DOCKING_BAY, DOCKING_BAY_4P, DOCKING_BAY_8P, DOCKING_BAY_WIDE, DOCKING_BAY_COMPACT, SIMPLE_FACTORY_FLOOR, CONVEYOR_FACTORY_FLOOR } from './dockingBayBoards';
import { } from './factoryFloorBoards';
import { EXCHANGE_FACTORY_FLOOR } from './officialBoards';

// =============================================================================
// OFFICIAL MULTI-BOARD COURSES (from RoboRally manual)
// =============================================================================

// =============================================================================
// COURSE DEFINITIONS
// =============================================================================

export interface CourseDefinition {
    id: string;
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    minPlayers: number;
    maxPlayers: number;
    boards: string[]; // Array of board IDs, not embedded boards
}


// OFFICIAL RISKY EXCHANGE COURSE - References the combined board
export const OFFICIAL_RISKY_EXCHANGE: CourseDefinition = {
    id: 'official_risky_exchange',
    name: 'Risky Exchange (Official)',
    description: 'An easy course to start on, but don\'t fall off the edge! Based on the official RoboRally rulebook.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['risky-exchange-combined'] // Reference to combined board ID
};

export const RISKY_EXCHANGE_COURSE: CourseDefinition = {
    id: 'risky_exchange',
    name: 'Risky Exchange',
    description: 'The official Risky Exchange course with conveyor highway',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['risky-exchange-docking-bay', 'exchange-factory-floor']
};

export const BURNOUT_COURSE: CourseDefinition = {
    id: 'burnout',
    name: 'Burnout',
    description: 'Fast-paced course with express conveyors and laser gauntlet',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['burnout-docking-bay', 'burnout-factory-floor']
};

export const HEAVY_TRAFFIC_COURSE: CourseDefinition = {
    id: 'heavy_traffic',
    name: 'Heavy Traffic',
    description: 'Navigate through congested conveyor systems',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['heavy-traffic-docking-bay', 'heavy-traffic-factory-floor']
};

// Export array of official courses
export const OFFICIAL_COURSE_DEFINITIONS_OLD: CourseDefinition[] = [
    RISKY_EXCHANGE_COURSE,
    BURNOUT_COURSE,
    HEAVY_TRAFFIC_COURSE
];

// =============================================================================
// COMBINED BOARD COURSES (using the combined board approach)
// =============================================================================

export const BEGINNER_COMBINED_COURSE: CourseDefinition = {
    id: 'beginner_course',
    name: 'Beginner Course',
    description: 'A simple course for new players',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['beginner-combined-board']
};

export const INTERMEDIATE_COMBINED_COURSE: CourseDefinition = {
    id: 'intermediate_course',
    name: 'Intermediate Course',
    description: 'A challenging course with conveyor loops',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['intermediate-combined-board']
};

export const ADVANCED_COMBINED_COURSE: CourseDefinition = {
    id: 'advanced_course',
    name: 'Advanced Course',
    description: 'Expert level course with multiple hazards',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['advanced-combined-board']
};

export const COMBINED_COURSES: CourseDefinition[] = [
    BEGINNER_COMBINED_COURSE,
    INTERMEDIATE_COMBINED_COURSE,
    ADVANCED_COMBINED_COURSE
];

// =============================================================================
// SINGLE BOARD COURSES
// =============================================================================

export const CHECKMATE_COURSE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Quick and easy—just like chess. Right?',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['checkmate-board']
};

export const DIZZY_DASH_COURSE: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['dizzy-dash-board']
};

export const ISLAND_HOP_COURSE: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the island or around?',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['island-hop-board']
};

export const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
    CHECKMATE_COURSE,
    DIZZY_DASH_COURSE,
    ISLAND_HOP_COURSE
];

// =============================================================================
// TEST & LEGACY COURSES
// =============================================================================

export const TEST_COURSE: CourseDefinition = {
    id: 'test',
    name: 'Test Course',
    description: 'Simple test course for development',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['test']
};

export const CONVEYOR_LOOP_COURSE: CourseDefinition = {
    id: 'conveyor_loop',
    name: 'Conveyor Loop Test',
    description: 'Test course with complex conveyor patterns',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['conveyor-loop-test']
};

export const LASER_TEST_COURSE: CourseDefinition = {
    id: 'laser_test',
    name: 'Laser Test Arena',
    description: 'A testing ground for laser mechanics',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['laser-arena']
};

export const LEGACY_COURSE_DEFINITIONS: CourseDefinition[] = [
    TEST_COURSE,
    CONVEYOR_LOOP_COURSE,
    LASER_TEST_COURSE
];

// =============================================================================
// ALL COURSES COMBINED
// =============================================================================

// All official course definitions
export const OFFICIAL_COURSE_DEFINITIONS: CourseDefinition[] = [
    OFFICIAL_RISKY_EXCHANGE
];

export const ALL_COURSE_DEFINITIONS: CourseDefinition[] = [
    ...OFFICIAL_COURSE_DEFINITIONS,  // Official courses first
    ...SINGLE_BOARD_COURSE_DEFINITIONS,
    ...COMBINED_COURSES,
    ...LEGACY_COURSE_DEFINITIONS
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getCourseById(courseId: string): CourseDefinition | undefined {
    return ALL_COURSE_DEFINITIONS.find(course => course.id === courseId);
}

export function getCoursesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'expert'): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(course => course.difficulty === difficulty);
}

export function getCoursesForPlayerCount(playerCount: number): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(
        course => playerCount >= course.minPlayers && playerCount <= course.maxPlayers
    );
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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


// Get all boards for a course
// export function getBoardsForCourse(courseId: string): BoardDefinition[] {
//     const course = getCourseById(courseId);
//     if (!course) return [];

//     return course.boards
//         .map(boardId => getBoardDefinitionById(boardId))
//         .filter((board): board is BoardDefinition => board !== undefined);
// }


// =============================================================================
// from factoryFloorBoards.ts
// =============================================================================
// =============================================================================
// COURSE DEFINITIONS (References to Boards)
// =============================================================================

// export const CHECKMATE_COURSE: CourseDefinition = {
//     id: 'checkmate',
//     name: 'Checkmate',
//     description: 'Another easy course—just push the other robots into pits.',
//     difficulty: 'beginner',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: ['checkmate-board'] // Reference to board ID
// };

// export const DIZZY_DASH_COURSE: CourseDefinition = {
//     id: 'dizzy_dash',
//     name: 'Dizzy Dash',
//     description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
//     difficulty: 'beginner',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: ['dizzy-dash-board'] // Reference to board ID
// };

// export const ISLAND_HOP_COURSE: CourseDefinition = {
//     id: 'island_hop',
//     name: 'Island Hop',
//     description: 'Over the island or around?',
//     difficulty: 'intermediate',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: ['island-hop-board'] // Reference to board ID
// };

// // Single board course definitions
// const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
//     CHECKMATE_COURSE,
//     DIZZY_DASH_COURSE,
//     ISLAND_HOP_COURSE
// ];


// =============================================================================
// From dockingBayBoards.ts
// =============================================================================
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
// export const COMBINED_COURSES: CourseDefinition[] = [
//     simpleStartData.course,
//     conveyorChaosData.course,
//     wideEntryData.course,
//     compactChallengeData.course
// ];

// =============================================================================
// from officialBoards.ts
// =============================================================================
// Combined board for Risky Exchange
export const RISKY_EXCHANGE_COMBINED_BOARD = combineBoardsVertically(
    RISKY_EXCHANGE_DOCKING_BAY,
    EXCHANGE_FACTORY_FLOOR
);

// Ensure the combined board has a proper ID
RISKY_EXCHANGE_COMBINED_BOARD.id = 'risky-exchange-combined';
RISKY_EXCHANGE_COMBINED_BOARD.name = 'Risky Exchange Combined';


// Backward compatibility exports
export const ALL_COURSES = ALL_COURSE_DEFINITIONS;
export const COURSES = ALL_COURSE_DEFINITIONS;