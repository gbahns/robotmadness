import { BoardDefinition, CourseDefinition, Course, TileElement, LaserElement, WallElement, Direction } from '../types';
import { getBoardDefinitionById, buildBoard } from '../board-utils';

// =============================================================================
// Easy Courses
// =============================================================================

export const RISKY_EXCHANGE: CourseDefinition = {
    id: 'risky_exchange',
    name: 'Risky Exchange',
    description: 'An easy course to start on, but don\'t fall off the edge!',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-1', 'exchange-factory-floor'], // Individual boards, not combined!
    checkpoints: [
        { position: { x: 7, y: 1 }, number: 1 },  // Top center of factory floor
        { position: { x: 9, y: 7 }, number: 2 },  // Right side of factory floor
        { position: { x: 1, y: 4 }, number: 3 },   // Left side of factory floor
    ],
};

export const CHECKMATE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Navigate the checkerboard battlefield! Watch out for the express conveyor loops and deadly pits.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'chess'],
    boardRotations: [0, 180], // Don't rotate docking bay, rotate chess board 180 degrees
    checkpoints: [
        { position: { x: 7, y: 2 }, number: 1 },   // Flag positions are applied AFTER rotation
        { position: { x: 3, y: 8 }, number: 2 }     // These are the final board positions
    ]
};

export const DIZZY_DASH_COURSE: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-1', 'spin-zone'],
    checkpoints: [
        { position: { x: 5, y: 4 }, number: 1 },
        { position: { x: 10, y: 11 }, number: 2 },
        { position: { x: 1, y: 6 }, number: 3 }
    ]
};

// Commented out until boards are created
// export const BURNOUT_COURSE: CourseDefinition = {
//     id: 'burnout',
//     name: 'Burnout',
//     description: 'Fast-paced course with express conveyors and laser gauntlet',
//     difficulty: 'intermediate',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: ['burnout-docking-bay', 'burnout-factory-floor'],
//     checkpoints: [],
// };

// export const HEAVY_TRAFFIC_COURSE: CourseDefinition = {
//     id: 'heavy_traffic',
//     name: 'Heavy Traffic',
//     description: 'Navigate through congested conveyor systems',
//     difficulty: 'intermediate',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: ['heavy-traffic-docking-bay', 'heavy-traffic-factory-floor'],
//     checkpoints: [],
// };


// =============================================================================
// SINGLE BOARD COURSES
// =============================================================================

export const ISLAND_HOP_COURSE: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the island or around?',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'island'],
    boardRotations: [0, 270], // Don't rotate docking bay, rotate island 270 degrees
    checkpoints: [
        { position: { x: 6, y: 1 }, number: 1 },
        { position: { x: 1, y: 6 }, number: 2 },
        { position: { x: 11, y: 4 }, number: 3 }
    ]
};

export const CHOP_SHOP_CHALLENGE_COURSE: CourseDefinition = {
    id: 'chop_shop_challenge',
    name: 'Chop Shop Challenge',
    description: 'Navigate through the industrial chop shop with its dangerous machinery!',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'chop-shop'],
    boardRotations: [0, 90],
    checkpoints: [
        { position: { x: 4, y: 9 }, number: 1 },
        { position: { x: 9, y: 11 }, number: 2 },
        { position: { x: 1, y: 10 }, number: 3 },
        { position: { x: 11, y: 7 }, number: 4 }
    ]
};

export const TWISTER_COURSE: CourseDefinition = {
    id: 'twister',
    name: 'Twister',
    description: 'Spin your way through this dizzying course of rotating gears and conveyor belts!',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-1', 'spin-zone'],
    checkpoints: [
        { position: { x: 2, y: 9 }, number: 1 },
        { position: { x: 3, y: 2 }, number: 2 },
        { position: { x: 9, y: 2 }, number: 3 },
        { position: { x: 8, y: 9 }, number: 4 }
    ]
};

