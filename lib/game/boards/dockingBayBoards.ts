import { BoardDefinition, TileElement, LaserElement, WallElement } from '../types';
import { Direction, TileType } from '../types';

export const RISKY_EXCHANGE_DOCKING_BAY: BoardDefinition = {
    id: 'risky-exchange-docking-bay',
    name: 'Risky Exchange Docking Bay',
    width: 12,
    height: 4,
    startingPositions: [
        // Reading from the board image with (0,0) at upper left
        { number: 1, position: { x: 5, y: 2 }, direction: Direction.UP },  // Position 1
        { number: 2, position: { x: 6, y: 2 }, direction: Direction.UP },  // Position 2
        { number: 3, position: { x: 3, y: 2 }, direction: Direction.UP },  // Position 3
        { number: 4, position: { x: 8, y: 2 }, direction: Direction.UP },  // Position 4
        { number: 5, position: { x: 1, y: 1 }, direction: Direction.UP },  // Position 5
        { number: 6, position: { x: 10, y: 1 }, direction: Direction.UP }, // Position 6
        { number: 7, position: { x: 0, y: 0 }, direction: Direction.UP },  // Position 7
        { number: 8, position: { x: 11, y: 0 }, direction: Direction.UP }  // Position 8
    ],
    tiles: [
        // Row 2 (y=2) - Main conveyor belt system
        { position: { x: 0, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 2, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        // Starting position 4 at x:8

        // Row 3 (y=3) - Bottom row conveyors
        // { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        // { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        // { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        // { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        // { position: { x: 9, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: [
        // top row walls
        { position: { x: 2, y: 0 }, sides: [Direction.UP] },
        { position: { x: 4, y: 0 }, sides: [Direction.UP, Direction.LEFT] },
        { position: { x: 7, y: 0 }, sides: [Direction.UP, Direction.RIGHT] },
        { position: { x: 9, y: 0 }, sides: [Direction.UP] },

        //second row walls - around starting positions 5 and 6
        { position: { x: 0, y: 1 }, sides: [Direction.RIGHT] },
        { position: { x: 2, y: 1 }, sides: [Direction.LEFT] },
        { position: { x: 9, y: 1 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 1 }, sides: [Direction.LEFT] },

        // third and fourth row walls

        // Walls creating the conveyor path boundaries
        { position: { x: 5, y: 2 }, sides: [Direction.RIGHT] },
        { position: { x: 5, y: 3 }, sides: [Direction.RIGHT] },
    ]
};


// INACCURATE DOCKING BAY for Risky Exchange (8 starting positions)
export const RISKY_EXCHANGE_DOCKING_BAY_INACCURATE: BoardDefinition = {
    id: 'risky-exchange-docking-bay',
    name: 'Risky Exchange Docking Bay',
    width: 12,
    height: 4,
    startingPositions: [
        // Starting positions 1-8 as shown in the official image
        { number: 1, position: { x: 3, y: 1 }, direction: Direction.UP },  // Position 1
        { number: 1, position: { x: 1, y: 1 }, direction: Direction.UP },  // Position 2  
        { number: 1, position: { x: 5, y: 1 }, direction: Direction.UP },  // Position 3
        { number: 1, position: { x: 7, y: 1 }, direction: Direction.UP },  // Position 4
        { number: 1, position: { x: 9, y: 1 }, direction: Direction.UP },  // Position 5
        { number: 1, position: { x: 11, y: 1 }, direction: Direction.UP }, // Position 6
        { number: 1, position: { x: 0, y: 1 }, direction: Direction.UP },  // Position 7
        { number: 1, position: { x: 10, y: 1 }, direction: Direction.UP }  // Position 8
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

export const DOCKING_BAY_4P: BoardDefinition = {
    id: 'docking-bay-4p',
    name: 'Docking Bay (4 Players)',
    width: 12,
    height: 4,
    startingPositions: [
        { number: 1, position: { x: 1, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 4, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 7, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 10, y: 0 }, direction: Direction.UP }
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
    startingPositions: [
        // Front row
        { number: 1, position: { x: 1, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 3, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 5, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 7, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 9, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 11, y: 0 }, direction: Direction.UP },
        // Back row
        { number: 1, position: { x: 2, y: 1 }, direction: Direction.UP },
        { number: 1, position: { x: 10, y: 1 }, direction: Direction.UP }
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
    startingPositions: [
        { number: 1, position: { x: 0, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 2, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 4, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 6, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 8, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 10, y: 0 }, direction: Direction.UP }
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
    startingPositions: [
        { number: 1, position: { x: 2, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 4, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 6, y: 0 }, direction: Direction.UP },
        { number: 1, position: { x: 8, y: 0 }, direction: Direction.UP }
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
    DOCKING_BAY_COMPACT,
    RISKY_EXCHANGE_DOCKING_BAY
];


// Example factory floor boards for combination
export const SIMPLE_FACTORY_FLOOR: BoardDefinition = {
    id: 'simple-factory',
    name: 'Simple Factory Floor',
    width: 12,
    height: 8,
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
