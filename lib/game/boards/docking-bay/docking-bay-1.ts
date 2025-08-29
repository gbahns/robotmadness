import { BoardDefinition } from '../../types';
import { Direction, TileType } from '../../types';

export const DOCKING_BAY_1: BoardDefinition = {
    id: 'docking-bay-1',
    name: 'Docking Bay 1',
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
        // entering from left, curving down and right
        { position: { x: 0, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 2 }, entries: [Direction.LEFT], type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 2, y: 3 }, entries: [Direction.UP], type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // entering from right, curving down and left
        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 2 }, entries: [Direction.RIGHT], type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 9, y: 3 }, entries: [Direction.UP], type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
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