// lib/game/constants.ts

import { CardType, ProgramCard } from './types';

export const GAME_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  STARTING_LIVES: 3,
  MAX_DAMAGE: 9,
  REGISTERS_PER_TURN: 5,
  CARDS_DEALT_BASE: 9,
  
  // Timing (in milliseconds)
  CARD_SELECTION_TIME: 30000, // 30 seconds
  MOVE_ANIMATION_TIME: 500,
  REGISTER_DELAY: 1000,
} as const;

// Card deck configuration based on RoboRally rules
export const CARD_DECK: ProgramCard[] = [
  // U-Turn cards (6 total, priority 10-60)
  { id: 0, type: CardType.U_TURN, priority: 10 },
  { id: 1, type: CardType.U_TURN, priority: 20 },
  { id: 2, type: CardType.U_TURN, priority: 30 },
  { id: 3, type: CardType.U_TURN, priority: 40 },
  { id: 4, type: CardType.U_TURN, priority: 50 },
  { id: 5, type: CardType.U_TURN, priority: 60 },
  
  // Rotate Left cards (18 total, priority 70-410, increment by 20)
  ...Array.from({ length: 18 }, (_, i) => ({
    id: 6 + i,
    type: CardType.ROTATE_LEFT,
    priority: 70 + (i * 20)
  })),
  
  // Rotate Right cards (18 total, priority 80-420, increment by 20)
  ...Array.from({ length: 18 }, (_, i) => ({
    id: 24 + i,
    type: CardType.ROTATE_RIGHT,
    priority: 80 + (i * 20)
  })),
  
  // Back Up cards (6 total, priority 430-480, increment by 10)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 42 + i,
    type: CardType.BACK_UP,
    priority: 430 + (i * 10)
  })),
  
  // Move 1 cards (18 total, priority 490-650, increment by 10)
  ...Array.from({ length: 18 }, (_, i) => ({
    id: 48 + i,
    type: CardType.MOVE_1,
    priority: 490 + (i * 10)
  })),
  
  // Move 2 cards (12 total, priority 670-780, increment by 10)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: 66 + i,
    type: CardType.MOVE_2,
    priority: 670 + (i * 10)
  })),
  
  // Move 3 cards (6 total, priority 790-840, increment by 10)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 78 + i,
    type: CardType.MOVE_3,
    priority: 790 + (i * 10)
  })),
];

// Direction vectors for movement
export const DIRECTION_VECTORS = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
} as const;

// Import Direction from types
import { Direction } from './types';

// Card UI configuration
export const CARD_DISPLAY = {
  [CardType.U_TURN]: {
    name: 'U-Turn',
    symbol: '↩️',
    color: 'bg-red-600',
  },
  [CardType.ROTATE_LEFT]: {
    name: 'Rotate Left',
    symbol: '↰',
    color: 'bg-yellow-600',
  },
  [CardType.ROTATE_RIGHT]: {
    name: 'Rotate Right',
    symbol: '↱',
    color: 'bg-yellow-600',
  },
  [CardType.BACK_UP]: {
    name: 'Back Up',
    symbol: '⬇',
    color: 'bg-purple-600',
  },
  [CardType.MOVE_1]: {
    name: 'Move 1',
    symbol: '➊',
    color: 'bg-blue-600',
  },
  [CardType.MOVE_2]: {
    name: 'Move 2',
    symbol: '➋',
    color: 'bg-blue-600',
  },
  [CardType.MOVE_3]: {
    name: 'Move 3',
    symbol: '➌',
    color: 'bg-blue-600',
  },
} as const;

// Simple test board for development
export const TEST_BOARD = {
  width: 12,
  height: 12,
  checkpoints: [
    { position: { x: 6, y: 3 }, number: 1 },
    { position: { x: 9, y: 9 }, number: 2 },
    { position: { x: 3, y: 6 }, number: 3 },
  ],
  startingPositions: [
    { position: { x: 1, y: 1 }, direction: Direction.RIGHT },
    { position: { x: 10, y: 1 }, direction: Direction.LEFT },
    { position: { x: 10, y: 10 }, direction: Direction.LEFT },
    { position: { x: 1, y: 10 }, direction: Direction.RIGHT },
    { position: { x: 5, y: 5 }, direction: Direction.UP },
    { position: { x: 6, y: 6 }, direction: Direction.DOWN },
    { position: { x: 3, y: 3 }, direction: Direction.RIGHT },
    { position: { x: 8, y: 8 }, direction: Direction.LEFT },
  ],
};
