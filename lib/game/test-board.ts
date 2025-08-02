// File: lib/game/test-board.ts

import { Board, TileType, Direction } from './types';

export const TEST_BOARD: Board = {
    width: 12,
    height: 12,
    tiles: Array(12).fill(null).map(() =>
        Array(12).fill(null).map(() => ({
            type: TileType.EMPTY,
            walls: []
        }))
    ),
    checkpoints: [
        { position: { x: 6, y: 9 }, number: 1 },
        { position: { x: 9, y: 5 }, number: 2 },
        { position: { x: 3, y: 2 }, number: 3 }
    ],
    startingPositions: [
        { position: { x: 1, y: 11 }, direction: Direction.UP },
        { position: { x: 3, y: 11 }, direction: Direction.UP },
        { position: { x: 5, y: 11 }, direction: Direction.UP },
        { position: { x: 7, y: 11 }, direction: Direction.UP },
        { position: { x: 9, y: 11 }, direction: Direction.UP },
        { position: { x: 11, y: 11 }, direction: Direction.UP }
    ]
};