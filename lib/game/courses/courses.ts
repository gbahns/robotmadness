import { BoardDefinition, CourseDefinition, Course, TileElement, LaserElement, WallElement, Tile, Laser, TileType } from '../types';
import { getBoardDefinitionById, buildBoard } from '../board-utils';

// =============================================================================
// OFFICIAL MULTI-BOARD COURSES (from RoboRally manual)
// =============================================================================

// =============================================================================
// COURSE DEFINITIONS
// =============================================================================

// OFFICIAL RISKY EXCHANGE COURSE - References the individual boards
export const RISKY_EXCHANGE: CourseDefinition = {
    id: 'official_risky_exchange',
    name: 'Risky Exchange',
    description: 'An easy course to start on, but don\'t fall off the edge! Based on the official RoboRally rulebook.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['exchange-factory-floor', 'docking-bay-1'], // Individual boards, not combined!
    checkpoints: [
        { position: { x: 7, y: 1 }, number: 1 },  // Top center of factory floor
        { position: { x: 9, y: 7 }, number: 2 },  // Right side of factory floor
        { position: { x: 1, y: 4 }, number: 3 },   // Left side of factory floor
    ],
};

export const RISKY_EXCHANGE_COURSE: CourseDefinition = {
    id: 'risky_exchange',
    name: 'Risky Exchange',
    description: 'The official Risky Exchange course with conveyor highway',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-1', 'exchange-factory-floor'],
    checkpoints: [],
};

export const BURNOUT_COURSE: CourseDefinition = {
    id: 'burnout',
    name: 'Burnout',
    description: 'Fast-paced course with express conveyors and laser gauntlet',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['burnout-docking-bay', 'burnout-factory-floor'],
    checkpoints: [],
};

export const HEAVY_TRAFFIC_COURSE: CourseDefinition = {
    id: 'heavy_traffic',
    name: 'Heavy Traffic',
    description: 'Navigate through congested conveyor systems',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['heavy-traffic-docking-bay', 'heavy-traffic-factory-floor'],
    checkpoints: [],
};

export const CHECKMATE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Navigate the checkerboard battlefield! Watch out for the express conveyor loops and deadly pits.',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'chess'],
    checkpoints: [
        { position: { x: 11, y: 4 }, number: 1 },   // Top-right repair site (adjusted for docking bay height)
        { position: { x: 5, y: 9 }, number: 2 },    // Center option tile (adjusted for docking bay height)
        { position: { x: 0, y: 15 }, number: 3 }    // Bottom-left repair site (adjusted for docking bay height)
    ]
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

export const COMBINED_COURSES: CourseDefinition[] = [
    CHECKMATE
];

// =============================================================================
// SINGLE BOARD COURSES
// =============================================================================

export const DIZZY_DASH_COURSE: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['dizzy-dash-board'],
    checkpoints: [
        { position: { x: 3, y: 3 }, number: 1 },
        { position: { x: 9, y: 9 }, number: 2 },
        { position: { x: 6, y: 6 }, number: 3 }
    ]
};

export const ISLAND_HOP_COURSE: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the island or around?',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['island-hop-board'],
    checkpoints: [
        { position: { x: 6, y: 2 }, number: 1 },
        { position: { x: 10, y: 6 }, number: 2 },
        { position: { x: 6, y: 10 }, number: 3 }
    ]
};

export const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
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
    boards: ['test'],
    checkpoints: [
        { position: { x: 6, y: 3 }, number: 1 },
        { position: { x: 9, y: 9 }, number: 2 },
        { position: { x: 3, y: 6 }, number: 3 }
    ]
};

export const LEGACY_COURSE_DEFINITIONS: CourseDefinition[] = [
    TEST_COURSE
];

// =============================================================================
// ALL COURSES COMBINED
// =============================================================================

// All official course definitions
export const OFFICIAL_COURSE_DEFINITIONS: CourseDefinition[] = [
    RISKY_EXCHANGE
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

export function getCourseById(courseId: string): CourseDefinition {
    const course = ALL_COURSE_DEFINITIONS.find(course => course.id === courseId);
    if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
    }
    console.log(`getCourseById(${courseId})`, course);
    return course;
}

export function getCoursesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'expert'): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(course => course.difficulty === difficulty);
}

export function getCoursesForPlayerCount(playerCount: number): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(
        course => playerCount >= course.minPlayers && playerCount <= course.maxPlayers
    );
}

