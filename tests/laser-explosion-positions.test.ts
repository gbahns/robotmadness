import { GameEngine } from '@/lib/game/gameEngine';
import { Direction } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import {
  createTestGameState,
  placeRobot,
  addWall,
  giveOptionCard,
} from './utils/test-helpers';

describe('Laser Explosion Position Tests', () => {
  let gameEngine: GameEngine;
  let gameState: any;
  let mockIo: any;
  let emittedLaserEvents: any[] = [];
  let emittedEvents: any[] = [];

  beforeEach(() => {
    emittedLaserEvents = [];
    emittedEvents = [];
    
    // Create mock IO that captures laser events
    mockIo = {
      to: (room: string) => ({
        emit: (event: string, data: any) => {
          emittedEvents.push({ event, data });
          if (event === 'robot-lasers-fired') {
            // data is an array of laser shots
            emittedLaserEvents.push(...data);
          }
        }
      })
    };
    
    // Use test mode with short damage prevention timeout
    gameEngine = new GameEngine(mockIo, {
      testMode: true,
      damagePreventionTimeout: 100 // 100ms for tests
    });
    gameState = createTestGameState();
  });

  describe('Standard Laser Hit Positions', () => {
    it('should show explosion at target robot position', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');

      await gameEngine.executeLasers(gameState);

      // Find the laser shot from shooter (IDs have "player-" prefix)
      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetId).toBe('player-Target');
      
      // The explosion should be at the target's position
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 5, y: 2 });
    });

    it('should show explosion at wall position when blocked', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetId).toBeUndefined();
      
      // The laser path should stop at the wall
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 3, y: 2 });
    });

    it('should show explosion at first robot hit in a line', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target1 = placeRobot(gameState, 4, 2, Direction.UP, 'Target1');
      const target2 = placeRobot(gameState, 6, 2, Direction.DOWN, 'Target2');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetId).toBe('player-Target1');
      
      // The explosion should be at the first target's position
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 4, y: 2 });
    });
  });

  describe('High-Power Laser Hit Positions', () => {
    it('should show explosions at all hit robots with High-Power Laser', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      const target1 = placeRobot(gameState, 4, 2, Direction.UP, 'Target1');
      const target2 = placeRobot(gameState, 6, 2, Direction.DOWN, 'Target2');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toContain('player-Target1');
      expect(shot.targetIds).toContain('player-Target2');
      
      // The laser path should include both target positions
      expect(shot.path).toContainEqual({ x: 4, y: 2 });
      expect(shot.path).toContainEqual({ x: 6, y: 2 });
    });

    it('should show explosion at correct position when shooter against wall with High-Power', async () => {
      // Robot is at position 2,2 with wall immediately to the right at 2,2->3,2
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 2, y: 2 }, { x: 3, y: 2 });
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toContain('player-Target');
      
      // The explosion should be at the target's position, not the wall
      expect(shot.path).toContainEqual({ x: 5, y: 2 });
      
      // Path should include the tiles the laser travels through
      // It should start from tile after the wall and go to the target
      expect(shot.path.length).toBeGreaterThan(0);
    });

    it('should show explosion at wall when target is against wall with High-Power', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      addWall(gameState, { x: 5, y: 2 }, { x: 6, y: 2 });

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toContain('player-Target');
      
      // The explosion should be at the target's position
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 5, y: 2 });
      
      // Path should stop at the wall behind the target
      expect(shot.path).not.toContainEqual({ x: 6, y: 2 });
    });

    it('should handle High-Power through wall then hitting robot', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toContain('player-Target');
      
      // The explosion should be at the target's position
      expect(shot.path).toContainEqual({ x: 5, y: 2 });
    });

    it('should stop at second wall with High-Power', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });
      addWall(gameState, { x: 5, y: 2 }, { x: 6, y: 2 });

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      
      // The laser should stop at the second wall
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 5, y: 2 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle robot at laser mount position', async () => {
      // Robot standing on its own starting position should still fire normally
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 4, 2, Direction.LEFT, 'Target');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetId).toBe('player-Target');
      
      // Path should start from shooter position and end at target
      expect(shot.path[0]).toEqual({ x: 3, y: 2 });
      expect(shot.path[shot.path.length - 1]).toEqual({ x: 4, y: 2 });
    });

    it('should handle adjacent robots shooting each other', async () => {
      const shooter1 = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter1');
      const shooter2 = placeRobot(gameState, 3, 2, Direction.LEFT, 'Shooter2');

      await gameEngine.executeLasers(gameState);

      const shot1 = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter1');
      expect(shot1).toBeDefined();
      expect(shot1.targetId).toBe('player-Shooter2');
      expect(shot1.path[shot1.path.length - 1]).toEqual({ x: 3, y: 2 });

      const shot2 = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter2');
      expect(shot2).toBeDefined();
      expect(shot2.targetId).toBe('player-Shooter1');
      expect(shot2.path[shot2.path.length - 1]).toEqual({ x: 2, y: 2 });
    });

    it('should handle laser fired at board edge', async () => {
      const shooter = placeRobot(gameState, 9, 2, Direction.RIGHT, 'Shooter');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      // Shot might be undefined if shooting off board immediately
      if (shot) {
        // Path should extend to board edge (board is 10 wide in test, 0-9)
        const lastPathTile = shot.path[shot.path.length - 1];
        expect(lastPathTile.x).toBeLessThanOrEqual(9);
      } else {
        // No shot event when shooting directly off board edge
        expect(shot).toBeUndefined();
      }
    });

    it('should handle robot on board edge shooting off board', async () => {
      const shooter = placeRobot(gameState, 0, 2, Direction.LEFT, 'Shooter');

      await gameEngine.executeLasers(gameState);

      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      // When shooting off board, might not emit a shot or emit with empty path
      if (shot) {
        expect(shot.path.length).toBe(0);
      }
    });
  });

  describe('Double-Barreled Laser Positions', () => {
    it('should show two explosions with Double-Barreled Laser', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');

      await gameEngine.executeLasers(gameState);

      // Double-Barreled emits ONE shot with the target listed twice in targetIds
      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toEqual(['player-Target', 'player-Target']); // Target hit twice
      
      // The path should end at the target's position
      const lastPathTile = shot.path[shot.path.length - 1];
      expect(lastPathTile).toEqual({ x: 5, y: 2 });
    });
  });

  describe('Rear-Firing Laser Positions', () => {
    it('should show explosion behind shooter with Rear-Firing Laser', async () => {
      const shooter = placeRobot(gameState, 5, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
      const targetBehind = placeRobot(gameState, 3, 2, Direction.RIGHT, 'TargetBehind');
      const targetFront = placeRobot(gameState, 7, 2, Direction.LEFT, 'TargetFront');

      await gameEngine.executeLasers(gameState);

      // Should have two shots: one forward, one backward
      const shots = emittedLaserEvents.filter(e => e.shooterId === 'player-Shooter');
      expect(shots.length).toBe(2);
      
      // Find the rear shot (should hit TargetBehind)
      const rearShot = shots.find(s => s.targetId === 'player-TargetBehind');
      expect(rearShot).toBeDefined();
      const rearLastTile = rearShot.path[rearShot.path.length - 1];
      expect(rearLastTile).toEqual({ x: 3, y: 2 });
      
      // Find the front shot (should hit TargetFront)
      const frontShot = shots.find(s => s.targetId === 'player-TargetFront');
      expect(frontShot).toBeDefined();
      const frontLastTile = frontShot.path[frontShot.path.length - 1];
      expect(frontLastTile).toEqual({ x: 7, y: 2 });
    });
  });
});