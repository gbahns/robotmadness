// lib/game/boards/crossBoard.ts
// Cross Board Definition from official RoboRally - CORRECTED v2

import { BoardDefinition } from '../types';
import { Direction, TileType } from '../types';

export const CROSS_BOARD: BoardDefinition = {
    id: 'cross',
    name: 'Cross',
    width: 12,
    height: 12,

    startingPositions: [],

    tiles: [
        // Row 0 - carefully looking at each tile
        { position: { x: 1, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 0 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 0 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 0 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Row 1
        { position: { x: 1, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'counterclockwise' },
        { position: { x: 2, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'clockwise' },
        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 1 }, type: TileType.PIT },
        { position: { x: 10, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'clockwise' },
        { position: { x: 11, y: 1 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 2
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 2 }, type: TileType.REPAIR },

        // Row 3
        { position: { x: 2, y: 3 }, type: TileType.PIT },
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Row 4
        { position: { x: 1, y: 4 }, type: TileType.REPAIR },
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'counterclockwise' },
        { position: { x: 7, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'counterclockwise' },

        // Row 5
        { position: { x: 0, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 1, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'clockwise' },
        { position: { x: 6, y: 5 }, type: TileType.PIT },
        { position: { x: 7, y: 5 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'clockwise' },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 11, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 6
        { position: { x: 0, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'counterclockwise' },
        { position: { x: 5, y: 6 }, type: TileType.PIT },
        { position: { x: 6, y: 6 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'counterclockwise' },
        { position: { x: 7, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Row 7
        { position: { x: 4, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'clockwise' },
        { position: { x: 5, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'counterclockwise' },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 7, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP, rotate: 'counterclockwise' },
        { position: { x: 9, y: 7 }, type: TileType.PIT },

        // Row 8
        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 8 }, type: TileType.REPAIR },

        // Row 9
        { position: { x: 2, y: 9 }, type: TileType.PIT },
        { position: { x: 5, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 7, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Row 10
        { position: { x: 0, y: 10 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 10 }, type: TileType.CONVEYOR, direction: Direction.RIGHT, rotate: 'counterclockwise' },
        { position: { x: 2, y: 10 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 10 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 10 }, type: TileType.CONVEYOR, direction: Direction.DOWN, rotate: 'counterclockwise' },
        { position: { x: 7, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'counterclockwise' },
        { position: { x: 8, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 11, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT, rotate: 'clockwise' },

        // Row 11
        { position: { x: 0, y: 11 }, type: TileType.REPAIR },
        { position: { x: 2, y: 11 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 11 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 11 }, type: TileType.CONVEYOR, direction: Direction.UP },
    ],

    walls: [
        // Row 0 walls
        { position: { x: 3, y: 0 }, sides: [Direction.UP] },
        { position: { x: 8, y: 0 }, sides: [Direction.UP] },

        // Row 1 walls
        { position: { x: 0, y: 1 }, sides: [Direction.LEFT] },
        { position: { x: 8, y: 1 }, sides: [Direction.RIGHT] },

        // Row 3 walls
        { position: { x: 0, y: 3 }, sides: [Direction.LEFT] },
        { position: { x: 7, y: 3 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 3 }, sides: [Direction.RIGHT] },

        // Row 5 walls
        { position: { x: 5, y: 5 }, sides: [Direction.DOWN] },

        // Row 6 walls  
        { position: { x: 6, y: 6 }, sides: [Direction.UP] },
        { position: { x: 11, y: 6 }, sides: [Direction.RIGHT] },

        // Row 8 walls
        { position: { x: 0, y: 8 }, sides: [Direction.LEFT] },
        { position: { x: 3, y: 8 }, sides: [Direction.DOWN] },
        { position: { x: 4, y: 8 }, sides: [Direction.DOWN] },
        { position: { x: 11, y: 8 }, sides: [Direction.RIGHT] },

        // Row 9 walls
        { position: { x: 3, y: 9 }, sides: [Direction.UP] },
        { position: { x: 4, y: 9 }, sides: [Direction.UP] },
        { position: { x: 8, y: 9 }, sides: [Direction.DOWN] },

        // Row 10 walls
        { position: { x: 8, y: 10 }, sides: [Direction.UP] },

        // Row 11 walls
        { position: { x: 1, y: 11 }, sides: [Direction.LEFT] },
        { position: { x: 3, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 4, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 8, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 9, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 10, y: 11 }, sides: [Direction.DOWN] },
    ],

    lasers: [
        // Horizontal lasers on row 3
        { position: { x: 0, y: 3 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 3 }, direction: Direction.LEFT, damage: 1 },

        // Vertical lasers from row 8
        { position: { x: 3, y: 8 }, direction: Direction.UP, damage: 1 },
        { position: { x: 4, y: 8 }, direction: Direction.UP, damage: 1 },

        // Vertical laser from row 10
        { position: { x: 8, y: 10 }, direction: Direction.DOWN, damage: 1 },
    ]
};