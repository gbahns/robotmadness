// lib/game/constants.ts

import { CardType, Direction } from './types';

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
  REGISTER_DELAY: 200,
} as const;

// Direction vectors for movement
export const DIRECTION_VECTORS = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
} as const;

// Card UI configuration
export const CARD_DISPLAY = {
  [CardType.U_TURN]: {
    name: 'U-Turn',
    //symbol: '↩️',
    symbol: '↷', //⤵⟲↶↷
    color: 'bg-yellow-800',
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
    color: 'bg-blue-900',
  },
  [CardType.MOVE_1]: {
    name: 'Move 1',
    symbol: '➊',
    color: 'bg-blue-700',
  },
  [CardType.MOVE_2]: {
    name: 'Move 2',
    symbol: '➋',
    color: 'bg-blue-600',
  },
  [CardType.MOVE_3]: {
    name: 'Move 3',
    symbol: '➌',
    color: 'bg-blue-500',
  },
} as const;
