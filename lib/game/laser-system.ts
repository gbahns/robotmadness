import { GameState, Player, Position, Course, GamePhase } from './types';
import { getTileAt } from './tile-utils';

export interface LaserSource {
    position: Position;
    direction: number; // 0=North, 1=East, 2=South, 3=West
    damage: number;
    type: 'board' | 'robot';
    playerId?: string; // For robot lasers
}

export interface LaserBeam {
    source: LaserSource;
    path: Position[];
    hitTarget?: {
        type: 'robot' | 'wall';
        position: Position;
        playerId?: string;
    };
}

export interface LaserDamage {
    playerId: string;
    damage: number;
    source: 'board' | 'robot';
    sourcePlayerId?: string;
}

// Direction vectors for laser movement
const DIRECTION_VECTORS: Record<number, { dx: number; dy: number }> = {
    0: { dx: 0, dy: -1 }, // North
    1: { dx: 1, dy: 0 },  // East
    2: { dx: 0, dy: 1 },  // South
    3: { dx: -1, dy: 0 }  // West
};

/**
 * Get all laser sources on the board (board lasers + robot lasers)
 * Implements REQ-LASER-1 and REQ-LASER-2
 */
export function getAllLaserSources(gameState: GameState): LaserSource[] {
    const sources: LaserSource[] = [];

    // Add board lasers
    if (gameState.course.board.lasers) {
        gameState.course.board.lasers.forEach(laser => {
            sources.push({
                position: laser.position,
                direction: laser.direction,
                damage: laser.damage,
                type: 'board'
            });
        });
    }

    // Add robot lasers (each robot has a forward-firing laser)
    Object.values(gameState.players).forEach(player => {
        if (player.lives > 0) {
            sources.push({
                position: player.position,
                direction: player.direction,
                damage: 1,
                type: 'robot',
                playerId: player.id
            });
        }
    });

    return sources;
}

/**
 * Check if there's a wall between two adjacent positions
 * REQ-LASER-3: Lasers blocked by walls
 */
function hasWallBetween(from: Position, to: Position, board: Course['board']): boolean {
    // Determine direction of movement
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    let movementDirection: number;
    if (dy === -1) movementDirection = 0; // North
    else if (dx === 1) movementDirection = 1; // East
    else if (dy === 1) movementDirection = 2; // South
    else if (dx === -1) movementDirection = 3; // West
    else return false; // Not adjacent positions

    // Check if there's a wall on the 'from' tile blocking exit in the movement direction
    const fromTile = getTileAt(board, from.x, from.y);
    if (fromTile && fromTile.walls.includes(movementDirection)) {
        return true;
    }

    // Check if there's a wall on the 'to' tile blocking entry from the opposite direction
    const oppositeDirection = (movementDirection + 2) % 4;
    const toTile = getTileAt(board, to.x, to.y);
    if (toTile && toTile.walls.includes(oppositeDirection)) {
        return true;
    }

    return false;
}

/**
 * Find robot at position
 */
function getRobotAt(position: Position, players: Record<string, Player>): Player | undefined {
    return Object.values(players).find(player =>
        player.position.x === position.x &&
        player.position.y === position.y &&
        player.lives > 0
    );
}

/**
 * Trace laser beam path from source until it hits something
 * REQ-LASER-3: Blocked by walls/robots (for damage calculation)
 */
export function traceLaserBeam(source: LaserSource, gameState: GameState): LaserBeam {
    const beam: LaserBeam = {
        source,
        path: []
    };

    const { dx, dy } = DIRECTION_VECTORS[source.direction];

    // IMPORTANT: First check if there's a wall immediately blocking the laser from firing
    // Check if the source position has a wall blocking the laser's exit direction
    const firstStepPos = {
        x: source.position.x + dx,
        y: source.position.y + dy
    };

    // Check if laser is immediately blocked by a wall at the source
    if (hasWallBetween(source.position, firstStepPos, gameState.course.board)) {
        // Laser can't even fire - blocked immediately
        beam.hitTarget = {
            type: 'wall',
            position: source.position
        };
        return beam; // Return empty path
    }

    let currentX = source.position.x + dx;
    let currentY = source.position.y + dy;

    // Trace beam until it hits something or goes off board
    while (
        currentX >= 0 &&
        currentX < gameState.course.board.width &&
        currentY >= 0 &&
        currentY < gameState.course.board.height
    ) {
        const currentPos = { x: currentX, y: currentY };
        const previousPos = beam.path.length > 0
            ? beam.path[beam.path.length - 1]
            : source.position;

        // Check if entry to this tile is blocked by a wall
        if (hasWallBetween(previousPos, currentPos, gameState.course.board)) {
            beam.hitTarget = {
                type: 'wall',
                position: previousPos
            };
            break;
        }

        // Add this position to the path
        beam.path.push(currentPos);

        // Check if there's a robot at this position
        const hitRobot = getRobotAt(currentPos, gameState.players);
        if (hitRobot) {
            beam.hitTarget = {
                type: 'robot',
                position: currentPos,
                playerId: hitRobot.id
            };
            break;
        }

        // Move to next position
        currentX += dx;
        currentY += dy;
    }

    return beam;
}

/**
 * Calculate damage for all players from all laser sources
 * REQ-LASER-4: Damage calculation and application
 */
export function calculateLaserDamage(gameState: GameState): LaserDamage[] {
    const damages: LaserDamage[] = [];
    const sources = getAllLaserSources(gameState);

    sources.forEach(source => {
        const beam = traceLaserBeam(source, gameState);

        if (beam.hitTarget?.type === 'robot' && beam.hitTarget.playerId) {
            damages.push({
                playerId: beam.hitTarget.playerId,
                damage: source.damage,
                source: source.type,
                sourcePlayerId: source.playerId
            });
        }
    });

    return damages;
}

/**
 * Apply laser damage to players
 * REQ-LASER-4: Damage application
 */
export function applyLaserDamage(gameState: GameState): void {
    const damages = calculateLaserDamage(gameState);

    damages.forEach(damage => {
        const player = gameState.players[damage.playerId];
        if (player && player.lives > 0) {
            player.damage += damage.damage;

            // Check if robot is destroyed
            if (player.damage >= 10) {
                player.lives--;
                player.damage = 0;

                // *******************************************
                // I don't think we need to do anything here; robot destruction should be detected and handled in centralized
                // game engine logic (is it?)
                // *******************************************
                // Reset to last checkpoint or starting position
                // if ((player as any).respawnPosition) {
                //     player.position = (player as any).respawnPosition.position;
                //     player.direction = (player as any).respawnPosition.direction;
                // } else {
                //     // Find starting position for this player
                //     const startPos = gameState.course.board.startingPositions.find(sp => sp.number === player.startingPosition.number);
                //     if (startPos) {
                //         player.position = { ...startPos.position };
                //         player.direction = startPos.direction;
                //     }
                // }
            }
        }
    });
}