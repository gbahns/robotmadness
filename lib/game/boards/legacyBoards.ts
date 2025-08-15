// // lib/game/boards/legacyBoards.ts

// import { CourseDefinition, BoardDefinition, TileElement, LaserElement } from './factoryFloorBoards';
// import { Direction, TileType } from '../types';

// // Legacy Board Definitions from boardConfig.js

// // Risky Exchange variations
// export const RISKY_EXCHANGE_CLAUDE: BoardDefinition = {
//     id: 'risky_exchange_claude',
//     name: 'Risky Exchange (Claude)',
//     //description: 'Claude\'s interpretation of the classic Risky Exchange',
//     //difficulty: 'beginner',
//     //minPlayers: 2,
//     //maxPlayers: 8,
//     tiles: [
//         {
//             //id: 'exchange_claude',
//             //name: 'Exchange (Claude)',
//             //width: 12,
//             height: 12,
//             checkpoints: [
//                 { position: { x: 10, y: 2 }, number: 1 },
//                 { position: { x: 10, y: 9 }, number: 2 },
//                 { position: { x: 1, y: 9 }, number: 3 }
//             ],
//             startingPositions: [
//                 { position: { x: 0, y: 0 }, direction: Direction.RIGHT },
//                 { position: { x: 0, y: 11 }, direction: Direction.RIGHT },
//                 { position: { x: 11, y: 0 }, direction: Direction.LEFT },
//                 { position: { x: 11, y: 11 }, direction: Direction.LEFT },
//                 { position: { x: 5, y: 0 }, direction: Direction.DOWN },
//                 { position: { x: 6, y: 0 }, direction: Direction.DOWN },
//                 { position: { x: 5, y: 11 }, direction: Direction.UP },
//                 { position: { x: 6, y: 11 }, direction: Direction.UP }
//             ],
//             tiles: [], // This version doesn't have special tiles defined
//             lasers: []
//         }
//     ]
// };

// export const RISKY_EXCHANGE_GEMINI: BoardDefinition = {
//     id: 'risky_exchange_gemini',
//     name: 'Risky Exchange (Gemini)',
//     //description: 'Gemini\'s take on Risky Exchange with express conveyors',
//     // difficulty: 'beginner',
//     // minPlayers: 2,
//     // maxPlayers: 8,
//     tiles: [
//         {
//             id: 'exchange_gemini',
//             name: 'Exchange (Gemini)',
//             width: 12,
//             height: 12,
//             checkpoints: [
//                 { position: { x: 3, y: 3 }, number: 1 },
//                 { position: { x: 8, y: 8 }, number: 2 }
//             ],
//             startingPositions: [
//                 { position: { x: 0, y: 5 }, direction: Direction.RIGHT },
//                 { position: { x: 0, y: 6 }, direction: Direction.RIGHT },
//                 { position: { x: 11, y: 5 }, direction: Direction.LEFT },
//                 { position: { x: 11, y: 6 }, direction: Direction.LEFT },
//                 { position: { x: 5, y: 0 }, direction: Direction.DOWN },
//                 { position: { x: 6, y: 0 }, direction: Direction.DOWN },
//                 { position: { x: 5, y: 11 }, direction: Direction.UP },
//                 { position: { x: 6, y: 11 }, direction: Direction.UP }
//             ],
//             tiles: [
//                 // Express conveyor loop
//                 { position: { x: 1, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 2, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 3, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 4, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 5, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 5, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 5, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 4, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 3, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 2, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 1, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
//                 { position: { x: 1, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
//                 // Mirror on right side
//                 { position: { x: 10, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 9, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 8, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 7, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 6, y: 5 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 6, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 6, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 7, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 8, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 9, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 10, y: 7 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP },
//                 { position: { x: 10, y: 6 }, type: TileType.EXPRESS_CONVEYOR, direction: Direction.UP }
//             ],
//             lasers: []
//         }
//     ]
// };

