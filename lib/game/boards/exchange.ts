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