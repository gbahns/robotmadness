import { CourseDefinition, BoardDefinition, TileElement, LaserElement, WallElement } from './factoryFloorBoards';
import { Direction, TileType } from '../types';
import { combineBoardsVertically } from './dockingBayBoards';

// =============================================================================
// BOARD DEFINITIONS
// =============================================================================

// ACCURATE EXCHANGE FACTORY FLOOR BOARD from official rulebook
export const EXCHANGE_FACTORY_FLOOR: BoardDefinition = {
    id: 'exchange-factory-floor',
    name: 'Exchange Factory Floor',
    width: 12,
    height: 12,
    checkpoints: [
        { position: { x: 7, y: 1 }, number: 1 },  // Top center checkpoint
        { position: { x: 9, y: 7 }, number: 2 },  // Right side checkpoint  
        { position: { x: 1, y: 4 }, number: 3 }   // Left side checkpoint
    ],
    startingPositions: [], // Will be provided by docking bay
    tiles: [
        // MAIN EXPRESS CONVEYOR SYSTEM - Yellow/orange conveyors from the image

        // Top horizontal express conveyor row (going RIGHT)
        { position: { x: 0, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },

        // Bottom horizontal express conveyor row (going LEFT)
        { position: { x: 0, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 1, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 11, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },

        // BLUE REGULAR CONVEYORS from the image

        // Top-right vertical blue conveyors (going DOWN)
        { position: { x: 8, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 8, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 8, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        { position: { x: 9, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        { position: { x: 10, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        // Top-right horizontal blue conveyors (going RIGHT)  
        { position: { x: 11, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Bottom-right vertical blue conveyors (going UP)
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },

        { position: { x: 9, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },

        { position: { x: 10, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Left side regular conveyors
        { position: { x: 0, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        { position: { x: 0, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Left side bottom conveyors
        { position: { x: 0, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        { position: { x: 0, y: 9 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 9 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 9 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // GEAR TILES (rotating elements visible in corners)
        { position: { x: 1, y: 1 }, type: TileType.GEAR_CW },
        { position: { x: 11, y: 11 }, type: TileType.GEAR_CCW },
        { position: { x: 1, y: 11 }, type: TileType.GEAR_CW },
        { position: { x: 11, y: 1 }, type: TileType.GEAR_CCW },

        // REPAIR SITES (wrench symbols visible in image)
        { position: { x: 5, y: 2 }, type: TileType.REPAIR },
        { position: { x: 7, y: 9 }, type: TileType.REPAIR }
    ],
    lasers: [
        // Laser emitters from edges (red lines in image)
        { position: { x: 4, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 0, y: 7 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 9 }, direction: Direction.LEFT, damage: 1 }
    ],
    walls: [
        // Walls around critical areas and edges
        { position: { x: 3, y: 1 }, sides: [Direction.UP] },
        { position: { x: 6, y: 1 }, sides: [Direction.UP] },
        { position: { x: 3, y: 10 }, sides: [Direction.DOWN] },
        { position: { x: 6, y: 10 }, sides: [Direction.DOWN] },
        { position: { x: 7, y: 7 }, sides: [Direction.RIGHT] },
        { position: { x: 4, y: 4 }, sides: [Direction.LEFT] }
    ]
};

// ACCURATE DOCKING BAY for Risky Exchange (8 starting positions)
export const RISKY_EXCHANGE_DOCKING_BAY: BoardDefinition = {
    id: 'risky-exchange-docking-bay',
    name: 'Risky Exchange Docking Bay',
    width: 12,
    height: 4,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        // Starting positions 1-8 as shown in the official image
        { position: { x: 3, y: 1 }, direction: Direction.UP },  // Position 1
        { position: { x: 1, y: 1 }, direction: Direction.UP },  // Position 2  
        { position: { x: 5, y: 1 }, direction: Direction.UP },  // Position 3
        { position: { x: 7, y: 1 }, direction: Direction.UP },  // Position 4
        { position: { x: 9, y: 1 }, direction: Direction.UP },  // Position 5
        { position: { x: 11, y: 1 }, direction: Direction.UP }, // Position 6
        { position: { x: 0, y: 1 }, direction: Direction.UP },  // Position 7
        { position: { x: 10, y: 1 }, direction: Direction.UP }  // Position 8
    ],
    tiles: [
        // Simple conveyors leading from docking bay to factory floor
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 0, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

// Combined board for Risky Exchange
export const RISKY_EXCHANGE_COMBINED_BOARD = combineBoardsVertically(
    RISKY_EXCHANGE_DOCKING_BAY,
    EXCHANGE_FACTORY_FLOOR
);

// Ensure the combined board has a proper ID
RISKY_EXCHANGE_COMBINED_BOARD.id = 'risky-exchange-combined';
RISKY_EXCHANGE_COMBINED_BOARD.name = 'Risky Exchange Combined';

// All official board definitions
export const OFFICIAL_BOARD_DEFINITIONS: BoardDefinition[] = [
    EXCHANGE_FACTORY_FLOOR,
    RISKY_EXCHANGE_DOCKING_BAY,
    RISKY_EXCHANGE_COMBINED_BOARD
];

// =============================================================================
// COURSE DEFINITIONS
// =============================================================================

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

// All official course definitions
export const OFFICIAL_COURSE_DEFINITIONS: CourseDefinition[] = [
    OFFICIAL_RISKY_EXCHANGE
];