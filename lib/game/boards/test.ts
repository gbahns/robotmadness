import { BoardDefinition, Direction } from '../types';

// Test board for development
export const TEST_BOARD: BoardDefinition = {
    id: 'test',
    name: 'Test Board',
    width: 12,
    height: 12,
    startingPositions: [
        { number: 1, position: { x: 1, y: 1 }, direction: Direction.UP },
        { number: 2, position: { x: 10, y: 1 }, direction: Direction.UP },
        { number: 3, position: { x: 10, y: 10 }, direction: Direction.DOWN },
        { number: 4, position: { x: 1, y: 10 }, direction: Direction.DOWN },
        { number: 5, position: { x: 5, y: 5 }, direction: Direction.RIGHT },
        { number: 6, position: { x: 6, y: 6 }, direction: Direction.LEFT },
        { number: 7, position: { x: 3, y: 3 }, direction: Direction.DOWN },
        { number: 8, position: { x: 8, y: 8 }, direction: Direction.UP }
    ],
    tiles: []
};