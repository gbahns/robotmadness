import { GameEngine } from '../lib/game/gameEngine';
import { ServerGameState, TileType, Direction, Player, Tile, Position, Board } from '../lib/game/types';
import { Server } from 'socket.io';

describe('Board Element Interactions', () => {
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
            currentRegister: 1,
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
            gameStarted: true
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
        optionCards: []
    });

    // Helper to place tile on board
    const placeTile = (x: number, y: number, type: TileType, options: Partial<Tile> = {}) => {
        gameState.course.board.tiles[y][x] = createTile(x, y, type, options);
    };

    describe('Conveyor to Gear Movement', () => {
        it('should NOT rotate robot when conveyor moves it onto a gear', async () => {
            // Set up board with conveyor leading to a gear
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.GEAR_CW);

            // Place robot on conveyor
            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should be moved to gear position but NOT rotated by conveyor
            expect(player.position).toEqual({ x: 6, y: 5 });
            expect(player.direction).toBe(Direction.UP); // Should still face north

            // Now execute gears
            await (gameEngine as any).executeGears(gameState);

            // NOW the robot should be rotated by the gear
            expect(player.direction).toBe(Direction.RIGHT); // Rotated clockwise
        });

        it('should rotate robot when conveyor moves it onto another conveyor (corner)', async () => {
            // Set up board with conveyor leading to a corner conveyor
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.CONVEYOR, { direction: Direction.UP, rotate: 'clockwise' });

            // Place robot on first conveyor
            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should be moved AND rotated
            expect(player.position).toEqual({ x: 6, y: 5 });
            expect(player.direction).toBe(Direction.RIGHT); // Rotated clockwise by corner conveyor
        });

        it('should handle express conveyor to gear correctly', async () => {
            // Set up board with express conveyor leading to a gear
            placeTile(5, 5, TileType.EXPRESS_CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.GEAR_CCW);

            // Place robot on express conveyor
            const player = createPlayer('p1', 5, 5, Direction.DOWN);
            gameState.players['p1'] = player;

            // Execute express conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, false);

            // Robot should be moved but NOT rotated by conveyor
            expect(player.position).toEqual({ x: 6, y: 5 });
            expect(player.direction).toBe(Direction.DOWN); // Should still face south

            // Execute gears
            await (gameEngine as any).executeGears(gameState);

            // NOW rotated by gear
            expect(player.direction).toBe(Direction.RIGHT); // Rotated counter-clockwise
        });
    });

    describe('Other Board Element Interactions', () => {
        it('should handle conveyor to pit correctly', async () => {
            // Conveyor leading to a pit
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.PIT);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should be moved to pit and destroyed
            expect(player.position).toEqual({ x: 6, y: 5 });
            
            // Execute pits
            await (gameEngine as any).executePits(gameState);
            
            // Robot should be destroyed
            expect(player.lives).toBe(2);
        });

        it('should handle conveyor to repair site correctly', async () => {
            // Conveyor leading to repair site
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.DOWN });
            placeTile(5, 6, TileType.REPAIR);

            const player = createPlayer('p1', 5, 5, Direction.UP);
            player.damage = 3;
            gameState.players['p1'] = player;

            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should be moved
            expect(player.position).toEqual({ x: 5, y: 6 });
            
            // Execute repairs
            await (gameEngine as any).executeRepairs(gameState);
            
            // Damage should be reduced
            expect(player.damage).toBe(2); // Repair site heals 1 damage
        });

        it('should handle gear to conveyor movement correctly', async () => {
            // Robot on gear with conveyor adjacent
            placeTile(5, 5, TileType.GEAR_CW);
            placeTile(6, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute gears first
            await (gameEngine as any).executeGears(gameState);
            expect(player.direction).toBe(Direction.RIGHT); // Rotated by gear

            // Move robot onto conveyor manually
            player.position = { x: 6, y: 5 };

            // Execute conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            
            // Should be moved by conveyor
            expect(player.position).toEqual({ x: 7, y: 5 });
        });

        it('should handle multiple robots on conveyors with collision', async () => {
            // Two conveyors leading to same spot
            placeTile(4, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.CONVEYOR, { direction: Direction.LEFT });

            const player1 = createPlayer('p1', 4, 5, Direction.UP);
            const player2 = createPlayer('p2', 6, 5, Direction.DOWN);
            gameState.players['p1'] = player1;
            gameState.players['p2'] = player2;

            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Both robots should stay in place due to collision
            expect(player1.position).toEqual({ x: 4, y: 5 });
            expect(player2.position).toEqual({ x: 6, y: 5 });
        });

        it('should handle pusher to conveyor interaction', async () => {
            // Pusher that pushes onto a conveyor
            placeTile(5, 5, TileType.PUSHER, { direction: Direction.RIGHT, registers: [1, 3, 5] });
            placeTile(6, 5, TileType.CONVEYOR, { direction: Direction.UP });

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;
            gameState.currentRegister = 0; // Set to 0 so currentRegister + 1 = 1, which is in [1, 3, 5]

            // Execute pushers
            await (gameEngine as any).executePushers(gameState);

            // Robot should be pushed onto conveyor
            expect(player.position).toEqual({ x: 6, y: 5 });

            // Execute conveyors
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);

            // Robot should be moved by conveyor
            expect(player.position).toEqual({ x: 6, y: 4 });
        });

        it('should handle conveyor chain with gear at the end', async () => {
            // Chain of conveyors ending in a gear
            placeTile(3, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(4, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.GEAR_CCW);

            const player = createPlayer('p1', 3, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute conveyors - should move robot along chain
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            expect(player.position).toEqual({ x: 4, y: 5 });
            
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            expect(player.position).toEqual({ x: 5, y: 5 });
            
            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            expect(player.position).toEqual({ x: 6, y: 5 });
            
            // Direction should NOT be changed by moving onto gear
            expect(player.direction).toBe(Direction.UP);

            // Execute gears
            await (gameEngine as any).executeGears(gameState);
            
            // NOW direction should be changed
            expect(player.direction).toBe(Direction.LEFT); // Counter-clockwise
        });

        it('should handle express and normal conveyor interaction', async () => {
            // Express conveyor leading to normal conveyor
            placeTile(5, 5, TileType.EXPRESS_CONVEYOR, { direction: Direction.RIGHT });
            placeTile(6, 5, TileType.EXPRESS_CONVEYOR, { direction: Direction.RIGHT });
            placeTile(7, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });

            const player = createPlayer('p1', 5, 5, Direction.UP);
            gameState.players['p1'] = player;

            // Execute express conveyors (move 1 space at a time)
            await (gameEngine as any).executeConveyorBelts(gameState, true, false);
            expect(player.position).toEqual({ x: 6, y: 5 });
            
            await (gameEngine as any).executeConveyorBelts(gameState, true, false);
            expect(player.position).toEqual({ x: 7, y: 5 });

            // Execute normal conveyors (move 1 space)
            await (gameEngine as any).executeConveyorBelts(gameState, false, true);
            expect(player.position).toEqual({ x: 8, y: 5 });
        });
    });

    describe('Edge Cases', () => {
        it('should handle robot on gear with no conveyor movement', async () => {
            placeTile(5, 5, TileType.GEAR_CW);

            const player = createPlayer('p1', 5, 5, Direction.LEFT);
            gameState.players['p1'] = player;

            // Execute gears
            await (gameEngine as any).executeGears(gameState);
            
            // Should rotate
            expect(player.direction).toBe(Direction.UP);
            expect(player.position).toEqual({ x: 5, y: 5 }); // Should not move
        });

        it('should handle destroyed robot not being affected by board elements', async () => {
            placeTile(5, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });

            const player = createPlayer('p1', 5, 5, Direction.UP);
            player.lives = 0; // Robot is destroyed
            gameState.players['p1'] = player;

            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            
            // Robot should not move
            expect(player.position).toEqual({ x: 5, y: 5 });
        });

        it('should handle conveyor pushing robot off the board', async () => {
            // Conveyor at edge pushing off board
            placeTile(11, 5, TileType.CONVEYOR, { direction: Direction.RIGHT });

            const player = createPlayer('p1', 11, 5, Direction.UP);
            gameState.players['p1'] = player;

            await (gameEngine as any).executeConveyorBelts(gameState, true, true);
            
            // Robot should be destroyed
            expect(player.lives).toBe(2);
        });
    });
});