export const BLOODBATH_CHESS_COURSE: CourseDefinition = {
    id: 'bloodbath_chess',
    name: 'Bloodbath Chess',
    description: 'Take no prisoners!',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-2', 'chess'],
    checkpoints: [
        { position: { x: 6, y: 5 }, number: 1 },
        { position: { x: 2, y: 9 }, number: 2 },
        { position: { x: 8, y: 7 }, number: 3 },
        { position: { x: 3, y: 4 }, number: 4 }
    ]
};

export const AROUND_THE_WORLD_COURSE: CourseDefinition = {
    id: 'around_the_world',
    name: 'Around the World',
    description: 'This is where the going gets really tough.',
    difficulty: 'hard',
    minPlayers: 5,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'spin-zone', 'island'],
    boardRotations: [0, 270, 270], // No rotation for docking bay, 270° (90° CCW) for spin-zone and island
    checkpoints: [
        { position: { x: 9, y: 12 }, number: 1 },
        { position: { x: 6, y: 1 }, number: 2 },
        { position: { x: 5, y: 22 }, number: 3 }
    ]
};

export const DEATH_TRAP_COURSE: CourseDefinition = {
    id: 'death_trap',
    name: 'Death Trap',
    description: 'Where you need to be isn\'t necessarily where you want to be.',
    difficulty: 'hard',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-2', 'island'],
    boardRotations: [0, 270], // No rotation for docking bay, 270° (90° CCW) for island
    checkpoints: [
        { position: { x: 7, y: 7 }, number: 1 },
        { position: { x: 0, y: 4 }, number: 2 },
        { position: { x: 6, y: 5 }, number: 3 }
    ]
};

export const PILGRIMAGE_COURSE: CourseDefinition = {
    id: 'pilgrimage',
    name: 'Pilgrimage',
    description: 'A rough-and-tumble journey.',
    difficulty: 'hard',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'exchange-factory-floor', 'cross'],
    boardRotations: [0, 180, 180],
    checkpoints: [
        { position: { x: 4, y: 8 }, number: 1 },
        { position: { x: 9, y: 19 }, number: 2 },
        { position: { x: 2, y: 14 }, number: 3 }
    ]
};

// =============================================================================
// Expert Courses
// =============================================================================

export const VAULT_ASSAULT_COURSE: CourseDefinition = {
    id: 'vault_assault',
    name: 'Vault Assault',
    description: 'In and out of the guarded Vault.',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-1', 'vault'],
    checkpoints: [
        { position: { x: 6, y: 3 }, number: 1 },
        { position: { x: 4, y: 11 }, number: 2 },
        { position: { x: 8, y: 5 }, number: 3 }
    ]
};

export const WHIRLWIND_TOUR_COURSE: CourseDefinition = {
    id: 'whirlwind_tour',
    name: 'Whirlwind Tour',
    description: 'Thankfully not a three-hour tour.',
    difficulty: 'expert',
    minPlayers: 5,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'maelstrom'],
    boardRotations: [0, 270], // -90° is same as 270°
    checkpoints: [
        { position: { x: 8, y: 0 }, number: 1 },
        { position: { x: 3, y: 11 }, number: 2 },
        { position: { x: 11, y: 6 }, number: 3 }
    ]
};

export const LOST_BEARINGS_COURSE: CourseDefinition = {
    id: 'lost_bearings',
    name: 'Lost Bearings',
    description: 'Try to keep your bearings on the twisting conveyor belts.',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-1', 'cross'],
    checkpoints: [
        { position: { x: 1, y: 2 }, number: 1 },
        { position: { x: 10, y: 9 }, number: 2 },
        { position: { x: 2, y: 8 }, number: 3 }
    ]
};

