// lib/game/laser-system.ts
import { GameState, Player, Position, Board, GamePhase } from './types';

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
    if (gameState.board.lasers) {
        gameState.board.lasers.forEach(laser => {
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
function hasWallBetween(from: Position, to: Position, board: Board): boolean {
    // TODO: Implement wall checking when wall system is implemented
    // For now, return false (no walls)
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
    let currentX = source.position.x + dx;
    let currentY = source.position.y + dy;

    // Trace beam until it hits something or goes off board
    while (
        currentX >= 0 &&
        currentX < gameState.board.width &&
        currentY >= 0 &&
        currentY < gameState.board.height
    ) {
        const currentPos = { x: currentX, y: currentY };
        const previousPos = beam.path.length > 0
            ? beam.path[beam.path.length - 1]
            : source.position;

        // Check for wall blocking the path
        if (hasWallBetween(previousPos, currentPos, gameState.board)) {
            beam.hitTarget = {
                type: 'wall',
                position: previousPos
            };
            break;
        }

        beam.path.push(currentPos);

        // Check for robot blocking the path (for damage calculation)
        const robot = getRobotAt(currentPos, gameState.players);
        if (robot) {
            beam.hitTarget = {
                type: 'robot',
                position: currentPos,
                playerId: robot.id
            };
            break; // Stop here for damage calculation
        }

        // Move to next position
        currentX += dx;
        currentY += dy;
    }

    return beam;
}

/**
 * Calculate all laser beams for current game state
 */
export function calculateAllLaserBeams(gameState: GameState): LaserBeam[] {
    const sources = getAllLaserSources(gameState);
    return sources.map(source => traceLaserBeam(source, gameState));
}

/**
 * Calculate damage from all lasers
 * REQ-LASER-4: 1 hit = 1 damage
 * REQ-LASER-5: Fire simultaneously
 */
export function calculateLaserDamage(gameState: GameState): LaserDamage[] {
    const beams = calculateAllLaserBeams(gameState);
    const damageMap = new Map<string, LaserDamage[]>();

    // Collect all damage for each player
    beams.forEach(beam => {
        if (beam.hitTarget?.type === 'robot' && beam.hitTarget.playerId) {
            const playerId = beam.hitTarget.playerId;

            if (!damageMap.has(playerId)) {
                damageMap.set(playerId, []);
            }

            damageMap.get(playerId)!.push({
                playerId,
                damage: beam.source.damage,
                source: beam.source.type,
                sourcePlayerId: beam.source.playerId
            });
        }
    });

    // Convert to array
    const allDamage: LaserDamage[] = [];
    damageMap.forEach(damages => {
        allDamage.push(...damages);
    });

    return allDamage;
}

/**
 * Apply laser damage to players
 * REQ-LASER-4: Each laser hit = 1 damage token
 */
export function applyLaserDamage(gameState: GameState): void {
    const damages = calculateLaserDamage(gameState);

    damages.forEach(damage => {
        const player = gameState.players[damage.playerId];
        if (player && player.lives > 0) {
            player.damage += damage.damage;

            // Check if destroyed (REQ-DMG-2: 10 damage = destroyed)
            if (player.damage >= 10) {
                // Handle robot destruction (implemented elsewhere)
                console.log(`Player ${damage.playerId} destroyed by laser damage`);
            }
        }
    });
}

/**
 * Get visual laser beam data for rendering
 */
export function getLaserBeamsForRendering(board: Board, players: Record<string, Player>): LaserBeam[] {
    // Create a minimal game state for beam calculation
    const gameState: GameState = {
        id: 'temp-laser-calc',
        roomCode: 'temp',
        name: 'Laser Calculation',
        board,
        players,
        phase: GamePhase.EXECUTING,
        currentRegister: 0,
        roundNumber: 1,
        cardsDealt: false
    };

    return calculateAllLaserBeams(gameState);
}