import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { 
  createTestGameState, 
  placeRobot, 
  giveOptionCard,
  getDamageDealt
} from './utils/test-helpers';
import { Direction, CardType } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import { Server } from 'socket.io';

describe('Ramming Gear Option Card', () => {
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

  it('should deal damage when actively pushing another robot', async () => {
    const pusher = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Pusher');
    const target = placeRobot(gameState, 3, 2, Direction.UP, 'Target');
    giveOptionCard(pusher, OptionCardType.RAMMING_GEAR);
    
    // Pusher moves forward and pushes target
    await (gameEngine as any).moveRobot(gameState, pusher, 1);
    
    // Target should take 1 damage from being pushed by robot with Ramming Gear
    expect(getDamageDealt(target)).toBe(1);
    expect(getDamageDealt(pusher)).toBe(0); // Pusher takes no damage
    expect(target.position.x).toBe(4); // Target was pushed
  });

  it('should NOT deal damage when target has Ramming Gear but is being pushed', async () => {
    const pusher = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Pusher');
    const target = placeRobot(gameState, 3, 2, Direction.UP, 'Target');
    giveOptionCard(target, OptionCardType.RAMMING_GEAR); // Target has ramming gear
    
    // Pusher moves forward and pushes target
    await (gameEngine as any).moveRobot(gameState, pusher, 1);
    
    // No damage - target's Ramming Gear only works when actively pushing
    expect(getDamageDealt(pusher)).toBe(0);
    expect(getDamageDealt(target)).toBe(0);
    expect(target.position.x).toBe(4); // Target was still pushed
  });

  it('should only deal damage from actively moving robot with Ramming Gear', async () => {
    const pusher = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Pusher');
    const target = placeRobot(gameState, 3, 2, Direction.UP, 'Target');
    giveOptionCard(pusher, OptionCardType.RAMMING_GEAR);
    giveOptionCard(target, OptionCardType.RAMMING_GEAR);
    
    // Pusher moves forward and pushes target
    await (gameEngine as any).moveRobot(gameState, pusher, 1);
    
    // Only target takes damage (from pusher's active movement with Ramming Gear)
    expect(getDamageDealt(pusher)).toBe(0);
    expect(getDamageDealt(target)).toBe(1);
    expect(target.position.x).toBe(4); // Target was pushed
  });

  it('should only damage direct target in chain pushes', async () => {
    const pusher = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Pusher');
    const middle = placeRobot(gameState, 3, 2, Direction.UP, 'Middle');
    const end = placeRobot(gameState, 4, 2, Direction.UP, 'End');
    giveOptionCard(pusher, OptionCardType.RAMMING_GEAR);
    
    // Pusher moves forward and pushes middle, which pushes end
    await (gameEngine as any).moveRobot(gameState, pusher, 1);
    
    // Only middle takes damage (directly pushed by pusher with Ramming Gear)
    expect(getDamageDealt(middle)).toBe(1);
    // End takes no damage (chain pushed, not actively pushed)
    expect(getDamageDealt(end)).toBe(0);
    
    // Check positions
    expect(pusher.position.x).toBe(3);
    expect(middle.position.x).toBe(4);
    expect(end.position.x).toBe(5);
  });

  it('should work when directly calling pushRobot with active movement', async () => {
    const robotWithGear = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotWithGear');
    const otherRobot = placeRobot(gameState, 3, 2, Direction.UP, 'OtherRobot');
    giveOptionCard(robotWithGear, OptionCardType.RAMMING_GEAR);
    
    // Robot with gear actively pushes other robot (simulating active movement)
    await (gameEngine as any).pushRobot(gameState, otherRobot, Direction.RIGHT, robotWithGear, true);
    
    // Other robot should take damage from being pushed by robot with ramming gear
    expect(getDamageDealt(otherRobot)).toBe(1);
    expect(otherRobot.position.x).toBe(4);
  });

  it('should not deal damage when push is blocked', async () => {
    const pusher = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Pusher');
    const target = placeRobot(gameState, 3, 2, Direction.UP, 'Target');
    const blocker = placeRobot(gameState, 4, 2, Direction.UP, 'Blocker');
    giveOptionCard(pusher, OptionCardType.RAMMING_GEAR);
    
    // Add wall behind blocker to prevent chain push
    const tile = gameState.course.board.tiles[4][2];
    if (!tile.walls) tile.walls = [];
    tile.walls.push(Direction.RIGHT);
    
    // Pusher tries to move forward but push is blocked
    await (gameEngine as any).moveRobot(gameState, pusher, CardType.MOVE_1, 1);
    
    // No one should take damage because push didn't happen
    expect(getDamageDealt(target)).toBe(0);
    expect(getDamageDealt(blocker)).toBe(0);
    expect(getDamageDealt(pusher)).toBe(0);
    
    // Positions should not change
    expect(pusher.position.x).toBe(2);
    expect(target.position.x).toBe(3);
    expect(blocker.position.x).toBe(4);
  });

  it('should NOT deal damage when pushed by conveyor or other passive movement', async () => {
    const robotWithGear = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotWithGear');
    const otherRobot = placeRobot(gameState, 3, 2, Direction.UP, 'OtherRobot');
    giveOptionCard(robotWithGear, OptionCardType.RAMMING_GEAR);
    
    // Simulate conveyor push (no isActiveMovement flag)
    await (gameEngine as any).pushRobot(gameState, otherRobot, Direction.RIGHT, robotWithGear, false);
    
    // No damage should be dealt (not active movement)
    expect(getDamageDealt(otherRobot)).toBe(0);
    expect(otherRobot.position.x).toBe(4); // But still pushed
  });

  it('should be a passive ability that is always active', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.RAMMING_GEAR);
    
    const card = robot.optionCards.find(c => c.type === OptionCardType.RAMMING_GEAR);
    expect(card?.passive).toBe(true);
  });
});