export const ROBOT_STEW_COURSE: CourseDefinition = {
    id: 'robot_stew',
    name: 'Robot Stew',
    description: 'Try not to be the main course served at the Chop Shop.',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-2', 'chop-shop'],
    boardRotations: [0, 270], // -90° is same as 270°
    checkpoints: [
        { position: { x: 0, y: 4 }, number: 1 },
        { position: { x: 9, y: 7 }, number: 2 },
        { position: { x: 2, y: 10 }, number: 3 }
    ]
};

export const ODDEST_SEA_COURSE: CourseDefinition = {
    id: 'oddest_sea',
    name: 'Oddest Sea',
    description: 'Battle against the Maelstrom for your reward.',
    difficulty: 'expert',
    minPlayers: 5,
    maxPlayers: 8,
    boards: ['docking-bay-1', 'maelstrom', 'vault'],
    boardRotations: [0, 90, 270], // 90° and -90° (270°)
    checkpoints: [
        { position: { x: 8, y: 6 }, number: 1 },
        { position: { x: 1, y: 4 }, number: 2 },
        { position: { x: 5, y: 8 }, number: 3 },
        { position: { x: 9, y: 2 }, number: 4 }
    ]
};

export const AGAINST_THE_GRAIN_COURSE: CourseDefinition = {
    id: 'against_the_grain',
    name: 'Against the Grain',
    description: 'Are you with the conveyor belts or against them?',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 4,
    boards: ['docking-bay-2', 'chess', 'chop-shop'],
    boardRotations: [0, 270, 270], // -90° is same as 270°
    checkpoints: [
        { position: { x: 10, y: 9 }, number: 1 },
        { position: { x: 3, y: 3 }, number: 2 },
        { position: { x: 5, y: 17 }, number: 3 }
    ]
};

export const ISLAND_KING_COURSE: CourseDefinition = {
    id: 'island_king',
    name: 'Island King',
    description: 'Who will be crowned King of the Island?',
    difficulty: 'expert',
    minPlayers: 5,
    maxPlayers: 8,
    boards: ['docking-bay-2', 'island'],
    boardRotations: [0, 90],
    checkpoints: [
        { position: { x: 5, y: 4 }, number: 1 },
        { position: { x: 7, y: 7 }, number: 2 },
        { position: { x: 5, y: 6 }, number: 3 }
    ]
};

export const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
    CHECKMATE,
    DIZZY_DASH_COURSE,
    ISLAND_HOP_COURSE,
    CHOP_SHOP_CHALLENGE_COURSE,
    TWISTER_COURSE,
    BLOODBATH_CHESS_COURSE,
    AROUND_THE_WORLD_COURSE,
    DEATH_TRAP_COURSE,
    PILGRIMAGE_COURSE,
    VAULT_ASSAULT_COURSE,
    WHIRLWIND_TOUR_COURSE,
    LOST_BEARINGS_COURSE,
    ROBOT_STEW_COURSE,
    ODDEST_SEA_COURSE,
    AGAINST_THE_GRAIN_COURSE,
    ISLAND_KING_COURSE
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
    ...LEGACY_COURSE_DEFINITIONS
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Rotates a board definition by the specified degrees (0, 90, 180, 270)
 */
