import { GameEngine } from '../lib/game/gameEngine';
import { ServerGameState, TileType, Direction, Player, Tile, Position, Board, CardType } from '../lib/game/types';
import { Server } from 'socket.io';

describe('Pit Mechanics', () => {
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
        archivePosition: { x: 2, y: 2 }
    });

    // Helper to place tile on board
    const placeTile = (x: number, y: number, type: TileType, options: Partial<Tile> = {}) => {
        gameState.course.board.tiles[y][x] = createTile(x, y, type, options);
    };

    describe('Robot falls into pit during movement', () => {
        it('should destroy robot when Move 1 moves it onto a pit', async () => {
            // Place a pit at position 5,4 (one space up from robot)
            placeTile(5, 4, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Move 1 card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_1, priority: 100 });

            // Robot should be destroyed
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
            // Position is set to (-1,-1) when destroyed
        });

        it('should destroy robot when Move 2 crosses a pit (cannot jump)', async () => {
            // Place a pit at position 5,4 (one space up)
            placeTile(5, 4, TileType.PIT);
            // Empty space at 5,3 (two spaces up)
            placeTile(5, 3, TileType.EMPTY);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Move 2 card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_2, priority: 200 });

            // Robot should fall into pit during first move, not reach second space
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
            // Position is set to (-1,-1) when destroyed
        });

        it('should destroy robot when Move 3 crosses a pit on first move', async () => {
            // Place pit at first position
            placeTile(5, 4, TileType.PIT);
            placeTile(5, 3, TileType.EMPTY);
            placeTile(5, 2, TileType.EMPTY);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Move 3 card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_3, priority: 300 });

            // Should fall on first pit
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });

        it('should destroy robot when Move 3 crosses a pit on second move', async () => {
            // Place pit at second position
            placeTile(5, 4, TileType.EMPTY);
            placeTile(5, 3, TileType.PIT);
            placeTile(5, 2, TileType.EMPTY);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Move 3 card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_3, priority: 300 });

            // Should fall on second pit
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });

        it('should destroy robot when Move 3 crosses a pit on third move', async () => {
            // Place pit at third position
            placeTile(5, 4, TileType.EMPTY);
            placeTile(5, 3, TileType.EMPTY);
            placeTile(5, 2, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Move 3 card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_3, priority: 300 });

            // Should fall on third pit
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });

        it('should destroy robot when backing up over a pit', async () => {
            // Place pit behind robot
            placeTile(5, 6, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute Back Up card
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.BACK_UP, priority: 50 });

            // Robot should fall into pit
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });
    });

    describe('Robot pushed into pit', () => {
        it('should destroy robot when pushed onto a pit by another robot', async () => {
            // Place pit at 6,5
            placeTile(6, 5, TileType.PIT);

            const pusher = createPlayer('p1', 4, 5, Direction.RIGHT);
            const target = createPlayer('p2', 5, 5, Direction.UP);
            gameState.players['p1'] = pusher;
            gameState.players['p2'] = target;

            // Pusher moves 2 spaces, pushing target into pit
            await (gameEngine as any).executeCard(gameState, pusher, { type: CardType.MOVE_2, priority: 200 });

            // Target should be destroyed
            expect(target.isDead).toBe(true);
            expect(target.lives).toBe(2);

            // Pusher continues moving and also falls into the same pit!
            expect(pusher.isDead).toBe(true);
            expect(pusher.lives).toBe(2);
        });

        it('should handle chain push where middle robot falls into pit', async () => {
            // Setup: R1 -> R2 -> PIT
            placeTile(7, 5, TileType.PIT);

            const pusher = createPlayer('p1', 5, 5, Direction.RIGHT);
            const middle = createPlayer('p2', 6, 5, Direction.UP);
            gameState.players['p1'] = pusher;
            gameState.players['p2'] = middle;

            // Pusher moves, pushing middle robot into pit
            await (gameEngine as any).executeCard(gameState, pusher, { type: CardType.MOVE_1, priority: 100 });

            // Middle robot should be destroyed
            expect(middle.isDead).toBe(true);
            expect(middle.lives).toBe(2);

            // Pusher moves to middle's old position
            expect(pusher.isDead).toBe(false);
            expect(pusher.position).toEqual({ x: 6, y: 5 });
        });

        it('should handle conveyor pushing robot into pit', async () => {
            // Conveyor leads to pit
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should NOT be destroyed by conveyor movement alone
            // Pits are checked separately in executePits phase
            expect(player.isDead).toBe(false);
            expect(player.position).toEqual({ x: 6, y: 5 });

            // Now execute pits
            await (gameEngine as any).executePits(gameState);

            // NOW robot should be destroyed
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });
    });

    describe('Multiple pits in path', () => {
        it('should stop at first pit encountered', async () => {
            // Place multiple pits in a row
            placeTile(5, 4, TileType.PIT);
            placeTile(5, 3, TileType.PIT);
            placeTile(5, 2, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Try to move 3 spaces
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_3, priority: 300 });

            // Should fall into first pit only
            expect(player.isDead).toBe(true);
            expect(player.lives).toBe(2);
        });
    });

    describe('Edge cases', () => {
        it('should not check for pits if movement is blocked by wall', async () => {
            // Wall blocks movement, pit is behind wall
            placeTile(5, 4, TileType.EMPTY, { walls: [Direction.DOWN] });
            placeTile(5, 3, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Try to move through wall
            await (gameEngine as any).executeCard(gameState, player, { type: CardType.MOVE_2, priority: 200 });

            // Should be blocked by wall, not reach pit
            expect(player.isDead).toBe(false);
            expect(player.position).toEqual({ x: 5, y: 5 }); // Didn't move
        });

        it('should not fall into pit if pushed movement is blocked', async () => {
            // Setup: R1 -> R2 -> WALL -> PIT
            placeTile(6, 5, TileType.EMPTY);
            placeTile(7, 5, TileType.EMPTY, { walls: [Direction.LEFT] });
            placeTile(8, 5, TileType.PIT);

            const pusher = createPlayer('p1', 5, 5, Direction.RIGHT);
            const blocker = createPlayer('p2', 6, 5, Direction.UP);
            gameState.players['p1'] = pusher;
            gameState.players['p2'] = blocker;

            // Try to push blocker through wall
            await (gameEngine as any).executeCard(gameState, pusher, { type: CardType.MOVE_2, priority: 200 });

            // Nobody should fall into pit (wall blocks push)
            expect(pusher.isDead).toBe(false);
            expect(blocker.isDead).toBe(false);
            expect(pusher.position).toEqual({ x: 5, y: 5 }); // Can't push
            expect(blocker.position).toEqual({ x: 6, y: 5 }); // Not pushed
        });
    });
});