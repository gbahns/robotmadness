import { CourseDefinition, BoardDefinition } from './boardDefinitions';
import { Direction, TileType } from '../types';

export const DOCKING_BAY_4P: BoardDefinition = {
    id: 'docking-bay-4p',
    name: 'Docking Bay (4 Players)',
    width: 12,
    height: 4,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        { position: { x: 1, y: 0 }, direction: Direction.UP },
        { position: { x: 4, y: 0 }, direction: Direction.UP },
        { position: { x: 7, y: 0 }, direction: Direction.UP },
        { position: { x: 10, y: 0 }, direction: Direction.UP }
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
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        // Front row
        { position: { x: 1, y: 0 }, direction: Direction.UP },
        { position: { x: 3, y: 0 }, direction: Direction.UP },
        { position: { x: 5, y: 0 }, direction: Direction.UP },
        { position: { x: 7, y: 0 }, direction: Direction.UP },
        { position: { x: 9, y: 0 }, direction: Direction.UP },
        { position: { x: 11, y: 0 }, direction: Direction.UP },
        // Back row
        { position: { x: 2, y: 1 }, direction: Direction.UP },
        { position: { x: 10, y: 1 }, direction: Direction.UP }
    ],
    tiles: [
        // Conveyors from front row
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        // Conveyors from back row positions
        { position: { x: 2, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        // Additional conveyors to merge
        { position: { x: 1, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 3, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 9, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 11, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

export const DOCKING_BAY_WIDE: BoardDefinition = {
    id: 'docking-bay-wide',
    name: 'Wide Docking Bay',
    width: 12,
    height: 6,
    checkpoints: [],
    startingPositions: [
        // Spread across the width
        { position: { x: 0, y: 2 }, direction: Direction.RIGHT },
        { position: { x: 0, y: 4 }, direction: Direction.RIGHT },
        { position: { x: 11, y: 2 }, direction: Direction.LEFT },
        { position: { x: 11, y: 4 }, direction: Direction.LEFT },
        { position: { x: 3, y: 0 }, direction: Direction.UP },
        { position: { x: 5, y: 0 }, direction: Direction.UP },
        { position: { x: 6, y: 0 }, direction: Direction.UP },
        { position: { x: 8, y: 0 }, direction: Direction.UP }
    ],
    tiles: [
        // Side conveyors
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 1, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        // Bottom conveyors
        { position: { x: 3, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP }
    ],
    lasers: [],
    walls: []
};

export const DOCKING_BAY_COMPACT: BoardDefinition = {
    id: 'docking-bay-compact',
    name: 'Compact Docking Bay',
    width: 12,
    height: 4,
    checkpoints: [],
    startingPositions: [
        // Numbered positions 1-8 (only using first 4 for 4x12)
        { position: { x: 2, y: 1 }, direction: Direction.UP },  // 1
        { position: { x: 3, y: 1 }, direction: Direction.UP },  // 2
        { position: { x: 4, y: 1 }, direction: Direction.UP },  // 3
        { position: { x: 5, y: 1 }, direction: Direction.UP },  // 4
        { position: { x: 6, y: 1 }, direction: Direction.UP },  // 5
        { position: { x: 7, y: 1 }, direction: Direction.UP },  // 6
        { position: { x: 8, y: 1 }, direction: Direction.UP },  // 7
        { position: { x: 9, y: 1 }, direction: Direction.UP }   // 8
    ],
    tiles: [
        // Conveyor belt system like in the image
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

export const DOCKING_BAY_BOARDS: BoardDefinition[] = [
    DOCKING_BAY_4P,
    DOCKING_BAY_8P,
    DOCKING_BAY_WIDE,
    DOCKING_BAY_COMPACT
];

export function combineBoardsVertically(dockingBay: BoardDefinition, factoryFloor: BoardDefinition): BoardDefinition {
    return {
        ...factoryFloor,
        id: `${factoryFloor.id}-with-${dockingBay.id}`,
        name: `${factoryFloor.name} with ${dockingBay.name}`,
        height: factoryFloor.height + dockingBay.height,
        startingPositions: dockingBay.startingPositions.map(sp => ({
            ...sp,
            position: {
                ...sp.position,
                y: sp.position.y + factoryFloor.height // Offset by factory floor height
            }
        }))
        // TODO: Merge tiles, lasers, walls with proper y-offset
    };
}