export function buildCourse(courseDef: CourseDefinition): Course {
    // Get all board definitions
    const boardDefs = courseDef.boards
        .map(id => getBoardDefinitionById(id))
        .filter(Boolean) as BoardDefinition[];

    if (boardDefs.length === 0) {
        throw new Error(`No valid boards found for course: ${courseDef.id}`);
    }

    // Separate factory floors and docking bays
    const factoryFloors = boardDefs.filter(b => !b.id.includes('docking'));
    const dockingBays = boardDefs.filter(b => b.id.includes('docking'));

    let combinedBoard: BoardDefinition;

    if (boardDefs.length === 1) {
        combinedBoard = boardDefs[0];
    } else if (factoryFloors.length > 0 && dockingBays.length > 0) {
        combinedBoard = combineBoardsVertically(factoryFloors[0], dockingBays[0]);

        // If there are multiple factory floors, combine them too
        for (let i = 1; i < factoryFloors.length; i++) {
            combinedBoard = combineBoardsVertically(combinedBoard, factoryFloors[i]);
        }
    } else {
        throw new Error(`Invalid board configuration for course: ${courseDef.id}`);
    }

    const board = buildBoard(combinedBoard);

    const course: Course = {
        definition: courseDef,
        board: board
    };

    return course;
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
    dockingBayBoard: BoardDefinition
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
        boards: [combinedBoard.id], // Reference the board ID, not the board itself
        checkpoints: [],
    };

    return { board: combinedBoard, course };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Combines two boards vertically: first board on top, second board on bottom.
 * @param topBoard - The board that will be placed on top (usually factory floor)
 * @param bottomBoard - The board that will be placed on bottom (usually docking bay)
 */
export function combineBoardsVertically(topBoard: BoardDefinition, bottomBoard: BoardDefinition): BoardDefinition {
    const combinedHeight = topBoard.height + bottomBoard.height;

    // Offset all bottom board elements by the top board height
    const offsetBottomTiles: TileElement[] = (bottomBoard.tiles || []).map(tile => ({
        ...tile,
        position: {
            x: tile.position.x,
            y: tile.position.y + topBoard.height
        }
    }));

    const offsetBottomLasers: LaserElement[] = (bottomBoard.lasers || []).map(laser => ({
        ...laser,
        position: {
            x: laser.position.x,
            y: laser.position.y + topBoard.height
        }
    }));

    const offsetBottomWalls: WallElement[] = (bottomBoard.walls || []).map(wall => ({
        ...wall,
        position: {
            x: wall.position.x,
            y: wall.position.y + topBoard.height
        }
    }));

    const offsetBottomStartingPositions = bottomBoard.startingPositions.map(sp => ({
        ...sp,
        position: {
            x: sp.position.x,
            y: sp.position.y + topBoard.height
        }
    }));

    // Combine all elements
    const combinedTiles: TileElement[] = [
        ...(topBoard.tiles || []),
        ...offsetBottomTiles
    ];

    const combinedLasers: LaserElement[] = [
        ...(topBoard.lasers || []),
        ...offsetBottomLasers
    ];

    const combinedWalls: WallElement[] = [
        ...(topBoard.walls || []),
        ...offsetBottomWalls
    ];

    return {
        id: `${topBoard.id}-with-${bottomBoard.id}`,
        name: `${topBoard.name} with ${bottomBoard.name}`,
        width: Math.max(topBoard.width, bottomBoard.width),
        height: combinedHeight,
        startingPositions: offsetBottomStartingPositions,
        tiles: combinedTiles.length > 0 ? combinedTiles : undefined,
        lasers: combinedLasers.length > 0 ? combinedLasers : undefined,
        walls: combinedWalls.length > 0 ? combinedWalls : undefined
    };
}

// =============================================================================
// From dockingBayBoards.ts
// =============================================================================
// Create combined course data

// Export the board definitions
// Export the course definitions
// export const COMBINED_COURSES: CourseDefinition[] = [
//     simpleStartData.course,
//     conveyorChaosData.course,
//     wideEntryData.course,
//     compactChallengeData.course
// ];

// Backward compatibility exports
export const ALL_COURSES = ALL_COURSE_DEFINITIONS;
export const COURSES = ALL_COURSE_DEFINITIONS;