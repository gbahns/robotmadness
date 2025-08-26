import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { Direction } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import {
  createTestGameState,
  placeRobot,
  addWall,
  giveOptionCard,
  getDamageDealt,
} from './utils/test-helpers';

describe('Comprehensive Laser Beam Tests', () => {
  let gameEngine: GameEngine;
  let gameState: ServerGameState;
  let mockIo: any;
  let emittedLaserEvents: any[] = [];

  beforeEach(() => {
    emittedLaserEvents = [];
    
    mockIo = {
      to: (room: string) => ({
        emit: (event: string, data: any) => {
          if (event === 'robot-lasers-fired') {
            emittedLaserEvents.push(...data);
          }
        }
      })
    };
    
    gameEngine = new GameEngine(mockIo, {
      testMode: true,
      damagePreventionTimeout: 100
    });
    gameState = createTestGameState();
  });

  describe('Beam Start Position Tests', () => {
    it('robot laser should start from front of shooter tile', () => {
      const shooter = placeRobot(gameState, 3, 3, Direction.RIGHT, 'Shooter');
      
      // Call traceLaser directly to test the beam properties
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.startPosition).toEqual({ x: 3, y: 3 });
      expect(beam.startFromBack).toBe(false); // Robot laser starts from front
      expect(beam.direction).toBe(Direction.RIGHT);
    });

    it('board laser should start from back of mount tile', () => {
      // Add a board laser
      if (!gameState.course.board.lasers) {
        gameState.course.board.lasers = [];
      }
      gameState.course.board.lasers.push({
        position: { x: 5, y: 5 },
        direction: Direction.UP,
        damage: 1
      });
      
      // Call traceLaser directly for board laser
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        5, 
        5, 
        Direction.UP, 
        1, 
        undefined, // No shooter name for board laser
        { x: 5, y: 5 }
      );
      
      expect(beam.startPosition).toEqual({ x: 5, y: 5 });
      expect(beam.startFromBack).toBe(true); // Board laser starts from back
      expect(beam.direction).toBe(Direction.UP);
    });

    it('board laser should hit robot on same tile as laser mount', () => {
      const victim = placeRobot(gameState, 5, 5, Direction.DOWN, 'Victim');
      
      // Board laser at same position
      if (!gameState.course.board.lasers) {
        gameState.course.board.lasers = [];
      }
      gameState.course.board.lasers.push({
        position: { x: 5, y: 5 },
        direction: Direction.UP,
        damage: 1
      });
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        5, 
        5, 
        Direction.UP, 
        1, 
        undefined,
        { x: 5, y: 5 }
      );
      
      expect(beam.hits.length).toBe(1);
      expect(beam.hits[0].player.name).toBe('Victim');
      expect(beam.endPosition).toEqual({ x: 5, y: 5 });
      expect(beam.endAtFront).toBe(true); // Stopped at front of tile by robot
      expect(beam.blockedBy).toBe('robot');
    });

    it('robot laser should NOT hit shooter on same tile', () => {
      const shooter = placeRobot(gameState, 3, 3, Direction.RIGHT, 'Shooter');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      // Should not hit itself
      expect(beam.hits.length).toBe(0);
      expect(beam.path.length).toBeGreaterThan(0);
    });
  });

  describe('Beam End Position Tests', () => {
    it('should end at front of tile when hitting robot', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(1);
      expect(beam.hits[0].player.name).toBe('Target');
      expect(beam.endPosition).toEqual({ x: 5, y: 2 });
      expect(beam.endAtFront).toBe(true); // Stopped at front of tile
      expect(beam.blockedBy).toBe('robot');
    });

    it('should end at back of tile when hitting wall', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      addWall(gameState, { x: 4, y: 2 }, { x: 5, y: 2 });
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(0);
      expect(beam.endPosition).toEqual({ x: 4, y: 2 });
      expect(beam.endAtFront).toBe(false); // Stopped at back of tile by wall
      expect(beam.blockedBy).toBe('wall');
      expect(beam.path).toContainEqual({ x: 3, y: 2 });
      expect(beam.path).toContainEqual({ x: 4, y: 2 });
      expect(beam.path).not.toContainEqual({ x: 5, y: 2 }); // Doesn't reach past wall
    });

    it('should end at back of tile when hitting board edge', () => {
      const shooter = placeRobot(gameState, 8, 5, Direction.RIGHT, 'Shooter');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(0);
      expect(beam.endPosition).toEqual({ x: 9, y: 5 }); // Last tile on board
      expect(beam.endAtFront).toBe(false); // Stopped at back of tile by edge
      expect(beam.blockedBy).toBe('edge');
    });
  });

  describe('High-Power Laser Beam Tests', () => {
    it('should pass through wall but stop at correct position', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(1);
      expect(beam.hits[0].player.name).toBe('Target');
      expect(beam.path).toContainEqual({ x: 3, y: 2 });
      expect(beam.path).toContainEqual({ x: 4, y: 2 }); // Goes through wall
      expect(beam.path).toContainEqual({ x: 5, y: 2 });
      expect(beam.endPosition).toEqual({ x: 5, y: 2 });
      expect(beam.endAtFront).toBe(true); // Stopped at front of tile by robot
    });

    it('should pass through robot and continue', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      const target1 = placeRobot(gameState, 4, 2, Direction.LEFT, 'Target1');
      const target2 = placeRobot(gameState, 6, 2, Direction.LEFT, 'Target2');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(2);
      expect(beam.hits[0].player.name).toBe('Target1');
      expect(beam.hits[1].player.name).toBe('Target2');
      expect(beam.path).toContainEqual({ x: 4, y: 2 }); // Goes through first robot
      expect(beam.path).toContainEqual({ x: 5, y: 2 });
      expect(beam.path).toContainEqual({ x: 6, y: 2 });
      expect(beam.endPosition).toEqual({ x: 6, y: 2 });
      expect(beam.endAtFront).toBe(true); // Stopped at front of second robot
    });

    it('should stop at second wall', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      addWall(gameState, { x: 3, y: 2 }, { x: 4, y: 2 });
      addWall(gameState, { x: 5, y: 2 }, { x: 6, y: 2 });
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.hits.length).toBe(0);
      expect(beam.path).toContainEqual({ x: 3, y: 2 });
      expect(beam.path).toContainEqual({ x: 4, y: 2 }); // Through first wall
      expect(beam.path).toContainEqual({ x: 5, y: 2 });
      expect(beam.path).not.toContainEqual({ x: 6, y: 2 }); // Stopped by second wall
      expect(beam.endPosition).toEqual({ x: 5, y: 2 });
      expect(beam.endAtFront).toBe(false); // Stopped at back of tile by wall
      expect(beam.blockedBy).toBe('wall');
    });
  });

  describe('Rear-Firing Laser Beam Tests', () => {
    it('should have correct start and end positions for rear laser', () => {
      const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
      const targetBehind = placeRobot(gameState, 3, 5, Direction.UP, 'TargetBehind');
      
      // Test rear laser (opposite direction)
      const oppositeDirection = (shooter.direction + 2) % 4 as Direction;
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        oppositeDirection, 
        1, 
        'Shooter', 
        shooter.position,
        false // Rear laser doesn't benefit from High-Power
      );
      
      expect(beam.startPosition).toEqual({ x: 5, y: 5 });
      expect(beam.startFromBack).toBe(false); // Still starts from front (of the rear side)
      expect(beam.direction).toBe(Direction.LEFT); // Opposite of RIGHT
      expect(beam.hits.length).toBe(1);
      expect(beam.hits[0].player.name).toBe('TargetBehind');
      expect(beam.endPosition).toEqual({ x: 3, y: 5 });
      expect(beam.endAtFront).toBe(true); // Stopped by robot
    });
  });

  describe('Path Validation Tests', () => {
    it('should have continuous path from start to end', () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      // Path should be continuous
      expect(beam.path).toEqual([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 }
      ]);
      
      // Validate each step is exactly one tile apart
      for (let i = 1; i < beam.path.length; i++) {
        const prev = beam.path[i - 1];
        const curr = beam.path[i];
        const dx = Math.abs(curr.x - prev.x);
        const dy = Math.abs(curr.y - prev.y);
        expect(dx + dy).toBe(1); // Manhattan distance of 1
      }
    });

    it('should have empty path when shooting directly off board', () => {
      const shooter = placeRobot(gameState, 0, 5, Direction.LEFT, 'Shooter');
      
      const beam = (gameEngine as any).traceLaser(
        gameState, 
        shooter.position.x, 
        shooter.position.y, 
        shooter.direction, 
        1, 
        'Shooter', 
        shooter.position
      );
      
      expect(beam.path.length).toBe(0);
      expect(beam.endPosition).toEqual({ x: 0, y: 5 });
      expect(beam.blockedBy).toBe('edge');
    });
  });

  describe('Integration with Visual Rendering', () => {
    it('should emit correct laser path for standard shot', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      await gameEngine.executeLasers(gameState);
      
      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetId).toBe('player-Target');
      expect(shot.path).toEqual([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 }
      ]);
    });

    it('should emit correct paths for Double-Barreled Laser', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      await gameEngine.executeLasers(gameState);
      
      const shot = emittedLaserEvents.find(e => e.shooterId === 'player-Shooter');
      expect(shot).toBeDefined();
      expect(shot.targetIds).toEqual(['player-Target', 'player-Target']); // Hit twice
      expect(shot.path).toEqual([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 }
      ]);
    });

    it('should emit two separate shots for Rear-Firing Laser', async () => {
      const shooter = placeRobot(gameState, 5, 5, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.REAR_FIRING_LASER);
      const targetFront = placeRobot(gameState, 7, 5, Direction.DOWN, 'TargetFront');
      const targetBehind = placeRobot(gameState, 3, 5, Direction.UP, 'TargetBehind');
      
      await gameEngine.executeLasers(gameState);
      
      const shots = emittedLaserEvents.filter(e => e.shooterId === 'player-Shooter');
      expect(shots.length).toBe(2);
      
      // Front shot
      const frontShot = shots.find(s => s.targetId === 'player-TargetFront');
      expect(frontShot).toBeDefined();
      expect(frontShot.path).toContainEqual({ x: 6, y: 5 });
      expect(frontShot.path).toContainEqual({ x: 7, y: 5 });
      
      // Rear shot
      const rearShot = shots.find(s => s.targetId === 'player-TargetBehind');
      expect(rearShot).toBeDefined();
      expect(rearShot.path).toContainEqual({ x: 4, y: 5 });
      expect(rearShot.path).toContainEqual({ x: 3, y: 5 });
    });
  });

  describe('Damage Validation Tests', () => {
    it('should match hits with actual damage dealt', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      const target = placeRobot(gameState, 5, 2, Direction.LEFT, 'Target');
      
      await gameEngine.executeLasers(gameState);
      
      expect(getDamageDealt(target)).toBe(1);
      expect(getDamageDealt(shooter)).toBe(1); // Hit back by target
    });

    it('should deal correct damage with High-Power through multiple targets', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.HIGH_POWER_LASER);
      const target1 = placeRobot(gameState, 4, 2, Direction.UP, 'Target1');
      const target2 = placeRobot(gameState, 6, 2, Direction.DOWN, 'Target2');
      
      await gameEngine.executeLasers(gameState);
      
      expect(getDamageDealt(target1)).toBe(1);
      expect(getDamageDealt(target2)).toBe(1);
      expect(getDamageDealt(shooter)).toBe(0);
    });

    it('should deal correct damage with Double-Barreled', async () => {
      const shooter = placeRobot(gameState, 2, 2, Direction.RIGHT, 'Shooter');
      giveOptionCard(shooter, OptionCardType.DOUBLE_BARRELED_LASER);
      const target = placeRobot(gameState, 5, 2, Direction.UP, 'Target'); // Facing away
      
      await gameEngine.executeLasers(gameState);
      
      expect(getDamageDealt(target)).toBe(2); // Hit twice
      expect(getDamageDealt(shooter)).toBe(0);
    });
  });
});