// dockingBayBoards.js
// Docking Bay boards (4x12 or 6x12) that contain starting positions
// These are meant to be combined with Factory Floor boards (12x12)

// Import Direction and TileType - with fallbacks
let Direction, TileType;
try {
    const defs = require('./boardDefinitions.js');
    Direction = defs.Direction;
    TileType = defs.TileType;
} catch (e) {
    console.warn('Could not import from boardDefinitions.js, using fallback values');
}

// Direction constants (fallback if import fails)
const UP = Direction?.UP ?? 0;
const RIGHT = Direction?.RIGHT ?? 1;
const DOWN = Direction?.DOWN ?? 2;
const LEFT = Direction?.LEFT ?? 3;

// TileType constants (fallback if import fails)
const CONVEYOR = TileType?.CONVEYOR ?? 'conveyor';

// Standard 4x12 Docking Bay with 4 starting positions
const DOCKING_BAY_4P = {
    id: 'docking-bay-4p',
    name: 'Docking Bay (4 Players)',
    width: 12,
    height: 4,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        { position: { x: 1, y: 0 }, direction: UP },
        { position: { x: 4, y: 0 }, direction: UP },
        { position: { x: 7, y: 0 }, direction: UP },
        { position: { x: 10, y: 0 }, direction: UP }
    ],
    tiles: [
        // Simple conveyors leading out of the docking bay
        { position: { x: 1, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 4, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 7, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 10, y: 1 }, type: CONVEYOR, direction: UP }
    ],
    lasers: [],
    walls: []
};

// Extended 6x12 Docking Bay with 8 starting positions
const DOCKING_BAY_8P = {
    id: 'docking-bay-8p',
    name: 'Docking Bay (8 Players)',
    width: 12,
    height: 6,
    checkpoints: [], // No checkpoints on docking bays
    startingPositions: [
        // Front row
        { position: { x: 1, y: 0 }, direction: UP },
        { position: { x: 3, y: 0 }, direction: UP },
        { position: { x: 5, y: 0 }, direction: UP },
        { position: { x: 7, y: 0 }, direction: UP },
        { position: { x: 9, y: 0 }, direction: UP },
        { position: { x: 11, y: 0 }, direction: UP },
        // Back row
        { position: { x: 2, y: 1 }, direction: UP },
        { position: { x: 10, y: 1 }, direction: UP }
    ],
    tiles: [
        // Conveyors from front row
        { position: { x: 1, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 3, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 5, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 7, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 9, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 11, y: 2 }, type: CONVEYOR, direction: UP },
        // Conveyors from back row positions
        { position: { x: 2, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 10, y: 2 }, type: CONVEYOR, direction: UP },
        // Additional conveyors to merge
        { position: { x: 1, y: 3 }, type: CONVEYOR, direction: UP },
        { position: { x: 3, y: 3 }, type: CONVEYOR, direction: UP },
        { position: { x: 5, y: 3 }, type: CONVEYOR, direction: UP },
        { position: { x: 7, y: 3 }, type: CONVEYOR, direction: UP },
        { position: { x: 9, y: 3 }, type: CONVEYOR, direction: UP },
        { position: { x: 11, y: 3 }, type: CONVEYOR, direction: UP }
    ],
    lasers: [],
    walls: []
};

// Alternative 6x12 Docking Bay with different starting arrangement
const DOCKING_BAY_WIDE = {
    id: 'docking-bay-wide',
    name: 'Wide Docking Bay',
    width: 12,
    height: 6,
    checkpoints: [],
    startingPositions: [
        // Spread across the width
        { position: { x: 0, y: 2 }, direction: RIGHT },
        { position: { x: 0, y: 4 }, direction: RIGHT },
        { position: { x: 11, y: 2 }, direction: LEFT },
        { position: { x: 11, y: 4 }, direction: LEFT },
        { position: { x: 3, y: 0 }, direction: UP },
        { position: { x: 5, y: 0 }, direction: UP },
        { position: { x: 6, y: 0 }, direction: UP },
        { position: { x: 8, y: 0 }, direction: UP }
    ],
    tiles: [
        // Side conveyors
        { position: { x: 1, y: 2 }, type: CONVEYOR, direction: RIGHT },
        { position: { x: 1, y: 4 }, type: CONVEYOR, direction: RIGHT },
        { position: { x: 10, y: 2 }, type: CONVEYOR, direction: LEFT },
        { position: { x: 10, y: 4 }, type: CONVEYOR, direction: LEFT },
        // Bottom conveyors
        { position: { x: 3, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 5, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 6, y: 1 }, type: CONVEYOR, direction: UP },
        { position: { x: 8, y: 1 }, type: CONVEYOR, direction: UP }
    ],
    lasers: [],
    walls: []
};

// Compact 4x12 Docking Bay similar to the image
const DOCKING_BAY_COMPACT = {
    id: 'docking-bay-compact',
    name: 'Compact Docking Bay',
    width: 12,
    height: 4,
    checkpoints: [],
    startingPositions: [
        // Numbered positions 1-8 (only using first 4 for 4x12)
        { position: { x: 2, y: 1 }, direction: UP },  // 1
        { position: { x: 3, y: 1 }, direction: UP },  // 2
        { position: { x: 4, y: 1 }, direction: UP },  // 3
        { position: { x: 5, y: 1 }, direction: UP },  // 4
        { position: { x: 6, y: 1 }, direction: UP },  // 5
        { position: { x: 7, y: 1 }, direction: UP },  // 6
        { position: { x: 8, y: 1 }, direction: UP },  // 7
        { position: { x: 9, y: 1 }, direction: UP }   // 8
    ],
    tiles: [
        // Conveyor belt system like in the image
        { position: { x: 1, y: 2 }, type: CONVEYOR, direction: RIGHT },
        { position: { x: 2, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 3, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 4, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 5, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 6, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 7, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 8, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 9, y: 2 }, type: CONVEYOR, direction: UP },
        { position: { x: 10, y: 2 }, type: CONVEYOR, direction: LEFT }
    ],
    lasers: [],
    walls: [
        // Side walls to contain the docking area
        { position: { x: 0, y: 1 }, sides: [RIGHT] },
        { position: { x: 11, y: 1 }, sides: [LEFT] }
    ]
};

// Export all docking bay boards
const DOCKING_BAY_BOARDS = [
    DOCKING_BAY_4P,
    DOCKING_BAY_8P,
    DOCKING_BAY_WIDE,
    DOCKING_BAY_COMPACT
];

// Helper function to combine a docking bay with a factory floor board
function combineBoardsVertically(dockingBay, factoryFloor) {
    // This would combine the docking bay at the bottom with the factory floor above
    // For now, we'll use the factory floor's configuration with the docking bay's starting positions
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

module.exports = {
    DOCKING_BAY_4P,
    DOCKING_BAY_8P,
    DOCKING_BAY_WIDE,
    DOCKING_BAY_COMPACT,
    DOCKING_BAY_BOARDS,
    combineBoardsVertically
};