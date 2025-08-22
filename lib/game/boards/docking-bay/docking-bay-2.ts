import { BoardDefinition } from '../../types';
import { Direction, TileType } from '../../types';

export const DOCKING_BAY_2: BoardDefinition = {
    id: 'docking-bay-2',
    name: 'Docking Bay 2',
    width: 12,
    height: 4,

    startingPositions: [
        { number: 1, position: { x: 5, y: 2 }, direction: Direction.UP },
        { number: 2, position: { x: 6, y: 2 }, direction: Direction.UP },
        { number: 3, position: { x: 3, y: 2 }, direction: Direction.UP },
        { number: 4, position: { x: 8, y: 2 }, direction: Direction.UP },
        { number: 5, position: { x: 1, y: 2 }, direction: Direction.UP },
        { number: 6, position: { x: 10, y: 2 }, direction: Direction.UP },
        { number: 7, position: { x: 0, y: 2 }, direction: Direction.UP },
        { number: 8, position: { x: 11, y: 2 }, direction: Direction.UP },
    ],


    walls: [
        { position: { x: 1, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 2, y: 3 }, sides: [Direction.DOWN] },
        { position: { x: 4, y: 3 }, sides: [Direction.DOWN] },
        { position: { x: 11, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 7, y: 3 }, sides: [Direction.DOWN] },
        { position: { x: 9, y: 3 }, sides: [Direction.DOWN] },
        { position: { x: 9, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 7, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 6, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 5, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 3, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 2, y: 0 }, sides: [Direction.UP] },
        { position: { x: 4, y: 0 }, sides: [Direction.UP] },
        { position: { x: 7, y: 0 }, sides: [Direction.UP] },
        { position: { x: 9, y: 0 }, sides: [Direction.UP] },
    ],
};