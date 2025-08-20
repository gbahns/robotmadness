import { BoardDefinition } from '../types';
import { Direction, TileType } from '../types';

export const EXCHANGE_FACTORY_FLOOR: BoardDefinition = {
    id: 'exchange-factory-floor',
    name: 'Exchange Factory Floor',
    width: 12,
    height: 12,

    // Starting positions are typically in docking bay (not on this board)
    startingPositions: [],

    tiles: [
        // Row 0 - confirmed tiles only
        { position: { x: 0, y: 0 }, type: TileType.REPAIR },
        { position: { x: 3, y: 0 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 0 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 0 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Row 1
        { position: { x: 0, y: 1 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 1 }, type: TileType.PIT },
        { position: { x: 3, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 1 }, type: TileType.GEAR_CW },
        { position: { x: 11, y: 1 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 2
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        // Row 3
        { position: { x: 0, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 3 }, type: TileType.GEAR_CCW },
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },

        // Row 4
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Row 5
        { position: { x: 0, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 1, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 11, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 6
        { position: { x: 1, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 11, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },

        // Row 7
        { position: { x: 5, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 7 }, type: TileType.OPTION },

        // Row 8
        { position: { x: 0, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 1, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 5, y: 8 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 9, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 11, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 9 - verified and corrected
        { position: { x: 3, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        // Row 10
        { position: { x: 0, y: 10 }, type: TileType.PIT },
        { position: { x: 3, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 10 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 10 }, type: TileType.GEAR_CW },
        { position: { x: 11, y: 10 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Row 11
        { position: { x: 3, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 11 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 8, y: 11 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 11 }, type: TileType.REPAIR },
    ],

    walls: [
        { position: { x: 0, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 2, y: 0 }, sides: [Direction.UP] },
        { position: { x: 4, y: 0 }, sides: [Direction.UP] },
        { position: { x: 7, y: 0 }, sides: [Direction.UP] },
        { position: { x: 9, y: 0 }, sides: [Direction.UP] },
        { position: { x: 9, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 11, y: 2 }, sides: [Direction.RIGHT] },
        { position: { x: 4, y: 4 }, sides: [Direction.DOWN, Direction.RIGHT] },
        { position: { x: 7, y: 4 }, sides: [Direction.LEFT, Direction.DOWN] },
        { position: { x: 11, y: 4 }, sides: [Direction.RIGHT] },
        { position: { x: 0, y: 7 }, sides: [Direction.LEFT] },
        { position: { x: 4, y: 7 }, sides: [Direction.UP, Direction.RIGHT] },
        { position: { x: 7, y: 7 }, sides: [Direction.UP, Direction.LEFT] },
        { position: { x: 11, y: 7 }, sides: [Direction.RIGHT] },
        { position: { x: 0, y: 9 }, sides: [Direction.LEFT] },
        { position: { x: 10, y: 9 }, sides: [Direction.UP] },
        { position: { x: 11, y: 9 }, sides: [Direction.RIGHT] },
        { position: { x: 1, y: 10 }, sides: [Direction.DOWN] },
        { position: { x: 2, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 4, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 7, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 9, y: 11 }, sides: [Direction.DOWN] },
    ],

    lasers: [
        { position: { x: 11, y: 2 }, direction: Direction.LEFT, damage: 1 },
    ]
};


// ACCURATE EXCHANGE FACTORY FLOOR BOARD from official rulebook
export const EXCHANGE_FACTORY_FLOOR_TEST: BoardDefinition = {
    id: 'exchange-factory-floor-test',
    name: 'Exchange Factory Floor Test',
    width: 12,
    height: 12,
    startingPositions: [], // Will be provided by docking bay
    tiles: [
        // MAIN EXPRESS CONVEYOR SYSTEM - Yellow/orange conveyors from the image

        // Top-left corner: 2 rows x 4 columns of rotating conveyors
        // First row: clockwise rotating conveyors in a circle
        { position: { x: 0, y: 0 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'clockwise' },
        { position: { x: 1, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'clockwise' },
        { position: { x: 1, y: 1 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'clockwise' },
        { position: { x: 0, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'clockwise' },

        // Second row: counterclockwise rotating express conveyors in a circle
        { position: { x: 2, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'counterclockwise' },
        { position: { x: 3, y: 0 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'counterclockwise' },
        { position: { x: 3, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'counterclockwise' },
        { position: { x: 2, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'counterclockwise' },

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
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'clockwise' },
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

// All official board definitions
export const OFFICIAL_BOARD_DEFINITIONS: BoardDefinition[] = [
    EXCHANGE_FACTORY_FLOOR,
];
