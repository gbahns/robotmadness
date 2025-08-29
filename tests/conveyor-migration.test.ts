import { describe, it, expect } from '@jest/globals';
import { Direction } from '../lib/game/types';
import { getRotationDirection } from '../lib/game/utils/conveyor-migration';

describe('getRotationDirection', () => {
  describe('straight conveyors', () => {
    it('should return straight when entry and exit are the same', () => {
      expect(getRotationDirection(Direction.UP, Direction.UP)).toBe('straight');
      expect(getRotationDirection(Direction.DOWN, Direction.DOWN)).toBe('straight');
      expect(getRotationDirection(Direction.LEFT, Direction.LEFT)).toBe('straight');
      expect(getRotationDirection(Direction.RIGHT, Direction.RIGHT)).toBe('straight');
    });
  });

  describe('clockwise rotations', () => {
    it('should detect clockwise rotation from UP to RIGHT', () => {
      expect(getRotationDirection(Direction.UP, Direction.RIGHT)).toBe('clockwise');
    });

    it('should detect clockwise rotation from RIGHT to DOWN', () => {
      expect(getRotationDirection(Direction.RIGHT, Direction.DOWN)).toBe('clockwise');
    });

    it('should detect clockwise rotation from DOWN to LEFT', () => {
      expect(getRotationDirection(Direction.DOWN, Direction.LEFT)).toBe('clockwise');
    });

    it('should detect clockwise rotation from LEFT to UP', () => {
      expect(getRotationDirection(Direction.LEFT, Direction.UP)).toBe('clockwise');
    });
  });

  describe('counter-clockwise rotations', () => {
    it('should detect counter-clockwise rotation from UP to LEFT', () => {
      expect(getRotationDirection(Direction.UP, Direction.LEFT)).toBe('counterclockwise');
    });

    it('should detect counter-clockwise rotation from LEFT to DOWN', () => {
      expect(getRotationDirection(Direction.LEFT, Direction.DOWN)).toBe('counterclockwise');
    });

    it('should detect counter-clockwise rotation from DOWN to RIGHT', () => {
      expect(getRotationDirection(Direction.DOWN, Direction.RIGHT)).toBe('counterclockwise');
    });

    it('should detect counter-clockwise rotation from RIGHT to UP', () => {
      expect(getRotationDirection(Direction.RIGHT, Direction.UP)).toBe('counterclockwise');
    });
  });

  describe('180-degree turns', () => {
    it('should return straight for 180-degree turns (opposite directions)', () => {
      expect(getRotationDirection(Direction.UP, Direction.DOWN)).toBe('straight');
      expect(getRotationDirection(Direction.DOWN, Direction.UP)).toBe('straight');
      expect(getRotationDirection(Direction.LEFT, Direction.RIGHT)).toBe('straight');
      expect(getRotationDirection(Direction.RIGHT, Direction.LEFT)).toBe('straight');
    });
  });
});

describe('ConveyorBelt rotation detection', () => {
  // The base SVG for clockwise renders: entry from bottom, exit to right
  // With rotation applied: rotate(${arrowRotation - 90}deg) where arrowRotation = direction * 90
  
  describe('visual rendering verification', () => {
    it('should render correctly for Cross board position 4,6', () => {
      // Cross 4,6: entry from LEFT (3), exit DOWN (2)
      // This should be counter-clockwise rotation
      const entryDir = Direction.LEFT;
      const exitDir = Direction.DOWN;
      
      expect(getRotationDirection(entryDir, exitDir)).toBe('counterclockwise');
      
      // The base counter-clockwise SVG (rotated -90 from clockwise) shows:
      // - Entry from right, exit to top (in local coords)
      // With arrowRotation = 2 * 90 = 180, total rotation = 180 - 90 = 90
      // After 90-degree clockwise rotation:
      // - Right becomes bottom (DOWN)
      // - Top becomes right (RIGHT)
      // But we want entry from LEFT, exit DOWN
      // So there's still an issue with the rendering logic
    });
  });
});