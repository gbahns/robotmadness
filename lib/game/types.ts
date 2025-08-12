// lib/game/types.ts

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum Difficulty {
  Beginner = 0,
  Intermediate = 1,
  Advanced = 2,
}

export enum GamePhase {
  WAITING = 'waiting',
  STARTING = 'starting',
  PROGRAMMING = 'programming',
  EXECUTING = 'executing',
  ENDED = 'ended',
}

export enum CardType {
  U_TURN = 'U_TURN',
  ROTATE_LEFT = 'ROTATE_LEFT',
  ROTATE_RIGHT = 'ROTATE_RIGHT',
  BACK_UP = 'BACK_UP',
  MOVE_1 = 'MOVE_1',
  MOVE_2 = 'MOVE_2',
  MOVE_3 = 'MOVE_3',
}

export interface Position {
  x: number;
  y: number;
}

export interface ProgramCard {
  id: number;
  type: CardType;
  priority: number;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  position: Position;
  direction: Direction;
  damage: number;
  lives: number;
  checkpointsVisited: number;
  isPoweredDown: boolean;
  isVirtual?: boolean;
  isDisconnected?: boolean;
  submitted?: boolean;
  respawnPosition?: StartingPosition;
  isDead?: boolean;

  // Cards
  dealtCards: ProgramCard[];
  selectedCards: (ProgramCard | null)[];
  lockedRegisters: number;

  // Power Down fields
  powerState: PowerState;
  announcedPowerDown: boolean;
  continuesPowerDown?: boolean;
}

export enum PowerState {
  ON = 'ON',                 // Normal operation
  ANNOUNCING = 'ANNOUNCING', // Announced power down, takes effect next turn
  OFF = 'OFF'                // Currently powered down
}

export interface GameState {
  id: string;
  roomCode: string;
  name: string;
  phase: GamePhase;
  currentRegister: number;
  players: Record<string, Player>;
  board: Board;
  roundNumber: number;
  cardsDealt: boolean;
}

export interface Board {
  width: number;
  height: number;
  tiles: Tile[][];
  checkpoints: Checkpoint[];
  startingPositions: StartingPosition[];
  lasers?: Laser[]; // Add this line
}

export interface Laser {
  position: Position;
  direction: number;
  damage: number;
}

export interface Tile {
  position: Position;
  type: TileType;
  walls: Direction[]; // Walls on this tile blocking movement in those directions
  direction?: Direction; // For conveyors, gears, pushers
  rotate?: 'clockwise' | 'counterclockwise'; // For gears
  registers?: number[]; // For pushers
}

export interface Checkpoint {
  position: Position;
  number: number;
}

export interface StartingPosition {
  position: Position;
  direction: Direction;
}

export enum TileType {
  EMPTY = 'empty',
  PIT = 'pit',
  REPAIR = 'repair',
  OPTION = 'option',
  CONVEYOR = 'conveyor',
  EXPRESS_CONVEYOR = 'express',
  GEAR_CW = 'gear_cw',
  GEAR_CCW = 'gear_ccw',
  PUSHER = 'pusher',
}

// Socket event types
export enum SocketEvent {
  // Client -> Server
  JOIN_GAME = 'join-game',
  LEAVE_GAME = 'leave-game',
  START_GAME = 'start-game',
  SELECT_CARDS = 'select-cards',
  SUBMIT_CARDS = 'submit-cards',
  POWER_DOWN = 'power-down',

  // Server -> Client
  GAME_STATE = 'game-state',
  PLAYER_JOINED = 'player-joined',
  PLAYER_LEFT = 'player-left',
  CARDS_DEALT = 'cards-dealt',
  PLAYER_SUBMITTED = 'player-submitted',
  REGISTER_START = 'register-start',
  REGISTER_STARTED = 'register-started',
  REGISTER_EXECUTED = 'register-executed',
  GAME_ERROR = 'game-error',

  // Power Down events
  TOGGLE_POWER_DOWN = 'toggle-power-down',
  PLAYER_POWER_STATE_CHANGED = 'player-power-state-changed',
  PLAYER_POWERED_DOWN = 'player-powered-down',
  CONTINUE_POWER_DOWN = 'continue-power-down',
  POWER_DOWN_OPTION = 'power-down-option',
}

// Power down related event payloads
export interface PowerDownTogglePayload {
  roomCode: string;
}

export interface PowerStateChangedPayload {
  playerId: string;
  playerName: string;
  powerState: PowerState;
  announcedPowerDown: boolean;
}

export interface PoweredDownPayload {
  playerId: string;
  playerName: string;
}

export interface ContinuePowerDownPayload {
  roomCode: string;
  continueDown: boolean;
}

export interface MoveResult {
  playerId: string;
  startPosition: Position;
  endPosition: Position;
  startDirection: Direction;
  endDirection: Direction;
  pushedRobots?: PushedRobot[];
  fellInPit?: boolean;
  touchedCheckpoint?: number;
  tookDamage?: number;
}

export interface PushedRobot {
  playerId: string;
  fromPosition: Position;
  toPosition: Position;
}

// For the UI
export interface DraggedCard {
  card: ProgramCard;
  fromIndex: number;
  fromArea: 'hand' | 'register';
}
