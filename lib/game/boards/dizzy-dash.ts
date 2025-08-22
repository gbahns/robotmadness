import { BoardDefinition, Direction, TileType } from '../types';

// Dizzy Dash board (single 12x12 board with starting positions)
export const DIZZY_DASH_BOARD: BoardDefinition = {
    id: 'dizzy-dash-board',
    name: 'Dizzy Dash',
    width: 12,
    height: 12,
    startingPositions: [],
    tiles: [
        // Multiple gear clusters for confusion
        { position: { x: 2, y: 2 }, type: TileType.GEAR_CW },
        { position: { x: 3, y: 2 }, type: TileType.GEAR_CCW },
        { position: { x: 2, y: 3 }, type: TileType.GEAR_CCW },
        { position: { x: 3, y: 3 }, type: TileType.GEAR_CW },

        { position: { x: 8, y: 2 }, type: TileType.GEAR_CCW },
        { position: { x: 9, y: 2 }, type: TileType.GEAR_CW },
        { position: { x: 8, y: 3 }, type: TileType.GEAR_CW },
        { position: { x: 10, y: 3 }, type: TileType.GEAR_CCW },

        { position: { x: 2, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 3, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 2, y: 9 }, type: TileType.GEAR_CCW },
        { position: { x: 3, y: 9 }, type: TileType.GEAR_CW },

        { position: { x: 8, y: 8 }, type: TileType.GEAR_CCW },
        { position: { x: 9, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 8, y: 9 }, type: TileType.GEAR_CW },
        { position: { x: 9, y: 10 }, type: TileType.GEAR_CCW },

        // Some conveyors for navigation
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 3 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Repair site in center
        { position: { x: 5, y: 6 }, type: TileType.REPAIR }
    ],
    lasers: []
};