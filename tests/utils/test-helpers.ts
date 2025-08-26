import { Player, Direction, Position, TileType, GamePhase, PowerState, ProgramCard, Course } from '@/lib/game/types';
import { OptionCardType, createOptionCard, OptionCard } from '@/lib/game/optionCards';
import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { Server } from 'socket.io';

export interface TestOptions {
  width?: number;
  height?: number;
  playerCount?: number;
  roomCode?: string;
}

export function createMockIo(): Server {
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;
  return mockIo;
}

export function createTestGameState(options: TestOptions = {}): ServerGameState {
  const width = options.width || 10;
  const height = options.height || 10;
  const roomCode = options.roomCode || 'TEST-ROOM';

  // Initialize tiles as 2D array
  const tiles: any[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        position: { x, y },
        type: TileType.EMPTY,
        walls: []
      };
    }
  }

  const course: Course = {
    board: {
      width,
      height,
      tiles,
      walls: [],
      lasers: [],
      startingPositions: [
        { number: 1, position: { x: 0, y: 0 }, direction: Direction.UP },
        { number: 2, position: { x: 1, y: 0 }, direction: Direction.UP },
        { number: 3, position: { x: 2, y: 0 }, direction: Direction.UP },
        { number: 4, position: { x: 3, y: 0 }, direction: Direction.UP },
      ],
    },
    definition: {
      id: 'test-course',
      name: 'Test Course',
      description: 'Test course for unit tests',
      difficulty: 'intermediate',
      minPlayers: 2,
      maxPlayers: 4,
      boards: ['test-board'],
      checkpoints: [],
    },
  };

  const gameState: ServerGameState = {
    id: roomCode,
    roomCode,
    name: 'Test Game',
    host: 'player-1',
    phase: GamePhase.EXECUTING,
    currentRegister: 0,
    roundNumber: 1,
    cardsDealt: false,
    players: {},
    course,
    optionDeck: [],
    discardedOptions: [],
  };

  return gameState;
}

export function placeRobot(
  gameState: ServerGameState,
  x: number,
  y: number,
  direction: Direction,
  name: string
): Player {
  const player: Player = {
    id: `player-${name}`,
    userId: `player-${name}`,
    name,
    position: { x, y },
    direction,
    lives: 3,
    damage: 0,
    checkpointsVisited: 0,
    lockedRegisters: 0,
    dealtCards: [],
    selectedCards: Array(5).fill(null),
    optionCards: [],
    archiveMarker: { x, y },
    isDead: false,
    isPoweredDown: false,
    powerState: PowerState.ON,
    announcedPowerDown: false,
  };

  gameState.players[player.id] = player;
  return player;
}

export function addWall(gameState: ServerGameState, from: Position, to: Position): void {
  if (!gameState.course.board.walls) {
    gameState.course.board.walls = [];
  }
  
  // Convert from-to wall to position-sides format
  // Determine which side of the 'from' tile has the wall
  let sides: Direction[] = [];
  let oppositeDirection: Direction | null = null;
  
  if (to.x > from.x) {
    sides = [Direction.RIGHT];
    oppositeDirection = Direction.LEFT;
  } else if (to.x < from.x) {
    sides = [Direction.LEFT];
    oppositeDirection = Direction.RIGHT;
  } else if (to.y > from.y) {
    sides = [Direction.DOWN];
    oppositeDirection = Direction.UP;
  } else if (to.y < from.y) {
    sides = [Direction.UP];
    oppositeDirection = Direction.DOWN;
  }
  
  // Add wall to the board.walls array (for rendering)
  gameState.course.board.walls.push({ 
    position: from,
    sides
  });
  
  // Also add wall to the tiles themselves (for collision detection)
  // Add wall on the 'from' tile
  const fromTile = gameState.course.board.tiles[from.y]?.[from.x];
  if (fromTile && sides.length > 0) {
    if (!fromTile.walls) fromTile.walls = [];
    if (!fromTile.walls.includes(sides[0])) {
      fromTile.walls.push(sides[0]);
    }
  }
  
  // Add wall on the 'to' tile (opposite side)
  const toTile = gameState.course.board.tiles[to.y]?.[to.x];
  if (toTile && oppositeDirection !== null) {
    if (!toTile.walls) toTile.walls = [];
    if (!toTile.walls.includes(oppositeDirection)) {
      toTile.walls.push(oppositeDirection);
    }
  }
}

export function giveOptionCard(player: Player, cardType: OptionCardType): OptionCard {
  const card = createOptionCard(cardType);
  if (!player.optionCards) {
    player.optionCards = [];
  }
  player.optionCards.push(card);
  return card;
}

export function getDamageDealt(player: Player): number {
  return player.damage;
}

export function addBoardLaser(
  gameState: ServerGameState,
  x: number,
  y: number,
  direction: Direction,
  damage: number = 1
): void {
  if (!gameState.course.board.lasers) {
    gameState.course.board.lasers = [];
  }
  gameState.course.board.lasers.push({
    position: { x, y },
    direction,
    damage,
  });
}

export function addTile(
  gameState: ServerGameState,
  x: number,
  y: number,
  type: TileType,
  attributes?: any
): void {
  // Initialize tiles array if needed
  if (!gameState.course.board.tiles) {
    gameState.course.board.tiles = [];
    for (let i = 0; i < gameState.course.board.height; i++) {
      gameState.course.board.tiles[i] = [];
      for (let j = 0; j < gameState.course.board.width; j++) {
        gameState.course.board.tiles[i][j] = {
          position: { x: j, y: i },
          type: TileType.EMPTY,
          walls: []
        };
      }
    }
  }
  
  // Set the tile at the specified position
  if (gameState.course.board.tiles[y] && gameState.course.board.tiles[y][x]) {
    gameState.course.board.tiles[y][x] = {
      position: { x, y },
      type,
      walls: [],
      ...attributes
    };
  }
}

export async function executeRegister(
  gameEngine: GameEngine,
  gameState: ServerGameState,
  registerIndex: number = 0
): Promise<void> {
  gameState.currentRegister = registerIndex;
  await gameEngine.executeRegister(gameState, registerIndex);
}

export function resetShieldUsage(player: Player): void {
  if (player.optionCards) {
    player.optionCards.forEach(card => {
      if (card.type === OptionCardType.SHIELD) {
        card.usedThisRegister = false;
      }
    });
  }
}

export function setPlayerCards(player: Player, cards: any[]): void {
  player.selectedCards = cards;
}