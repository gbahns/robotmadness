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

describe('Double-Barreled Laser Option Card', () => {
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

  it('should fire 2 shots dealing 2 damage total', async () => {
    const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
    const target = placeRobot(gameState, 4, 2, Direction.UP, 'Target'); // Face away so doesn't shoot back
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(target)).toBe(2); // 2 shots, 1 damage each
    expect(getDamageDealt(shooter)).toBe(0); // Target not facing shooter
  });

  it('should work with High-Power Laser to shoot through obstacles twice', async () => {
    const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
    const blocker = placeRobot(gameState, 3, 2, Direction.UP, 'Blocker');
    const target = placeRobot(gameState, 4, 2, Direction.DOWN, 'Target'); // Face away to not shoot back
    
    // Give both Double-Barreled and High-Power Laser
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
    giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);

    await gameEngine.executeLasers(gameState);

    // Each shot goes through the blocker and hits the target
    expect(getDamageDealt(blocker)).toBe(2); // Hit by 2 shots from shooter
    expect(getDamageDealt(target)).toBe(2); // Hit by 2 shots through blocker
    expect(getDamageDealt(shooter)).toBe(0); // No one shooting back
  });

  it('should still be blocked by walls without High-Power Laser', async () => {
    const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
    const target = placeRobot(gameState, 4, 2, Direction.LEFT, 'Target');
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
    
    // Add wall between shooter and target
    if (!gameState.course.board.walls) {
      gameState.course.board.walls = [];
    }
    // Add wall to tiles for collision detection
    const tile = gameState.course.board.tiles[2][2];
    if (!tile.walls) tile.walls = [];
    tile.walls.push(Direction.RIGHT);

    await gameEngine.executeLasers(gameState);

    expect(getDamageDealt(target)).toBe(0); // Both shots blocked by wall
  });

  it('should hit same target twice with normal laser', async () => {
    const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
    const target1 = placeRobot(gameState, 3, 2, Direction.DOWN, 'Target1'); // Face away to avoid shooting back
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);

    await gameEngine.executeLasers(gameState);

    // Both shots hit the first target, can't continue past
    expect(getDamageDealt(target1)).toBe(2); // Hit twice by Double-Barreled
    expect(getDamageDealt(shooter)).toBe(0); // Target1 not facing shooter
  });

  it('should respect Power-Down Shield blocking per direction', async () => {
    const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
    const target = placeRobot(gameState, 4, 2, Direction.DOWN, 'Target'); // Face away to avoid shooting back
    giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
    giveOptionCard(target, OptionCardType.POWER_DOWN_SHIELD);
    target.powerState = PowerState.OFF;

    await gameEngine.executeLasers(gameState);

    // Power-Down Shield blocks 1 damage from west, second shot gets through
    expect(getDamageDealt(target)).toBe(1); // 1 blocked, 1 gets through
    expect(getDamageDealt(shooter)).toBe(0); // Target not facing shooter
  });
});
