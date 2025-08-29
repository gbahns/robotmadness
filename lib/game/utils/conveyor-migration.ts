import { Direction, TileElement, TileType } from '../types';

/**
 * Convert old rotate-based conveyor definition to new entries-based definition
 * @param tile - Tile element with old format
 * @returns Tile element with new format
 */
export function migrateConveyorTile(tile: TileElement): TileElement {
  // Only process conveyor tiles with rotation
  if (
    (tile.type !== TileType.CONVEYOR && tile.type !== TileType.EXPRESS_CONVEYOR) ||
    !tile.rotate ||
    !tile.direction
  ) {
    return tile;
  }

  // Calculate entry direction based on exit direction and rotation
  const exitDir = tile.direction as Direction;
  let entryDir: Direction;

  if (tile.rotate === 'clockwise') {
    // For clockwise, entry is 90° counter-clockwise from exit
    if (exitDir === Direction.UP) {
      entryDir = Direction.RIGHT;
    } else if (exitDir === Direction.RIGHT) {
      entryDir = Direction.DOWN;
    } else if (exitDir === Direction.DOWN) {
      entryDir = Direction.LEFT;
    } else if (exitDir === Direction.LEFT) {
      entryDir = Direction.UP;
    } else {
      return tile;
    }
  } else {
    // For counter-clockwise, entry is 90° clockwise from exit
    if (exitDir === Direction.UP) {
      entryDir = Direction.LEFT;
    } else if (exitDir === Direction.RIGHT) {
      entryDir = Direction.UP;
    } else if (exitDir === Direction.DOWN) {
      entryDir = Direction.RIGHT;
    } else if (exitDir === Direction.LEFT) {
      entryDir = Direction.DOWN;
    } else {
      return tile;
    }
  }

  // Return new format with entries array
  // Remove the rotate property from the tile
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rotate, ...rest } = tile;
  return {
    ...rest,
    entries: [entryDir]
  };
}

/**
 * Determine rotation direction from entry and exit directions
 * @param entryDir - Direction robot enters from
 * @param exitDir - Direction robot exits to
 * @returns 'clockwise', 'counterclockwise', or 'straight'
 */
export function getRotationDirection(
  entryDir: Direction,
  exitDir: Direction
): 'clockwise' | 'counterclockwise' | 'straight' {
  // If entry and exit are the same (straight conveyor)
  if (entryDir === exitDir) {
    return 'straight';
  }

  // Check if it's a 90-degree turn
  const clockwiseTurns: Record<Direction, Direction> = {
    [Direction.UP]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.DOWN,
    [Direction.DOWN]: Direction.LEFT,
    [Direction.LEFT]: Direction.UP,
  };

  const counterClockwiseTurns: Record<Direction, Direction> = {
    [Direction.UP]: Direction.LEFT,
    [Direction.LEFT]: Direction.DOWN,
    [Direction.DOWN]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.UP,
  };

  if (clockwiseTurns[entryDir] === exitDir) {
    return 'clockwise';
  } else if (counterClockwiseTurns[entryDir] === exitDir) {
    return 'counterclockwise';
  }

  return 'straight'; // Shouldn't happen for 90-degree turns
}