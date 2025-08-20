// lib/game/boards/chessBoard.ts
// Chess Board Definition from official RoboRally

import { BoardDefinition } from '../types';
import { Direction, TileType } from '../types';

export const CHESS_BOARD: BoardDefinition = {
    id: 'chess',
    name: 'Chess',
    width: 12,
    height: 12,

    startingPositions: [],

    tiles: [
        // Row 0 - Empty now (express conveyors moved down)

        // Row 1 - Express conveyors moved here from row 0 and column 0
        { position: { x: 1, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT, rotate: 'clockwise' },
        { position: { x: 2, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 1 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN, rotate: 'clockwise' },

        // Row 2 - Interior conveyors with left express conveyor
        { position: { x: 1, y: 2 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 3 - More interior with pits
        { position: { x: 1, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 2, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 3 }, type: TileType.PIT },
        { position: { x: 4, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 4 - Central area with repair sites
        { position: { x: 1, y: 4 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 4 }, type: TileType.REPAIR },
        { position: { x: 7, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 5 - Central row with repair and pit
        { position: { x: 1, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 2, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 5 }, type: TileType.PIT },
        { position: { x: 6, y: 5 }, type: TileType.REPAIR },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 6 - More central conveyors
        { position: { x: 1, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 7 - Lower section with pit
        { position: { x: 1, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 2, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 7 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 7 }, type: TileType.PIT },

        // Row 8 - Lower interior
        { position: { x: 1, y: 8 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 9 - Near bottom
        { position: { x: 1, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
        { position: { x: 2, y: 9 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 9 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 9 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 9 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Row 10 - Bottom express conveyor moved here from row 11
        { position: { x: 1, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP, rotate: 'clockwise' },
        { position: { x: 2, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 10 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT, rotate: 'clockwise' },

        // Right side express conveyors - DOWN from upper right to lower right
        { position: { x: 10, y: 2 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 3 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 4 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 8 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
    ],

    walls: [
        // Perimeter walls for express conveyor containment
        { position: { x: 0, y: 0 }, sides: [Direction.UP, Direction.LEFT] },
        { position: { x: 1, y: 0 }, sides: [Direction.UP] },
        { position: { x: 2, y: 0 }, sides: [Direction.UP] },
        { position: { x: 3, y: 0 }, sides: [Direction.UP] },
        { position: { x: 4, y: 0 }, sides: [Direction.UP] },
        { position: { x: 5, y: 0 }, sides: [Direction.UP] },
        { position: { x: 6, y: 0 }, sides: [Direction.UP] },
        { position: { x: 7, y: 0 }, sides: [Direction.UP] },
        { position: { x: 8, y: 0 }, sides: [Direction.UP] },
        { position: { x: 9, y: 0 }, sides: [Direction.UP] },
        { position: { x: 10, y: 0 }, sides: [Direction.UP] },
        { position: { x: 11, y: 0 }, sides: [Direction.UP, Direction.RIGHT] },

        // Right side walls
        { position: { x: 11, y: 1 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 2 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 3 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 4 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 5 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 6 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 7 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 8 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 9 }, sides: [Direction.RIGHT] },
        { position: { x: 11, y: 10 }, sides: [Direction.RIGHT] },

        // Bottom walls
        { position: { x: 11, y: 11 }, sides: [Direction.DOWN, Direction.RIGHT] },
        { position: { x: 10, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 9, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 8, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 7, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 6, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 5, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 4, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 3, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 2, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 1, y: 11 }, sides: [Direction.DOWN] },
        { position: { x: 0, y: 11 }, sides: [Direction.DOWN, Direction.LEFT] },

        // Left side walls
        { position: { x: 0, y: 10 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 9 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 8 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 7 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 6 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 5 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 4 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 3 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 0, y: 1 }, sides: [Direction.LEFT] },

        // Interior separating walls between express and regular conveyors
        { position: { x: 1, y: 1 }, sides: [Direction.UP, Direction.DOWN] },
        { position: { x: 1, y: 9 }, sides: [Direction.UP, Direction.DOWN] },
        { position: { x: 9, y: 1 }, sides: [Direction.UP, Direction.DOWN] },
        { position: { x: 9, y: 9 }, sides: [Direction.UP, Direction.DOWN] },
    ],

    lasers: [
        // No visible lasers on this board
    ]
};