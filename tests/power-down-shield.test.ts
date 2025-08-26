import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { 
  createTestGameState, 
  placeRobot, 
  giveOptionCard, 
  getDamageDealt,
  executeRegister 
} from './utils/test-helpers';
import { Direction, PowerState } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import { Server } from 'socket.io';

describe('Power-Down Shield Option Card', () => {
  let gameEngine: GameEngine;
  let gameState: ServerGameState;
  let mockIo: Server;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
    // Use test mode with short damage prevention timeout
    gameEngine = new GameEngine(mockIo, {
      testMode: true,
      damagePreventionTimeout: 100 // 100ms for tests instead of 15 seconds
    });
    gameState = createTestGameState();
  });

  it('should not block damage when robot is not powered down', async () => {
    const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
    const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
    giveOptionCard(robotB, OptionCardType.POWER_DOWN_SHIELD);
    robotB.powerState = PowerState.ON; // Not powered down

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(robotB)).toBe(1); // Shield doesn't work when not powered down
    expect(getDamageDealt(robotA)).toBe(1);
  });

  it('should block 1 damage from each direction when powered down', async () => {
    const defender = placeRobot(gameState, 5, 5, Direction.UP, 'Defender');
    const attackerNorth = placeRobot(gameState, 5, 3, Direction.DOWN, 'North');
    const attackerSouth = placeRobot(gameState, 5, 7, Direction.UP, 'South');
    const attackerEast = placeRobot(gameState, 7, 5, Direction.LEFT, 'East');
    const attackerWest = placeRobot(gameState, 3, 5, Direction.RIGHT, 'West');
    
    giveOptionCard(defender, OptionCardType.POWER_DOWN_SHIELD);
    defender.powerState = PowerState.OFF; // Powered down

    await gameEngine.executeLasers(gameState);

    // Power-Down Shield blocks 1 damage from each of the 4 directions
    expect(getDamageDealt(defender)).toBe(0); // All 4 damage blocked
  });

  it('should only block 1 damage per direction per register', async () => {
    const defender = placeRobot(gameState, 5, 5, Direction.UP, 'Defender');
    // Two attackers from the same direction (west)
    const attacker1 = placeRobot(gameState, 3, 5, Direction.RIGHT, 'Attacker1');
    const attacker2 = placeRobot(gameState, 4, 5, Direction.RIGHT, 'Attacker2');
    
    // Give High-Power Laser to attacker1 so it can shoot through attacker2
    giveOptionCard(attacker1, OptionCardType.HIGH_POWER_LASER);
    giveOptionCard(defender, OptionCardType.POWER_DOWN_SHIELD);
    defender.powerState = PowerState.OFF;

    await gameEngine.executeLasers(gameState);

    // attacker1 shoots through attacker2 with High-Power Laser
    // Both hits are from the WEST direction
    // Power-Down Shield only blocks 1 damage from that direction
    expect(getDamageDealt(defender)).toBe(1); // 1 blocked, 1 gets through
  }, 10000);

  it('should reset direction tracking each register', async () => {
    const defender = placeRobot(gameState, 5, 5, Direction.UP, 'Defender');
    const attacker = placeRobot(gameState, 3, 5, Direction.RIGHT, 'Attacker');
    
    giveOptionCard(defender, OptionCardType.POWER_DOWN_SHIELD);
    defender.powerState = PowerState.OFF;

    // First register
    await gameEngine.executeLasers(gameState);
    expect(getDamageDealt(defender)).toBe(0); // Blocked

    // Reset for second register
    defender.damage = 0; // Reset damage for test
    const shield = defender.optionCards.find(c => c.type === OptionCardType.POWER_DOWN_SHIELD);
    if (shield) {
      shield.directionsUsed = []; // Simulate register reset
      shield.usedThisRegister = false;
    }

    // Second register
    await gameEngine.executeLasers(gameState);
    expect(getDamageDealt(defender)).toBe(0); // Blocked again
  });

  it('should block board laser damage from appropriate direction', async () => {
    const defender = placeRobot(gameState, 5, 5, Direction.UP, 'Defender');
    giveOptionCard(defender, OptionCardType.POWER_DOWN_SHIELD);
    defender.powerState = PowerState.OFF;

    // Add board laser from the south
    if (!gameState.course.board.lasers) {
      gameState.course.board.lasers = [];
    }
    gameState.course.board.lasers.push({
      position: { x: 5, y: 7 },
      direction: Direction.UP,
      damage: 1
    });

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(defender)).toBe(0); // Board laser blocked from south direction
  });
  
  it('should block board and robot lasers independently by direction', async () => {
    const defender = placeRobot(gameState, 5, 5, Direction.UP, 'Defender');
    const robotAttacker = placeRobot(gameState, 3, 5, Direction.RIGHT, 'RobotWest');
    giveOptionCard(defender, OptionCardType.POWER_DOWN_SHIELD);
    defender.powerState = PowerState.OFF;

    // Add board laser from the south
    if (!gameState.course.board.lasers) {
      gameState.course.board.lasers = [];
    }
    gameState.course.board.lasers.push({
      position: { x: 5, y: 7 },
      direction: Direction.UP,
      damage: 1
    });

    await gameEngine.executeLasers(gameState);

    // Power-Down Shield blocks 1 from west (robot) and 1 from south (board laser)
    expect(getDamageDealt(defender)).toBe(0); // Both blocked (different directions)
  });
});