function rotateBoardDefinition(board: BoardDefinition, degrees: number): BoardDefinition {
    if (degrees === 0) return board;

    const rotatedBoard = { ...board };

    // For 180 degree rotation, we need to:
    // 1. Flip x and y coordinates
    // 2. Adjust wall directions
    // 3. Adjust conveyor/gear directions
    // 4. Adjust laser directions

    if (degrees === 180) {
        const maxX = board.width - 1;
        const maxY = board.height - 1;

        // Rotate tiles
        if (board.tiles) {
            rotatedBoard.tiles = board.tiles.map(tile => ({
                ...tile,
                position: {
                    x: maxX - tile.position.x,
                    y: maxY - tile.position.y
                },
                // Rotate direction if present (0->2, 1->3, 2->0, 3->1)
                direction: tile.direction !== undefined ? ((tile.direction + 2) % 4) as Direction : undefined,
                // Rotate entry directions if present (180 degree rotation)
                entries: tile.entries ? tile.entries.map(entry => ((entry + 2) % 4) as Direction) : undefined
            }));
        }

        // Rotate walls
        if (board.walls) {
            rotatedBoard.walls = board.walls.map(wall => ({
                ...wall,
                position: {
                    x: maxX - wall.position.x,
                    y: maxY - wall.position.y
                },
                // Rotate wall sides (0->2, 1->3, 2->0, 3->1)
                sides: wall.sides.map(side => ((side + 2) % 4) as Direction)
            }));
        }

        // Rotate lasers
        if (board.lasers) {
            rotatedBoard.lasers = board.lasers.map(laser => ({
                ...laser,
                position: {
                    x: maxX - laser.position.x,
                    y: maxY - laser.position.y
                },
                // Rotate laser direction
                direction: ((laser.direction + 2) % 4) as Direction
            }));
        }

        // Rotate starting positions
        rotatedBoard.startingPositions = board.startingPositions.map(sp => ({
            ...sp,
            position: {
                x: maxX - sp.position.x,
                y: maxY - sp.position.y
            }
        }));
    }

    // 270 degree rotation (counterclockwise)
    if (degrees === 270) {
        const maxX = board.width - 1;

        // For 270 degrees, we swap width and height
        rotatedBoard.width = board.height;
        rotatedBoard.height = board.width;

        // Rotate tiles
        if (board.tiles) {
            rotatedBoard.tiles = board.tiles.map(tile => ({
                ...tile,
                position: {
                    x: tile.position.y,  // y becomes x
                    y: maxX - tile.position.x  // width - x becomes y
                },
                // Rotate direction counterclockwise (0->3, 1->0, 2->1, 3->2)
                direction: tile.direction !== undefined ? ((tile.direction + 3) % 4) as Direction : undefined,
                // Rotate entry directions counterclockwise (270 degree rotation)
                entries: tile.entries ? tile.entries.map(entry => ((entry + 3) % 4) as Direction) : undefined
            }));
        }

        // Rotate walls
        if (board.walls) {
            rotatedBoard.walls = board.walls.map(wall => ({
                ...wall,
                position: {
                    x: wall.position.y,
                    y: maxX - wall.position.x
                },
                // Rotate wall sides counterclockwise
                sides: wall.sides.map(side => ((side + 3) % 4) as Direction)
            }));
        }

        // Rotate lasers
        if (board.lasers) {
            rotatedBoard.lasers = board.lasers.map(laser => ({
                ...laser,
                position: {
                    x: laser.position.y,
                    y: maxX - laser.position.x
                },
                // Rotate laser direction counterclockwise
                direction: ((laser.direction + 3) % 4) as Direction
            }));
        }

        // Rotate starting positions
        rotatedBoard.startingPositions = board.startingPositions.map(sp => ({
            ...sp,
            position: {
                x: sp.position.y,
                y: maxX - sp.position.x
            }
        }));
    }

    // 90 degree rotation (clockwise)
    if (degrees === 90) {
        const maxY = board.height - 1;

        // For 90 degrees, we swap width and height
        rotatedBoard.width = board.height;
        rotatedBoard.height = board.width;

        // Rotate tiles
        if (board.tiles) {
            rotatedBoard.tiles = board.tiles.map(tile => ({
                ...tile,
                position: {
                    x: maxY - tile.position.y,  // height - y becomes x
                    y: tile.position.x  // x becomes y
                },
                // Rotate direction clockwise (0->1, 1->2, 2->3, 3->0)
                direction: tile.direction !== undefined ? ((tile.direction + 1) % 4) as Direction : undefined,
                // Rotate entry directions clockwise (90 degree rotation)
                entries: tile.entries ? tile.entries.map(entry => ((entry + 1) % 4) as Direction) : undefined
            }));
        }

        // Rotate walls
        if (board.walls) {
            rotatedBoard.walls = board.walls.map(wall => ({
                ...wall,
                position: {
                    x: maxY - wall.position.y,
                    y: wall.position.x
                },
                // Rotate wall sides clockwise
                sides: wall.sides.map(side => ((side + 1) % 4) as Direction)
            }));
        }

        // Rotate lasers
        if (board.lasers) {
            rotatedBoard.lasers = board.lasers.map(laser => ({
                ...laser,
                position: {
                    x: maxY - laser.position.y,
                    y: laser.position.x
                },
                // Rotate laser direction clockwise
                direction: ((laser.direction + 1) % 4) as Direction
            }));
        }

        // Rotate starting positions
        rotatedBoard.startingPositions = board.startingPositions.map(sp => ({
            ...sp,
            position: {
                x: maxY - sp.position.y,
                y: sp.position.x
            }
        }));
    }

    return rotatedBoard;
}

