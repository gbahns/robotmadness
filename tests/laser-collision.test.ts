import { GameEngine } from '@/lib/game/gameEngine';
import { Direction, CardType, ProgramCard } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import {
  createTestGameState,
  createMockIo,
  placeRobot,
  addWall,
  giveOptionCard,
  getDamageDealt,
  addBoardLaser,
  resetShieldUsage,
  setPlayerCards,
} from './utils/test-helpers';

describe('Laser Firing System', () => {
  let gameEngine: GameEngine;
  let gameState: any;
  let mockIo: any;

  beforeEach(() => {
    mockIo = createMockIo();
    // Use test mode with short damage prevention timeout
    gameEngine = new GameEngine(mockIo, {
      testMode: true,
      damagePreventionTimeout: 100 // 100ms for tests instead of 15 seconds
    });
    gameState = createTestGameState();
  });

  describe('Basic Laser Mechanics', () => {
    it('should damage robot in direct line', async () => {
      // Test 1: Simple Direct Hit
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1);
      expect(getDamageDealt(robotA)).toBe(1); // Both fire at each other
    });

    it('should not damage robot not in line', async () => {
      // Test 2: Laser Miss - robots firing in perpendicular directions
      const robotA = placeRobot(gameState, 2, 2, Direction.UP, 'RobotA');
      const robotB = placeRobot(gameState, 4, 3, Direction.DOWN, 'RobotB');  // Different row, so they don't hit each other

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(0);
      expect(getDamageDealt(robotA)).toBe(0);
    });

    it('should handle laser at edge of board', async () => {
      // Test 3: Edge of Board
      const robotA = placeRobot(gameState, 0, 2, Direction.LEFT, 'RobotA');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(0);
      // Should not crash
    });
  });

  describe('Wall Blocking Tests', () => {
    it('should block laser with wall', async () => {
      // Test 4: Wall Blocks Laser
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.LEFT, 'RobotB');
      addWall(gameState, { x: 2, y: 2 }, { x: 3, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(0);
      expect(getDamageDealt(robotB)).toBe(0);
    });

    it('should hit target with wall behind', async () => {
      // Test 5: Wall Behind Target
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.LEFT, 'RobotB');
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1);
      expect(getDamageDealt(robotA)).toBe(1);
    });
  });

  describe('Multiple Robot Tests', () => {
    it('should block laser with robot', async () => {
      // Test 6: Robot Blocks Laser
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.UP, 'RobotB');
      const robotC = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotC');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(2); // Hit by both A and C
      expect(getDamageDealt(robotC)).toBe(0); // Not hit
      expect(getDamageDealt(robotA)).toBe(0); // C's laser blocked by B
    });

    it('should handle line of robots', async () => {
      // Test 7: Line of Robots
      const robotA = placeRobot(gameState, 1, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotB');
      const robotC = placeRobot(gameState, 3, 2, Direction.RIGHT, 'RobotC');
      const robotD = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotD');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1); // Hit by A
      expect(getDamageDealt(robotC)).toBe(2); // Hit by B and D
      expect(getDamageDealt(robotD)).toBe(1); // Hit by C
      expect(getDamageDealt(robotA)).toBe(0); // Nothing behind
    });
  });

  describe('High-Power Laser Tests', () => {
    it('should shoot through wall with High-Power Laser', async () => {
      // Test 8: High-Power Through Wall
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
      giveOptionCard(robotA, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 2, y: 2 }, { x: 3, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1); // Hit through wall
      expect(getDamageDealt(robotA)).toBe(0); // B's laser blocked by wall
    });

    it('should shoot through wall when against it', async () => {
      // Test 9: High-Power Against Wall
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.LEFT, 'RobotB');
      giveOptionCard(robotA, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 2, y: 2 }, { x: 3, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1); // Hit through wall
      expect(getDamageDealt(robotA)).toBe(0); // B's laser blocked by wall
    });

    it('should shoot through robot with High-Power Laser', async () => {
      // Test 10: High-Power Through Robot
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.UP, 'RobotB');
      const robotC = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotC');
      giveOptionCard(robotA, OptionCardType.HIGH_POWER_LASER);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(2); // Hit by A and C
      expect(getDamageDealt(robotC)).toBe(1); // Hit by A through B
      expect(getDamageDealt(robotA)).toBe(0); // C's laser blocked by B
    });

    it('should not shoot through two walls', async () => {
      // Test 11: High-Power Through Two Walls
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 5, 2, Direction.LEFT, 'RobotB');
      giveOptionCard(robotA, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 2, y: 2 }, { x: 3, y: 2 });
      addWall(gameState, { x: 4, y: 2 }, { x: 5, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(0); // Blocked by second wall
    });

    it('should not shoot through robot then wall', async () => {
      // Test 12: High-Power Through Robot Then Wall
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.UP, 'RobotB');
      const robotC = placeRobot(gameState, 5, 2, Direction.LEFT, 'RobotC');
      giveOptionCard(robotA, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 4, y: 2 }, { x: 5, y: 2 });

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1); // Hit by A
      expect(getDamageDealt(robotC)).toBe(0); // Blocked by wall (already went through B)
    });
  });

  describe('Shield Option Card Tests', () => {
    it('should block front damage with Shield', async () => {
      // Test 13: Shield Blocks Front Damage
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
      giveOptionCard(robotB, OptionCardType.SHIELD);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(0); // Shield blocks A's laser
      expect(getDamageDealt(robotA)).toBe(1); // B still fires
    });

    it('should only block first shot with Shield', async () => {
      // Test 14: Shield Already Used
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
      const robotC = placeRobot(gameState, 4, 3, Direction.UP, 'RobotC');
      const shield = giveOptionCard(robotB, OptionCardType.SHIELD);

      // Simulate shield already used
      shield.usedThisRegister = true;

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(2); // Shield already used, hit by both A and C
    }); // Test should run quickly with test mode

    it('should not block damage from behind with Shield', async () => {
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotB'); // Facing away
      giveOptionCard(robotB, OptionCardType.SHIELD);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(1);
    });
  });

  describe('Board Laser Tests', () => {
    it('should damage robot with board laser', async () => {
      // Test 16: Board Laser Hit
      const robotA = placeRobot(gameState, 5, 3, Direction.UP, 'RobotA');
      addBoardLaser(gameState, 5, 5, Direction.UP, 1);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(1);
    });

    it('should only hit first robot with board laser', async () => {
      // Test 17: Board Laser Through Multiple
      const robotA = placeRobot(gameState, 5, 3, Direction.UP, 'RobotA');
      const robotB = placeRobot(gameState, 5, 2, Direction.DOWN, 'RobotB');
      addBoardLaser(gameState, 5, 5, Direction.UP, 1);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(2); // Hit by board laser and B's laser
      expect(getDamageDealt(robotB)).toBe(1); // Hit by A's laser (board laser blocked by A)
    });

    it('should damage robot on laser mount', async () => {
      // Test 18: Robot on Laser Mount
      const robotA = placeRobot(gameState, 5, 5, Direction.UP, 'RobotA');
      addBoardLaser(gameState, 5, 5, Direction.UP, 1);

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should not hit diagonal robot', async () => {
      // Test 19: Diagonal Non-Alignment
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 3, Direction.LEFT, 'RobotB');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(0);
      expect(getDamageDealt(robotA)).toBe(0);
    });

    it('should not self-damage', async () => {
      // Test 20: Self Damage Prevention
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(0);
    });

    it('should not fire laser when dead', async () => {
      // Test 21: Dead Robot No Fire
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
      robotA.lives = 0;
      robotA.isDead = true;

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotB)).toBe(0); // A can't fire (dead)
      expect(getDamageDealt(robotA)).toBe(0); // Dead robots aren't valid targets
    });

    it('should handle simultaneous lasers', async () => {
      // Test 22: Simultaneous Lasers
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');

      await gameEngine.executeLasers(gameState);

      expect(getDamageDealt(robotA)).toBe(1);
      expect(getDamageDealt(robotB)).toBe(1);
    });
  });

  describe('Collision Detection Tests', () => {
    it('should prevent pushing through walls', async () => {
      // Test 23: Push Into Wall
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.RIGHT, 'RobotB');
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });

      // Set up movement cards
      setPlayerCards(robotA, [
        { type: CardType.MOVE_1, priority: 100 } as ProgramCard,
      ]);

      await gameEngine.executeRegister(gameState, 0);

      expect(robotA.position).toEqual({ x: 2, y: 2 }); // Didn't move
      expect(robotB.position).toEqual({ x: 3, y: 2 }); // Didn't move
    });

    it('should destroy robot pushed off board', async () => {
      // Test 24: Push Off Board
      const robotA = placeRobot(gameState, 0, 2, Direction.LEFT, 'RobotA');
      const robotB = placeRobot(gameState, 1, 2, Direction.LEFT, 'RobotB');

      setPlayerCards(robotB, [
        { type: CardType.MOVE_1, priority: 100 } as ProgramCard,
      ]);

      await gameEngine.executeRegister(gameState, 0);

      expect(robotA.isDead).toBe(true); // Pushed off board
      expect(robotB.position).toEqual({ x: 0, y: 2 }); // Moved forward
    });

    it('should handle chain push success', async () => {
      // Test 25: Chain Push Success
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.RIGHT, 'RobotB');
      const robotC = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotC');

      setPlayerCards(robotA, [
        { type: CardType.MOVE_1, priority: 100 } as ProgramCard,
      ]);

      await gameEngine.executeRegister(gameState, 0);

      expect(robotA.position).toEqual({ x: 3, y: 2 });
      expect(robotB.position).toEqual({ x: 4, y: 2 });
      expect(robotC.position).toEqual({ x: 5, y: 2 });
    });

    it('should handle chain push blocked', async () => {
      // Test 26: Chain Push Blocked
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 3, 2, Direction.RIGHT, 'RobotB');
      const robotC = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotC');
      addWall(gameState, { x: 4, y: 2 }, { x: 5, y: 2 });

      setPlayerCards(robotA, [
        { type: CardType.MOVE_1, priority: 100 } as ProgramCard,
      ]);

      await gameEngine.executeRegister(gameState, 0);

      expect(robotA.position).toEqual({ x: 2, y: 2 }); // Blocked
      expect(robotB.position).toEqual({ x: 3, y: 2 }); // Blocked
      expect(robotC.position).toEqual({ x: 4, y: 2 }); // Blocked
    });
  });

  describe('Performance Tests', () => {
    it('should trace laser across large board quickly', async () => {
      // Test 28: Large Board Laser Trace
      const largeGameState = createTestGameState({ width: 16, height: 12 });
      const robotA = placeRobot(largeGameState, 0, 6, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(largeGameState, 15, 6, Direction.LEFT, 'RobotB');

      const startTime = Date.now();
      await gameEngine.executeLasers(largeGameState);
      const endTime = Date.now();

      //expect(endTime - startTime).toBeLessThan(10); // Should be very fast - this is incorrect because there's a 600ms animation
      expect(endTime - startTime).toBeLessThan(625); // Should be very fast other than the animation delay
      expect(getDamageDealt(robotB)).toBe(1);
    });

    it('should handle multiple simultaneous lasers', async () => {
      // Test 29: Multiple Simultaneous Lasers
      const robots = [];
      for (let i = 0; i < 8; i++) {
        robots.push(placeRobot(gameState, i, i, Direction.RIGHT, `Robot${i}`));
      }

      const startTime = Date.now();
      await gameEngine.executeLasers(gameState);
      const endTime = Date.now();

      //expect(endTime - startTime).toBeLessThan(50); // Should handle 8 lasers quickly - this is incorrect because there's a 600ms animation
      expect(endTime - startTime).toBeLessThan(650); // Should handle 8 lasers quickly other than the animation delay
    });
  });
});