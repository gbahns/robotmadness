import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { 
  createTestGameState, 
  placeRobot, 
  giveOptionCard, 
  getDamageDealt
} from './utils/test-helpers';
import { Direction, PowerState } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import { Server } from 'socket.io';

describe('Rear-Firing Laser Option Card', () => {
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
      damagePreventionTimeout: 100
    });
    gameState = createTestGameState();
  });

  it('should fire both front and rear lasers', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
    const frontTarget = placeRobot(gameState, 7, 5, Direction.DOWN, 'FrontTarget'); // Face away to avoid shooting back
    const rearTarget = placeRobot(gameState, 3, 5, Direction.UP, 'RearTarget'); // Face away to avoid shooting back
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(frontTarget)).toBe(1); // Hit by front laser
    expect(getDamageDealt(rearTarget)).toBe(1); // Hit by rear laser
    expect(getDamageDealt(shooter)).toBe(0); // No one shooting back
  });

  it('should only apply Double-Barreled to front laser, not rear', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
    const frontTarget = placeRobot(gameState, 7, 5, Direction.DOWN, 'FrontTarget');
    const rearTarget = placeRobot(gameState, 3, 5, Direction.UP, 'RearTarget');
    
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);

    await gameEngine.executeLasers(gameState);

    // Double-Barreled only affects front laser
    expect(getDamageDealt(frontTarget)).toBe(2); // 2 shots from front laser
    expect(getDamageDealt(rearTarget)).toBe(1); // 1 shot from rear laser (no Double-Barreled)
    expect(getDamageDealt(shooter)).toBe(0);
  });

  it('should only apply High-Power to front laser, not rear', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
    const frontBlocker = placeRobot(gameState, 6, 5, Direction.DOWN, 'FrontBlocker');
    const frontTarget = placeRobot(gameState, 7, 5, Direction.UP, 'FrontTarget');
    const rearBlocker = placeRobot(gameState, 4, 5, Direction.DOWN, 'RearBlocker');
    const rearTarget = placeRobot(gameState, 3, 5, Direction.UP, 'RearTarget');
    
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
    giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);

    await gameEngine.executeLasers(gameState);

    // High-Power only affects front laser
    expect(getDamageDealt(frontBlocker)).toBe(1); // Hit by front laser
    expect(getDamageDealt(frontTarget)).toBe(1); // Hit through blocker (High-Power)
    expect(getDamageDealt(rearBlocker)).toBe(1); // Hit by rear laser
    expect(getDamageDealt(rearTarget)).toBe(0); // Rear laser stopped by blocker (no High-Power)
    expect(getDamageDealt(shooter)).toBe(0);
  });

  it('should be blocked by walls for rear laser without High-Power', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
    const frontTarget = placeRobot(gameState, 7, 5, Direction.DOWN, 'FrontTarget'); // Face away
    const rearTarget = placeRobot(gameState, 3, 5, Direction.UP, 'RearTarget'); // Face away
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
    
    // Add wall behind shooter (blocking rear laser)
    const tile = gameState.course.board.tiles[5][5];
    if (!tile.walls) tile.walls = [];
    tile.walls.push(Direction.LEFT); // Wall to the left/west blocks rear laser when facing right

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(frontTarget)).toBe(1); // Front laser hits
    expect(getDamageDealt(rearTarget)).toBe(0); // Rear laser blocked by wall
  });

  it('should not fire rear laser when powered down', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
    const frontTarget = placeRobot(gameState, 7, 5, Direction.DOWN, 'FrontTarget');
    const rearTarget = placeRobot(gameState, 3, 5, Direction.UP, 'RearTarget');
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
    shooter.powerState = PowerState.OFF;

    await gameEngine.executeLasers(gameState);

    // Neither laser fires when powered down
    expect(getDamageDealt(frontTarget)).toBe(0);
    expect(getDamageDealt(rearTarget)).toBe(0);
  });

  it('should work with all laser modifiers but only apply to front laser', async () => {
    const shooter = placeRobot(gameState, 5, 5, Direction.UP, 'Shooter');
    
    // Front laser path (north)
    const frontBlocker = placeRobot(gameState, 5, 4, Direction.LEFT, 'FrontBlocker');
    const frontTarget = placeRobot(gameState, 5, 3, Direction.RIGHT, 'FrontTarget');
    
    // Rear laser path (south)
    const rearTarget = placeRobot(gameState, 5, 6, Direction.LEFT, 'RearTarget');
    
    // Give all laser option cards
    giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
    giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);

    await gameEngine.executeLasers(gameState);

    // Front laser: 2 shots (Double-Barreled) that go through one robot (High-Power)
    expect(getDamageDealt(frontBlocker)).toBe(2); // 2 shots from front laser
    expect(getDamageDealt(frontTarget)).toBe(2); // 2 shots through blocker
    // Rear laser: 1 shot (no Double-Barreled), stops at first robot (no High-Power)
    expect(getDamageDealt(rearTarget)).toBe(1); // 1 shot from rear laser
    expect(getDamageDealt(shooter)).toBe(0);
  });
});