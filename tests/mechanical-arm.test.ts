import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { 
  createTestGameState, 
  placeRobot, 
  giveOptionCard,
  addTile
} from './utils/test-helpers';
import { Direction, TileType, GamePhase } from '@/lib/game/types';
import { OptionCardType, createOptionCard } from '@/lib/game/optionCards';
import { Server } from 'socket.io';

describe('Mechanical Arm Option Card', () => {
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

  it('should allow touching flag from 1 space away orthogonally', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    // Place flag at (4, 3) - 1 space to the right
    gameState.course.definition.checkpoints = [{ position: { x: 4, y: 3 }, number: 1 }];
    
    // Robot should be able to touch flag from adjacent position
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.checkpointsVisited).toBe(1);
  });

  it('should allow touching flag from 1 space away diagonally', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    // Place flag at (4, 4) - 1 space diagonally
    gameState.course.definition.checkpoints = [{ position: { x: 4, y: 4 }, number: 1 }];
    
    // Robot should be able to touch flag from diagonal position
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.checkpointsVisited).toBe(1);
  });

  it('should NOT allow touching flag through a wall', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    // Place flag at (4, 3) with wall between
    gameState.course.definition.checkpoints = [{ position: { x: 4, y: 3 }, number: 1 }];
    
    // Add wall between robot and flag
    const robotTile = gameState.course.board.tiles[3][3];
    robotTile.walls = [Direction.RIGHT];
    
    // Robot should NOT be able to touch flag through wall
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.checkpointsVisited).toBe(0);
  });

  it('should allow repair from 1 space away', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    robot.damage = 5;
    
    // Place repair site at (3, 4)
    addTile(gameState, 3, 4, TileType.REPAIR);
    
    // Set phase to after register 5
    gameState.currentRegister = 5;
    
    // Robot should be able to repair from adjacent position
    await (gameEngine as any).executeRepairs(gameState);
    
    expect(robot.damage).toBe(4); // Repaired 1 damage
  });

  it('should allow getting option card from 1 space away', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    // Place option site at (2, 3)
    addTile(gameState, 2, 3, TileType.OPTION);
    
    // Set phase to after register 5
    gameState.currentRegister = 5;
    
    // Initialize option deck
    gameState.optionDeck = [createOptionCard(OptionCardType.SHIELD)];
    
    const initialOptionCount = robot.optionCards.length;
    
    // Robot should be able to get option from adjacent position
    await (gameEngine as any).executeRepairs(gameState);
    
    expect(robot.optionCards.length).toBe(initialOptionCount + 1);
  });

  it('should prioritize next flag over repair/option sites', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    robot.damage = 5;
    
    // Place next flag at (4, 3)
    gameState.course.definition.checkpoints = [{ position: { x: 4, y: 3 }, number: 1 }];
    
    // Place repair site at (3, 4)
    addTile(gameState, 3, 4, TileType.REPAIR);
    
    // Place option site at (2, 3)
    addTile(gameState, 2, 3, TileType.OPTION);
    
    // Set phase to after register 5 (so repair/option would work)
    gameState.currentRegister = 5;
    
    // Robot should touch the flag (priority)
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.checkpointsVisited).toBe(1); // Flag touched
    
    // Now check repair/option (after flag was handled, repair site is still used)
    await (gameEngine as any).executeRepairs(gameState);
    expect(robot.damage).toBe(4); // Repaired from repair site with Mechanical Arm
  });

  it('should prioritize option over repair when no next flag', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    robot.damage = 5;
    robot.checkpointsVisited = 1; // Already visited flag 1
    
    // Place wrong flag at (4, 3) (not the next one)
    gameState.course.definition.checkpoints = [
      { position: { x: 4, y: 3 }, number: 1 }, 
      { position: { x: 10, y: 10 }, number: 2 }
    ];
    
    // Place repair site at (3, 4)
    addTile(gameState, 3, 4, TileType.REPAIR);
    
    // Place option site at (2, 3)
    addTile(gameState, 2, 3, TileType.OPTION);
    gameState.optionDeck = [createOptionCard(OptionCardType.SHIELD)];
    
    // Set phase to after register 5
    gameState.currentRegister = 5;
    
    const initialOptionCount = robot.optionCards.length;
    
    // Robot should touch option site (priority over repair)
    await (gameEngine as any).executeRepairs(gameState);
    
    expect(robot.optionCards.length).toBe(initialOptionCount + 1); // Got option
    expect(robot.damage).toBe(4); // Also got 1 repair from option site
  });

  it('should get effects from both standing tile and adjacent tile', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    robot.damage = 5;
    
    // Robot is standing on repair site
    addTile(gameState, 3, 3, TileType.REPAIR);
    
    // Option site adjacent
    addTile(gameState, 4, 3, TileType.OPTION);
    gameState.optionDeck = [createOptionCard(OptionCardType.SHIELD)];
    
    // Set phase to after register 5
    gameState.currentRegister = 5;
    
    const initialOptionCount = robot.optionCards.length;
    
    // Robot should get both effects
    await (gameEngine as any).executeRepairs(gameState);
    
    expect(robot.damage).toBe(3); // Repaired from standing tile + 1 from option site
    expect(robot.optionCards.length).toBe(initialOptionCount + 1); // Got option from adjacent
  });

  it('should NOT consider repair/option sites before register 5', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    robot.damage = 5;
    
    // Place repair site adjacent
    addTile(gameState, 3, 4, TileType.REPAIR);
    
    // Set phase to register 3 (before 5)
    gameState.currentRegister = 3;
    
    // executeRepairs is only called after register 5, so this wouldn't normally happen
    // But flags can still be touched anytime
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.damage).toBe(5); // Not repaired (repairs only after register 5)
  });

  it('should be a passive ability that is always active', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    const card = robot.optionCards.find(c => c.type === OptionCardType.MECHANICAL_ARM);
    expect(card?.passive).toBe(true);
  });

  it('should work with multiple adjacent sites of same type', async () => {
    const robot = placeRobot(gameState, 3, 3, Direction.UP, 'TestRobot');
    giveOptionCard(robot, OptionCardType.MECHANICAL_ARM);
    
    // Place flags at multiple adjacent positions (only next one should count)
    gameState.course.definition.checkpoints = [
      { position: { x: 3, y: 4 }, number: 1 },  // Next flag
      { position: { x: 4, y: 3 }, number: 2 },  // Not next
      { position: { x: 2, y: 3 }, number: 3 }   // Not next
    ];
    
    // Robot should only touch the next flag (flag 1)
    await (gameEngine as any).checkCheckpoints(gameState);
    
    expect(robot.checkpointsVisited).toBe(1);
  });
});