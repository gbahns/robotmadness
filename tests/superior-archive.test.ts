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

describe('Superior Archive Option Card', () => {
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

  it('should apply 2 damage when respawning without Superior Archive', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    
    // Set archive position
    robot.archiveMarker = { x: 5, y: 5 };
    
    // Destroy the robot
    robot.isDead = true;
    robot.position = { x: -1, y: -1 };
    robot.damage = 0;
    robot.awaitingRespawn = true;
    
    // Respawn the robot
    (gameEngine as any).performRespawn(gameState, robot.id, Direction.DOWN);
    
    // Should have 2 damage after respawn (normal behavior)
    expect(robot.damage).toBe(2);
    expect(robot.isDead).toBe(false);
    expect(robot.position).toEqual({ x: 5, y: 5 });
  });

  it('should prevent 2 damage when respawning with Superior Archive', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.SUPERIOR_ARCHIVE);
    
    // Set archive position
    robot.archiveMarker = { x: 5, y: 5 };
    
    // Destroy the robot
    robot.isDead = true;
    robot.position = { x: -1, y: -1 };
    robot.damage = 0;
    robot.awaitingRespawn = true;
    
    // Respawn the robot
    (gameEngine as any).performRespawn(gameState, robot.id, Direction.DOWN);
    
    // Should have NO damage after respawn (Superior Archive prevents it)
    expect(robot.damage).toBe(0);
    expect(robot.isDead).toBe(false);
    expect(robot.position).toEqual({ x: 5, y: 5 });
    expect(robot.direction).toBe(Direction.DOWN);
  });

  it('should still work after multiple respawns', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.SUPERIOR_ARCHIVE);
    
    // Set archive position
    robot.archiveMarker = { x: 5, y: 5 };
    
    // First death and respawn
    robot.isDead = true;
    robot.position = { x: -1, y: -1 };
    robot.damage = 0;
    robot.awaitingRespawn = true;
    (gameEngine as any).performRespawn(gameState, robot.id, Direction.RIGHT);
    
    expect(robot.damage).toBe(0); // No damage from first respawn
    
    // Second death and respawn
    robot.isDead = true;
    robot.position = { x: -1, y: -1 };
    robot.damage = 0;
    robot.awaitingRespawn = true;
    (gameEngine as any).performRespawn(gameState, robot.id, Direction.LEFT);
    
    expect(robot.damage).toBe(0); // No damage from second respawn either
    expect(robot.direction).toBe(Direction.LEFT);
  });

  it('should be a passive ability that is always active', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.SUPERIOR_ARCHIVE);
    
    // Superior Archive is passive - no activation required
    const card = robot.optionCards.find(c => c.type === OptionCardType.SUPERIOR_ARCHIVE);
    expect(card?.passive).toBe(true);
  });
});