export function getCourseById(courseId: string): CourseDefinition {
    const course = ALL_COURSE_DEFINITIONS.find(course => course.id === courseId);
    if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
    }
    console.log(`getCourseById(${courseId})`, course);
    return course;
}

export function getCoursesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'hard' | 'expert'): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(course => course.difficulty === difficulty);
}

export function getCoursesForPlayerCount(playerCount: number): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(
        course => playerCount >= course.minPlayers && playerCount <= course.maxPlayers
    );
}

export function buildCourse(courseDef: CourseDefinition): Course {
    // Get all board definitions and apply rotations
    const boardDefs = courseDef.boards
        .map((id, index) => {
            const board = getBoardDefinitionById(id);
            if (!board) return null;

            // Apply rotation if specified
            const rotation = courseDef.boardRotations?.[index] || 0;
            return rotateBoardDefinition(board, rotation);
        })
        .filter(Boolean) as BoardDefinition[];

    if (boardDefs.length === 0) {
        throw new Error(`No valid boards found for course: ${courseDef.id}`);
    }

    let combinedBoard: BoardDefinition;

    if (boardDefs.length === 1) {
        combinedBoard = boardDefs[0];
    } else if (boardDefs.length > 1) {
        // Stack boards from bottom to top
        // The first board in the array should appear at the bottom of the screen
        // Start with the last board (which will be at the top)
        combinedBoard = boardDefs[boardDefs.length - 1];
        // Add each board below the previous one, working backwards
        for (let i = boardDefs.length - 2; i >= 0; i--) {
            combinedBoard = combineBoardsVertically(combinedBoard, boardDefs[i]);
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

// /**
//  * Creates a complete course with docking bay + factory floor combination
//  * Returns both the combined board definition and course definition
//  */
// export function createCombinedCourse(
//     courseId: string,
//     courseName: string,
//     description: string,
//     difficulty: 'beginner' | 'intermediate' | 'hard' | 'expert',
//     factoryFloorBoard: BoardDefinition,
//     dockingBayBoard: BoardDefinition
// ): { board: BoardDefinition; course: CourseDefinition } {
//     const combinedBoard = combineBoardsVertically(factoryFloorBoard, dockingBayBoard);
//     // Ensure the combined board has a proper ID for referencing
//     combinedBoard.id = `${courseId}-board`;
//     combinedBoard.name = `${courseName} Board`;

//     const course: CourseDefinition = {
//         id: courseId,
//         name: courseName,
//         description,
//         difficulty,
//         minPlayers: 2,
//         maxPlayers: Math.min(8, dockingBayBoard.startingPositions.length),
//         boards: [combinedBoard.id], // Reference the board ID, not the board itself
//         checkpoints: [],
//     };

//     return { board: combinedBoard, course };
// }

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Combines two boards vertically: first board on top, second board on bottom.
 * @param topBoard - The board that will be placed on top
 * @param bottomBoard - The board that will be placed on bottom
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