import { GameEngine } from '../lib/game/gameEngine';
import { ServerGameState, TileType, Direction, Player, Tile, Position, Board, GamePhase } from '../lib/game/types';
import { Server } from 'socket.io';

describe('Respawn Order', () => {
    let gameEngine: GameEngine;
    let mockIo: Server;
    let gameState: ServerGameState;

    beforeEach(() => {
        mockIo = {
            to: jest.fn().mockReturnValue({
                emit: jest.fn()
            })
        } as any;

        // Use test mode with short delays
        gameEngine = new GameEngine(mockIo, {
            testMode: true,
            damagePreventionTimeout: 100,
            boardElementDelay: 10,
            cardPlayDelay: 10
        });

        // Create a basic game state for testing
        gameState = {
            roomCode: 'TEST',
            phase: 'playing',
            currentRegister: 0,
            players: {},
            course: {
                board: {
                    width: 12,
                    height: 12,
                    tiles: [],
                    startingPositions: []
                },
                definition: {
                    id: 'test',
                    name: 'Test Course',
                    description: 'Test',
                    difficulty: 'easy',
                    minPlayers: 2,
                    maxPlayers: 8,
                    width: 12,
                    height: 12,
                    checkpoints: [],
                    startingDocks: []
                }
            },
            executionQueue: [],
            host: 'player1',
            gameStarted: true,
            roundNumber: 0
        } as ServerGameState;

        // Initialize empty board
        const tiles: Tile[][] = [];
        for (let y = 0; y < 12; y++) {
            tiles[y] = [];
            for (let x = 0; x < 12; x++) {
                tiles[y][x] = createTile(x, y, TileType.EMPTY);
            }
        }
        gameState.course.board.tiles = tiles;
    });

    // Helper function to create a tile
    const createTile = (x: number, y: number, type: TileType, options: Partial<Tile> = {}): Tile => ({
        position: { x, y },
        type,
        walls: [],
        ...options
    });

    // Helper function to create a player
    const createPlayer = (id: string, x: number, y: number, direction: Direction = Direction.UP): Player => ({
        id,
        name: `Player ${id}`,
        position: { x, y },
        direction,
        lives: 3,
        damage: 0,
        checkpointsVisited: 0,
        cards: [],
        lockedRegisters: [],
        isReady: true,
        optionCards: [],
        selectedCards: [null, null, null, null, null],
        submitted: false,
        dealtCards: [],
        isDead: false,
        archivePosition: { x, y }
    });

    // Helper to place tile on board
    const placeTile = (x: number, y: number, type: TileType, options: Partial<Tile> = {}) => {
        gameState.course.board.tiles[y][x] = createTile(x, y, type, options);
    };

    describe('Respawn happens AFTER repairs', () => {
        it('should execute repairs before respawning dead robots', async () => {
            // Place a repair site at position 5,5
            placeTile(5, 5, TileType.REPAIR);

            // Create two players
            const player1 = createPlayer('p1', 5, 5, Direction.UP);
            player1.damage = 3; // Give player1 some damage
            player1.isDead = false;

            const player2 = createPlayer('p2', 3, 3, Direction.UP);
            player2.isDead = true; // Player2 is dead and needs respawn
            player2.lives = 2; // Still has lives left
            player2.archivePosition = { x: 6, y: 6 }; // Respawn location

            gameState.players['p1'] = player1;
            gameState.players['p2'] = player2;

            // Mock respawnDeadRobots to immediately respawn without decisions
            const originalRespawn = (gameEngine as any).respawnDeadRobots;
            (gameEngine as any).respawnDeadRobots = function(gs: ServerGameState) {
                // Simulate immediate respawn without waiting for decisions
                Object.values(gs.players).forEach(p => {
                    if (p.isDead && p.lives > 0) {
                        p.position = { ...p.archivePosition };
                        p.isDead = false;
                        p.damage = 2; // Respawn with 2 damage
                    }
                });
                return false; // No decisions needed
            };

            // Call endTurn which should:
            // 1. Execute repairs first (heal player1)
            // 2. Then respawn player2
            await (gameEngine as any).endTurn(gameState);

            // Player1 should have been healed BEFORE respawn
            expect(player1.damage).toBe(2); // Reduced by 1 from repair site

            // Player2 should be respawned AFTER repairs
            expect(player2.isDead).toBe(false);
            expect(player2.position).toEqual({ x: 6, y: 6 }); // At archive position
        });

        it('should repair damage on respawn flag BEFORE respawning other robots', async () => {
            // Place a checkpoint/flag that also repairs at 5,5
            placeTile(5, 5, TileType.REPAIR, { checkpoint: 2 });

            // Player1 is dead and will respawn on the flag
            const player1 = createPlayer('p1', 0, 0, Direction.UP);
            player1.isDead = true;
            player1.lives = 2;
            player1.damage = 5; // Has some damage
            player1.archivePosition = { x: 5, y: 5 }; // Respawns on repair flag

            // Player2 is also dead
            const player2 = createPlayer('p2', 0, 0, Direction.UP);
            player2.isDead = true;
            player2.lives = 2;
            player2.archivePosition = { x: 7, y: 7 };

            gameState.players['p1'] = player1;
            gameState.players['p2'] = player2;

            // Mock respawn to place player on archive position
            const originalRespawn = (gameEngine as any).respawnDeadRobots;
            (gameEngine as any).respawnDeadRobots = function(gs: ServerGameState) {
                // Simulate respawn placing robots at archive positions
                Object.values(gs.players).forEach(p => {
                    if (p.isDead && p.lives > 0) {
                        p.position = { ...p.archivePosition };
                        p.isDead = false;
                        p.damage = 2; // Respawn with 2 damage
                    }
                });
                return false; // No decisions needed
            };

            await (gameEngine as any).endTurn(gameState);

            // After endTurn:
            // 1. Repairs should have executed (player1 on repair site gets healed)
            // 2. Then respawn happens

            // Since executeRepairs happens BEFORE respawn, player1 would not be on the repair site yet
            // So damage should still be 2 from respawn
            expect(player1.damage).toBe(2); // Respawn damage, no repair because respawn happens after repairs
        });

        it('should handle the complete end turn sequence in correct order', async () => {
            const executionOrder: string[] = [];

            // Override executeRepairs to track when it's called
            const originalRepairs = (gameEngine as any).executeRepairs;
            (gameEngine as any).executeRepairs = async function(gs: ServerGameState) {
                executionOrder.push('repairs');
                return originalRepairs.call(this, gs);
            };

            // Override respawnDeadRobots to track when it's called
            const originalRespawn = (gameEngine as any).respawnDeadRobots;
            (gameEngine as any).respawnDeadRobots = function(gs: ServerGameState) {
                executionOrder.push('respawn');
                return false; // No decisions needed
            };

            // Override dealCards to track when it's called
            const originalDealCards = (gameEngine as any).dealCards;
            (gameEngine as any).dealCards = function(gs: ServerGameState) {
                executionOrder.push('dealCards');
                // Don't actually deal cards in test
            };

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            await (gameEngine as any).endTurn(gameState);

            // Verify the correct execution order
            expect(executionOrder).toEqual(['repairs', 'dealCards', 'respawn']);
        });

        it('should not respawn robots if game has ended', async () => {
            const player = createPlayer('p1', 5, 5, Direction.UP);
            player.isDead = true;
            player.lives = 2;
            gameState.players['p1'] = player;
            
            // Set game to ended state
            gameState.phase = GamePhase.ENDED;

            const originalRespawn = (gameEngine as any).respawnDeadRobots;
            let respawnCalled = false;
            (gameEngine as any).respawnDeadRobots = function() {
                respawnCalled = true;
                return false;
            };

            await (gameEngine as any).endTurn(gameState);

            // Respawn should not be called when game has ended
            expect(respawnCalled).toBe(false);
        });
    });
});