// // Laser Test Arena
// export const LASER_TEST_ARENA: CourseDefinition = {
//     id: 'laser_test',
//     name: 'Laser Test Arena',
//     description: 'A testing ground for laser mechanics with multiple laser sources',
//     difficulty: 'intermediate',
//     minPlayers: 2,
//     maxPlayers: 8,
//     boards: [
//         {
//             id: 'laser_arena',
//             name: 'Laser Test Arena',
//             width: 12,
//             height: 12,
//             checkpoints: [
//                 { position: { x: 5, y: 5 }, number: 1 },
//                 { position: { x: 6, y: 6 }, number: 2 }
//             ],
//             startingPositions: [
//                 { position: { x: 1, y: 1 }, direction: Direction.RIGHT },
//                 { position: { x: 10, y: 1 }, direction: Direction.LEFT },
//                 { position: { x: 10, y: 10 }, direction: Direction.LEFT },
//                 { position: { x: 1, y: 10 }, direction: Direction.RIGHT },
//                 { position: { x: 3, y: 3 }, direction: Direction.DOWN },
//                 { position: { x: 8, y: 3 }, direction: Direction.DOWN },
//                 { position: { x: 3, y: 8 }, direction: Direction.UP },
//                 { position: { x: 8, y: 8 }, direction: Direction.UP }
//             ],
//             tiles: [
//                 // Repair sites in corners
//                 { position: { x: 0, y: 0 }, type: TileType.REPAIR },
//                 { position: { x: 11, y: 0 }, type: TileType.REPAIR },
//                 { position: { x: 0, y: 11 }, type: TileType.REPAIR },
//                 { position: { x: 11, y: 11 }, type: TileType.REPAIR },
//                 // Some gears for added chaos
//                 { position: { x: 4, y: 4 }, type: TileType.GEAR_CW },
//                 { position: { x: 7, y: 4 }, type: TileType.GEAR_CCW },
//                 { position: { x: 4, y: 7 }, type: TileType.GEAR_CCW },
//                 { position: { x: 7, y: 7 }, type: TileType.GEAR_CW }
//             ],
//             lasers: [
//                 // Horizontal lasers
//                 { position: { x: 0, y: 2 }, direction: Direction.RIGHT, damage: 1 },
//                 { position: { x: 11, y: 9 }, direction: Direction.LEFT, damage: 1 },
//                 // Vertical lasers
//                 { position: { x: 2, y: 0 }, direction: Direction.DOWN, damage: 1 },
//                 { position: { x: 9, y: 11 }, direction: Direction.UP, damage: 1 },
//                 // Double damage lasers
//                 { position: { x: 5, y: 0 }, direction: Direction.DOWN, damage: 2 },
//                 { position: { x: 6, y: 11 }, direction: Direction.UP, damage: 2 }
//             ]
//         }
//     ]
// };

// // Factory Floor (Sample Board)
// export const FACTORY_FLOOR_COURSE: CourseDefinition = {
//     id: 'factory_floor',
//     name: 'Factory Floor',
//     description: 'A classic factory setting with conveyor belts forming a complex path',
//     difficulty: 'intermediate',
//     minPlayers: 2,
//     maxPlayers: 6,
//     boards: [
//         {
//             id: 'factory',
//             name: 'Factory Floor',
//             width: 12,
//             height: 12,
//             checkpoints: [
//                 { position: { x: 6, y: 9 }, number: 1 },
//                 { position: { x: 9, y: 5 }, number: 2 },
//                 { position: { x: 3, y: 2 }, number: 3 }
//             ],
//             startingPositions: [
//                 { position: { x: 1, y: 11 }, direction: Direction.UP },
//                 { position: { x: 3, y: 11 }, direction: Direction.UP },
//                 { position: { x: 5, y: 11 }, direction: Direction.UP },
//                 { position: { x: 7, y: 11 }, direction: Direction.UP },
//                 { position: { x: 9, y: 11 }, direction: Direction.UP },
//                 { position: { x: 11, y: 11 }, direction: Direction.UP }
//             ],
//             tiles: [
//                 // Complex conveyor belt system
//                 { position: { x: 1, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 3, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 2, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 2, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 3, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
//                 { position: { x: 4, y: 6 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 5, y: 7 }, type: TileType.CONVEYOR, direction: Direction.UP },
//                 { position: { x: 6, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 7, y: 9 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 8, y: 8 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 9, y: 7 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 10, y: 6 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 11, y: 5 }, type: TileType.CONVEYOR, direction: Direction.UP },
//                 { position: { x: 0, y: 4 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
//                 { position: { x: 1, y: 3 }, type: TileType.CONVEYOR, direction: Direction.DOWN },
//                 { position: { x: 2, y: 2 }, type: TileType.CONVEYOR, direction: Direction.LEFT },
//                 { position: { x: 4, y: 8 }, type: TileType.CONVEYOR, direction: Direction.RIGHT },
//                 // Repair sites
//                 { position: { x: 0, y: 0 }, type: TileType.REPAIR },
//                 { position: { x: 11, y: 11 }, type: TileType.REPAIR },
//                 // Gears
//                 { position: { x: 5, y: 5 }, type: TileType.GEAR_CW },
//                 { position: { x: 6, y: 5 }, type: TileType.GEAR_CCW }
//             ],
//             lasers: [
//                 { position: { x: 0, y: 5 }, direction: Direction.RIGHT, damage: 1 },
//                 { position: { x: 11, y: 7 }, direction: Direction.LEFT, damage: 1 }
//             ]
//         }
//     ]
// };

// // Export all legacy courses
// export const LEGACY_COURSES: CourseDefinition[] = [
//     RISKY_EXCHANGE_CLAUDE,
//     RISKY_EXCHANGE_GEMINI,
//     LASER_TEST_ARENA,
//     FACTORY_FLOOR_COURSE
// ];