// lib/game/board-templates.ts
// Pre-made board templates for the board editor

import { BoardDefinition, TileType, Direction } from './types';

export const TEMPLATE_EMPTY_12X12: BoardDefinition = {
    id: 'empty-12x12',
    name: 'Empty 12×12 Board',
    width: 12,
    height: 12,
    tiles: [],
    lasers: [],
    walls: [],
    startingPositions: [
        { number: 1, position: { x: 0, y: 5 }, direction: Direction.RIGHT },
        { number: 2, position: { x: 0, y: 6 }, direction: Direction.RIGHT },
        { number: 3, position: { x: 11, y: 5 }, direction: Direction.LEFT },
        { number: 4, position: { x: 11, y: 6 }, direction: Direction.LEFT },
        { number: 5, position: { x: 5, y: 0 }, direction: Direction.DOWN },
        { number: 6, position: { x: 6, y: 0 }, direction: Direction.DOWN },
        { number: 7, position: { x: 5, y: 11 }, direction: Direction.UP },
        { number: 8, position: { x: 6, y: 11 }, direction: Direction.UP },
    ]
};

export const TEMPLATE_SIMPLE_RACE: BoardDefinition = {
    id: 'simple-race',
    name: 'Simple Race Track',
    width: 12,
    height: 12,
    tiles: [
        // Outer conveyor track going clockwise
        // Top edge
        { position: { x: 2, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 5, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 1 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Right edge
        { position: { x: 10, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 5 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 6 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 8 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 10, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        // Bottom edge
        { position: { x: 9, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 6, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 10 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        // Left edge
        { position: { x: 1, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 6 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 5 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 4 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 1, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Center hazards
        { position: { x: 5, y: 5 }, type: TileType.PIT },
        { position: { x: 6, y: 6 }, type: TileType.PIT },

        // Repair sites
        { position: { x: 3, y: 3 }, type: TileType.REPAIR },
        { position: { x: 8, y: 8 }, type: TileType.REPAIR },

        // Gears for chaos
        { position: { x: 4, y: 7 }, type: TileType.GEAR_CW },
        { position: { x: 7, y: 4 }, type: TileType.GEAR_CCW },
    ],
    lasers: [
        { position: { x: 0, y: 5 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT, damage: 1 },
    ],
    walls: [],
    startingPositions: [
        { number: 1, position: { x: 0, y: 0 }, direction: Direction.RIGHT },
        { number: 2, position: { x: 1, y: 0 }, direction: Direction.RIGHT },
        { number: 3, position: { x: 2, y: 0 }, direction: Direction.RIGHT },
        { number: 4, position: { x: 3, y: 0 }, direction: Direction.RIGHT },
        { number: 5, position: { x: 8, y: 0 }, direction: Direction.RIGHT },
        { number: 6, position: { x: 9, y: 0 }, direction: Direction.RIGHT },
        { number: 7, position: { x: 10, y: 0 }, direction: Direction.RIGHT },
        { number: 8, position: { x: 11, y: 0 }, direction: Direction.RIGHT },
    ]
};

export const TEMPLATE_CROSS_PATTERN: BoardDefinition = {
    id: 'cross-pattern',
    name: 'Cross Pattern',
    width: 12,
    height: 12,
    tiles: [
        // Vertical conveyor line
        { position: { x: 5, y: 1 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 2 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 5 }, type: TileType.GEAR_CW },
        { position: { x: 5, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 9 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 5, y: 10 }, type: TileType.CONVEYOR, direction: Direction.UP },

        { position: { x: 6, y: 1 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 2 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 3 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 4 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 5 }, type: TileType.GEAR_CCW },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 10 }, type: TileType.CONVEYOR, direction: Direction.DOWN },

        // Horizontal conveyor line
        { position: { x: 1, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 2, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 9, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 10, y: 5 }, type: TileType.CONVEYOR, direction: Direction.LEFT },

        { position: { x: 1, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 2, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 3, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 9, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 10, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },

        // Center intersection
        { position: { x: 5, y: 6 }, type: TileType.PIT },
        { position: { x: 6, y: 6 }, type: TileType.PIT },

        // Corner pits
        { position: { x: 2, y: 2 }, type: TileType.PIT },
        { position: { x: 9, y: 2 }, type: TileType.PIT },
        { position: { x: 2, y: 9 }, type: TileType.PIT },
        { position: { x: 9, y: 9 }, type: TileType.PIT },

        // Repair sites in corners
        { position: { x: 0, y: 0 }, type: TileType.REPAIR },
        { position: { x: 11, y: 0 }, type: TileType.REPAIR },
        { position: { x: 0, y: 11 }, type: TileType.REPAIR },
        { position: { x: 11, y: 11 }, type: TileType.REPAIR },
    ],
    lasers: [
        { position: { x: 5, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 6, y: 11 }, direction: Direction.UP, damage: 1 },
        { position: { x: 0, y: 5 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT, damage: 1 },
    ],
    walls: [],
    startingPositions: [
        { number: 1, position: { x: 0, y: 1 }, direction: Direction.RIGHT },
        { number: 2, position: { x: 0, y: 2 }, direction: Direction.RIGHT },
        { number: 3, position: { x: 11, y: 9 }, direction: Direction.LEFT },
        { number: 4, position: { x: 11, y: 10 }, direction: Direction.LEFT },
        { number: 5, position: { x: 1, y: 0 }, direction: Direction.DOWN },
        { number: 6, position: { x: 2, y: 0 }, direction: Direction.DOWN },
        { number: 7, position: { x: 9, y: 11 }, direction: Direction.UP },
        { number: 8, position: { x: 10, y: 11 }, direction: Direction.UP },
    ]
};

export const TEMPLATE_MAZE: BoardDefinition = {
    id: 'maze-template',
    name: 'Maze Template',
    width: 12,
    height: 12,
    tiles: [
        // Center goal area
        { position: { x: 5, y: 5 }, type: TileType.REPAIR },
        { position: { x: 6, y: 5 }, type: TileType.REPAIR },
        { position: { x: 5, y: 6 }, type: TileType.REPAIR },
        { position: { x: 6, y: 6 }, type: TileType.REPAIR },

        // Scattered pits to create obstacles
        { position: { x: 2, y: 3 }, type: TileType.PIT },
        { position: { x: 4, y: 1 }, type: TileType.PIT },
        { position: { x: 7, y: 2 }, type: TileType.PIT },
        { position: { x: 9, y: 4 }, type: TileType.PIT },
        { position: { x: 1, y: 7 }, type: TileType.PIT },
        { position: { x: 3, y: 9 }, type: TileType.PIT },
        { position: { x: 8, y: 8 }, type: TileType.PIT },
        { position: { x: 10, y: 10 }, type: TileType.PIT },

        // Helpful conveyors
        { position: { x: 3, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 5 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 7, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
        { position: { x: 5, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 5, y: 4 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
        { position: { x: 6, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
        { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.UP },

        // Gears for rotation challenges
        { position: { x: 2, y: 6 }, type: TileType.GEAR_CW },
        { position: { x: 9, y: 5 }, type: TileType.GEAR_CCW },
        { position: { x: 4, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 7, y: 3 }, type: TileType.GEAR_CCW },
    ],
    lasers: [],
    walls: [
        // Create wall barriers to force routing
        { position: { x: 3, y: 3 }, sides: [Direction.RIGHT, Direction.DOWN] },
        { position: { x: 8, y: 3 }, sides: [Direction.LEFT, Direction.DOWN] },
        { position: { x: 3, y: 8 }, sides: [Direction.RIGHT, Direction.UP] },
        { position: { x: 8, y: 8 }, sides: [Direction.LEFT, Direction.UP] },
        { position: { x: 5, y: 1 }, sides: [Direction.DOWN] },
        { position: { x: 6, y: 1 }, sides: [Direction.DOWN] },
        { position: { x: 5, y: 10 }, sides: [Direction.UP] },
        { position: { x: 6, y: 10 }, sides: [Direction.UP] },
        { position: { x: 1, y: 5 }, sides: [Direction.RIGHT] },
        { position: { x: 1, y: 6 }, sides: [Direction.RIGHT] },
        { position: { x: 10, y: 5 }, sides: [Direction.LEFT] },
        { position: { x: 10, y: 6 }, sides: [Direction.LEFT] },
    ],
    startingPositions: [
        { number: 1, position: { x: 0, y: 0 }, direction: Direction.RIGHT },
        { number: 2, position: { x: 11, y: 0 }, direction: Direction.LEFT },
        { number: 3, position: { x: 0, y: 11 }, direction: Direction.RIGHT },
        { number: 4, position: { x: 11, y: 11 }, direction: Direction.LEFT },
        { number: 5, position: { x: 0, y: 5 }, direction: Direction.RIGHT },
        { number: 6, position: { x: 0, y: 6 }, direction: Direction.RIGHT },
        { number: 7, position: { x: 11, y: 5 }, direction: Direction.LEFT },
        { number: 8, position: { x: 11, y: 6 }, direction: Direction.LEFT },
    ]
};

export const TEMPLATE_LASER_GAUNTLET: BoardDefinition = {
    id: 'laser-gauntlet',
    name: 'Laser Gauntlet',
    width: 12,
    height: 12,
    tiles: [
        // Safe path with repair sites
        { position: { x: 1, y: 5 }, type: TileType.REPAIR },
        { position: { x: 5, y: 1 }, type: TileType.REPAIR },
        { position: { x: 10, y: 5 }, type: TileType.REPAIR },
        { position: { x: 5, y: 10 }, type: TileType.REPAIR },
        { position: { x: 5, y: 5 }, type: TileType.REPAIR },
        { position: { x: 6, y: 6 }, type: TileType.REPAIR },

        // Express conveyors for quick escapes
        { position: { x: 2, y: 2 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 3, y: 2 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
        { position: { x: 4, y: 2 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },

        { position: { x: 9, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 8, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
        { position: { x: 7, y: 9 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },

        // Gear traps
        { position: { x: 3, y: 8 }, type: TileType.GEAR_CW },
        { position: { x: 8, y: 3 }, type: TileType.GEAR_CCW },

        // Option tiles for power-ups
        { position: { x: 0, y: 6 }, type: TileType.OPTION },
        { position: { x: 6, y: 0 }, type: TileType.OPTION },
        { position: { x: 11, y: 5 }, type: TileType.OPTION },
        { position: { x: 5, y: 11 }, type: TileType.OPTION },
    ],
    lasers: [
        // Cross pattern of lasers
        { position: { x: 3, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 8, y: 0 }, direction: Direction.DOWN, damage: 1 },
        { position: { x: 3, y: 11 }, direction: Direction.UP, damage: 1 },
        { position: { x: 8, y: 11 }, direction: Direction.UP, damage: 1 },

        { position: { x: 0, y: 3 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 0, y: 8 }, direction: Direction.RIGHT, damage: 1 },
        { position: { x: 11, y: 3 }, direction: Direction.LEFT, damage: 1 },
        { position: { x: 11, y: 8 }, direction: Direction.LEFT, damage: 1 },

        // High-damage central lasers
        { position: { x: 5, y: 0 }, direction: Direction.DOWN, damage: 2 },
        { position: { x: 6, y: 11 }, direction: Direction.UP, damage: 2 },
        { position: { x: 0, y: 5 }, direction: Direction.RIGHT, damage: 2 },
        { position: { x: 11, y: 6 }, direction: Direction.LEFT, damage: 2 },
    ],
    walls: [
        // Create laser cover
        { position: { x: 2, y: 5 }, sides: [Direction.UP] },
        { position: { x: 9, y: 6 }, sides: [Direction.DOWN] },
        { position: { x: 5, y: 2 }, sides: [Direction.LEFT] },
        { position: { x: 6, y: 9 }, sides: [Direction.RIGHT] },
    ],
    startingPositions: [
        { number: 1, position: { x: 0, y: 0 }, direction: Direction.RIGHT },
        { number: 2, position: { x: 1, y: 0 }, direction: Direction.RIGHT },
        { number: 3, position: { x: 0, y: 1 }, direction: Direction.RIGHT },
        { number: 4, position: { x: 1, y: 1 }, direction: Direction.RIGHT },
        { number: 5, position: { x: 10, y: 10 }, direction: Direction.LEFT },
        { number: 6, position: { x: 11, y: 10 }, direction: Direction.LEFT },
        { number: 7, position: { x: 10, y: 11 }, direction: Direction.LEFT },
        { number: 8, position: { x: 11, y: 11 }, direction: Direction.LEFT },
    ]
};

// Collection of all templates
export const BOARD_TEMPLATES = [
    TEMPLATE_EMPTY_12X12,
    TEMPLATE_SIMPLE_RACE,
    TEMPLATE_CROSS_PATTERN,
    TEMPLATE_MAZE,
    TEMPLATE_LASER_GAUNTLET,
];

export interface TemplateCategory {
    name: string;
    description: string;
    templates: BoardDefinition[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    {
        name: 'Basic Templates',
        description: 'Simple starting points for board creation',
        templates: [TEMPLATE_EMPTY_12X12]
    },
    {
        name: 'Race Tracks',
        description: 'Boards focused on racing and movement',
        templates: [TEMPLATE_SIMPLE_RACE, TEMPLATE_CROSS_PATTERN]
    },
    {
        name: 'Puzzle Boards',
        description: 'Boards emphasizing strategy and navigation',
        templates: [TEMPLATE_MAZE]
    },
    {
        name: 'Combat Arenas',
        description: 'Boards with lots of hazards and lasers',
        templates: [TEMPLATE_LASER_GAUNTLET]
    }
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): BoardDefinition | undefined {
    return BOARD_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryName: string): BoardDefinition[] {
    const category = TEMPLATE_CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.templates : [];
}