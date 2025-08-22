import { BoardDefinition, Direction, TileType } from '../types';

// Island Hop board (single 12x12 board with starting positions)
export const ISLAND_HOP_BOARD: BoardDefinition = {
    id: 'island-hop-board',
    name: 'Island Hop',
    width: 12,
    height: 12,
    startingPositions: [],
    tiles: [
        // Central "island" of pits
        { position: { x: 5, y: 5 }, type: TileType.PIT },
        { position: { x: 6, y: 5 }, type: TileType.PIT },
        { position: { x: 7, y: 5 }, type: TileType.PIT },
        { position: { x: 5, y: 6 }, type: TileType.PIT },
        { position: { x: 6, y: 6 }, type: TileType.PIT },
        { position: { x: 7, y: 6 }, type: TileType.PIT },
        { position: { x: 5, y: 7 }, type: TileType.PIT },
        { position: { x: 6, y: 7 }, type: TileType.PIT },
        { position: { x: 7, y: 7 }, type: TileType.PIT },

        // Conveyors around the island
        { position: { x: 4, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 4, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 8, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Repair sites at strategic locations
        { position: { x: 1, y: 6 }, type: TileType.REPAIR },
        { position: { x: 11, y: 6 }, type: TileType.REPAIR },
        { position: { x: 6, y: 1 }, type: TileType.REPAIR },
        { position: { x: 6, y: 11 }, type: TileType.REPAIR }
    ],
    lasers: [
        // Lasers across the island gaps
        { position: { x: 0, y: 6 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT, damage: 1 },
        { position: { x: 6, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 6, y: 11 }, direction: Direction.UP, damage: 1 }
    ]
};