import { GameState, Player, ProgramCard, Tile, Direction, CardType, GamePhase, Course, PowerState, Position } from './types';
import { TileType } from './types/enums';
import { GAME_CONFIG } from './constants';
import { buildCourse, getCourseById, RISKY_EXCHANGE } from './courses/courses';
import { hasWallBetween } from './wall-utils';
import { getTileAt as getCanonicalTileAt } from './tile-utils';
import { createOptionCard, OptionCardType } from './optionCards';
import { prisma } from '../prisma';

export interface ServerGameState extends GameState {
    host: string;
    winner?: string;
    allPlayersDead?: boolean;
    waitingForPowerDownDecisions?: string[];
    waitingForRespawnDecisions?: string[];
    playersWhoMadeRespawnDecisions?: string[];
    pendingDamage?: Map<string, {
        amount: number;
        source: string;
        prevented: number;
        completed?: boolean;
    }>;
}

interface IoServer {
    to(room: string): { emit(event: string, ...args: unknown[]): void; };
}

interface DirectionVectors {
    [key: number]: { x: number; y: number; };
}

interface ConveyorMovement {
    player: Player;
    to: Position;
    fromTile: Tile;
}

interface RobotHit {
    player: Player;
    shooterName: string;
    damage: number;
    shooterPosition?: Position; // Position of the shooter for directional damage
}

interface LaserPath {
    x: number;
    y: number;
}

interface LaserBeam {
    startPosition: Position;
    startFromBack: boolean; // true for board lasers (starts from back of tile), false for robot lasers (starts from front)
    direction: Direction;
    path: Position[]; // Tiles the laser passes through
    hits: RobotHit[];
    blockedBy: 'wall' | 'edge' | 'robot' | null;
    endPosition: Position | null; // Final position where laser stops
    endAtFront: boolean; // true if stopped at front of tile (hit robot), false if stopped at back (hit wall)
    // Visual rendering notes:
    // - If startFromBack is true: beam starts at back edge of startPosition tile, passes through it
    // - If startFromBack is false: beam starts at front edge of startPosition tile, doesn't pass through it  
    // - If endAtFront is true: beam stops at front edge of endPosition tile (before robot)
    // - If endAtFront is false: beam stops at back edge of endPosition tile (at wall/edge)
}

interface DamageInfo {
    boardDamage: number;
    boardHits: Array<{  // Track board laser hits separately with positions
        damage: number;
        laserPosition: Position;
    }>;
    robotHits: Array<{
        shooterName: string;
        damage: number;
        shooterPosition?: Position;
    }>;
}

export interface GameEngineConfig {
    testMode?: boolean;
    damagePreventionTimeout?: number;
}

export class GameEngine {
    private io: IoServer;
    private DIRECTION_VECTORS: DirectionVectors;
    private registerExecutionDelay: number;
    private boardElementDelay: number;
    private timers: Map<string, NodeJS.Timeout> = new Map(); // Track timers per room
    private timerIntervals: Map<string, NodeJS.Timeout> = new Map(); // Track countdown intervals
    private config: GameEngineConfig;

    constructor(io: IoServer, config: GameEngineConfig = {}) {
        this.io = io;
        this.config = {
            testMode: false,
            damagePreventionTimeout: 15000, // Default 15 seconds
            ...config
        };
        this.DIRECTION_VECTORS = {
            [Direction.UP]: { x: 0, y: -1 },
            [Direction.RIGHT]: { x: 1, y: 0 },
            [Direction.DOWN]: { x: 0, y: 1 },
            [Direction.LEFT]: { x: -1, y: 0 }
        };
        this.registerExecutionDelay = GAME_CONFIG.REGISTER_DELAY;
        this.boardElementDelay = GAME_CONFIG.REGISTER_DELAY;
    }

    createPlayer(playerId: string, playerName: string): Player {
        return {
            id: playerId,
            userId: playerId,
            name: playerName,
            position: { x: -1, y: -1 }, // Temporary position
            archiveMarker: { x: -1, y: -1 }, // Archive marker for respawn
            direction: Direction.DOWN,
            damage: 0,
            lives: 3,
            checkpointsVisited: 0,
            isPoweredDown: false,
            dealtCards: [],
            selectedCards: Array(5).fill(null),
            lockedRegisters: 0,
            optionCards: [], // Start with empty option cards
            powerState: PowerState.ON,
            announcedPowerDown: false,
        };
    }

    createGame(roomCode: string, name: string): ServerGameState {
        console.log(`Creating game with room code: ${roomCode}, name: ${name}`);

        const courseDefinition = getCourseById(RISKY_EXCHANGE.id);
        const course: Course = buildCourse(courseDefinition);
        //this.selectCourse(gameState, courseId);

        const gameState: ServerGameState = {
            id: roomCode,
            roomCode,
            name: name == '' ? roomCode : name,
            phase: GamePhase.WAITING,
            currentRegister: 0,
            players: {},
            course: course,
            roundNumber: 0,
            cardsDealt: false,
            optionDeck: [],
            discardedOptions: [],
            host: '',
        };

        return gameState;
    }

    addPlayerToGame(gameState: ServerGameState, playerId: string, playerName: string): void {
        if (gameState.players[playerId]) return;
        gameState.players[playerId] = this.createPlayer(playerId, playerName);
        if (gameState.host === '') gameState.host = playerId; // First player becomes host
    }

    removePlayerFromGame(gameState: ServerGameState, playerId: string): void {
        delete gameState.players[playerId];
    }

    // selectBoard(gameState: ServerGameState, boardId: string): Board {
    //     const board = getBoardById(boardId);
    //     gameState.board = board;
    //     gameState.selectedBoard = boardId;
    //     console.log(`Board selected: ${boardId} height:${board.height}, checkpoints:${board.checkpoints} starting positions:`, board.startingPositions);
    //     return board;
    // }

    selectCourse(gameState: ServerGameState, courseId: string): void {
        console.log(`Selecting course: ${courseId}`);
        const courseDefinition = getCourseById(courseId);
        console.log(`Found course: ${courseDefinition.name} with boards: ${courseDefinition.boards.join(', ')}`);
        gameState.course = buildCourse(courseDefinition);
        console.log(`Course selected: ${courseId}, board height: ${gameState.course.board.height}`);
    }

    startGame(gameState: ServerGameState, selectedCourse: string): void {
        gameState.phase = GamePhase.STARTING;

        // Initialize option deck with one of each card (excluding Shield which is custom)
        const allOptionTypes = Object.values(OptionCardType).filter(type => type !== OptionCardType.SHIELD);
        gameState.optionDeck = allOptionTypes.map(type => createOptionCard(type));
        
        // Shuffle the option deck
        for (let i = gameState.optionDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.optionDeck[i], gameState.optionDeck[j]] = [gameState.optionDeck[j], gameState.optionDeck[i]];
        }
        gameState.discardedOptions = [];
        console.log(`Initialized option deck with ${gameState.optionDeck.length} unique cards`);

        // Get available starting positions (in order 1, 2, 3, etc.)
        const startingPositions = [...gameState.course.board.startingPositions];
        console.log(`Starting game with course: ${selectedCourse} ${gameState.course.definition.name}, available positions:`, startingPositions.length);

        // Get all player IDs and shuffle them to randomize player order
        const playerIds = Object.keys(gameState.players);
        for (let i = playerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }

        // Assign positions to players in the randomized order
        playerIds.forEach((playerId, index) => {
            const player = gameState.players[playerId];
            const startPos = startingPositions[index]; // Position 1 goes to first player, 2 to second, etc.

            if (startPos) {
                // Set initial position
                player.position = { ...startPos.position };
                player.direction = startPos.direction;

                // Set archive position to starting position
                player.archiveMarker = { ...startPos.position };

                // Store which dock number they started at
                player.startingPosition = startPos;

                // Initialize empty option card array
                player.optionCards = [];

                console.log(`${player.name} assigned to Starting Position ${startPos.number} at (${startPos.position.x}, ${startPos.position.y})`);
            } else {
                console.warn(`No starting position available for ${player.name}`);
            }
        });
    }

    dealCardsToPlayer(roomCode: string, player: Player, deck: ProgramCard[]): void {
        // Handle power down states
        if ((player.announcedPowerDown && player.powerState === PowerState.ANNOUNCING) || player.powerState === PowerState.OFF) {
            // Transition from ANNOUNCING to OFF or staying OFF
            player.powerState = PowerState.OFF;
            player.damage = 0; // Repair all damage 
            player.dealtCards = []; // No cards when powered down
            player.selectedCards = [null, null, null, null, null];
            player.lockedRegisters = 0;
            player.announcedPowerDown = false;
            player.submitted = true; // Auto-submit for powered down players

            console.log(`${player.name} is powered down - all damage repaired`);

            // Notify all clients
            this.io.to(roomCode).emit('player-powered-down', {
                playerId: player.id,
                playerName: player.name
            });
        } else {
            // Normal card dealing
            let cardsToDealt = 9 - player.damage;
            
            // Check for Extra Memory option card
            if (player.optionCards?.some(card => card.type === OptionCardType.EXTRA_MEMORY)) {
                cardsToDealt += 1;
                console.log(`${player.name} has Extra Memory - dealing ${cardsToDealt} cards instead of ${cardsToDealt - 1}`);
            }
            
            player.dealtCards = deck.splice(0, cardsToDealt);
            player.submitted = false;
        }
    }

    dealCards(gameState: ServerGameState): void {
        // STEP 1: Handle powered down players FIRST (before creating deck)
        // They need to decide whether to stay powered down
        // BUT skip players who just made respawn decisions
        const poweredDownPlayers: Player[] = [];
        const playersWhoMadeRespawnDecisions = gameState.playersWhoMadeRespawnDecisions || [];

        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];

            if (player.powerState === PowerState.OFF && player.lives > 0) {
                // Skip players who just made respawn power-down decisions
                if (playersWhoMadeRespawnDecisions.includes(playerId)) {
                    console.log(`Skipping regular power-down prompt for ${player.name} - they just made a respawn decision`);
                    continue;
                }

                poweredDownPlayers.push(player);
                // Send power down option ONLY to the specific player
                // Use setTimeout to ensure it's sent after the game state update
                setTimeout(() => {
                    console.log(`Emitting power-down-option ONLY to powered-down player ${player.id} (${player.name})`);
                    this.io.to(player.id).emit('power-down-option', {
                        message: 'You are powered down. Stay powered down for another turn?'
                    });
                }, 100);
                console.log(`Waiting for ${player.name} to decide on continuing power down...`);
            }
        }

        // If there are powered down players, we need to wait for their decisions
        // This should be handled via a separate phase or waiting mechanism
        // For now, we'll set a flag
        if (poweredDownPlayers.length > 0) {
            gameState.waitingForPowerDownDecisions = poweredDownPlayers.map(p => p.id);
            gameState.phase = GamePhase.POWER_DOWN_DECISION;
            // Return early - actual card dealing will happen after decisions are made
            return;
        }

        // Clear the respawn decisions tracking after dealing cards
        gameState.playersWhoMadeRespawnDecisions = undefined;

        // STEP 2: If no one is powered down (or after decisions are made), proceed with dealing
        this.proceedWithDealingCards(gameState);
    }

    // New method to actually deal cards after power down decisions
    // New method to actually deal cards after power down decisions
    proceedWithDealingCards(gameState: ServerGameState): void {
        // First, determine which cards are locked in registers
        const lockedCards: ProgramCard[] = [];
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            const lockedCount = Math.max(0, player.damage - 4);
            player.lockedRegisters = lockedCount;

            if (lockedCount > 0) {
                const locked = player.selectedCards.slice(5 - lockedCount);
                locked.forEach(card => {
                    if (card) {
                        lockedCards.push(card);
                    }
                });
            }
        }

        const deck = this.createDeck(lockedCards);
        //console.log('created deck', deck);

        this.shuffleDeck(deck);
        //console.log('shuffled deck', deck);

        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            if (player.lives > 0) {
                this.dealCardsToPlayer(gameState.roomCode, player, deck);
            }
        }

        gameState.phase = GamePhase.PROGRAMMING;
        gameState.cardsDealt = true;
        gameState.waitingForPowerDownDecisions = undefined;
        // Clear the respawn decisions tracking after dealing cards
        gameState.playersWhoMadeRespawnDecisions = undefined;
        
        // Clear timer state for new turn
        gameState.timerStartTime = undefined;
        gameState.timerDuration = undefined;
        this.stopTimer(gameState.roomCode);
        
        // Emit timer clear to clients
        this.io.to(gameState.roomCode).emit('timer-update', { timeLeft: 0 });

        // Emit the updated game state
        this.io.to(gameState.roomCode).emit('game-state', gameState);

        // Check if all players are already submitted (e.g., all powered down)
        // This prevents getting stuck when all players are powered down
        const allSubmitted = Object.values(gameState.players).every(p =>
            p.submitted || p.powerState === 'OFF' || p.lives <= 0
        );

        if (allSubmitted) {
            console.log('All players already submitted after dealing cards, starting execution phase...');
            this.executeProgramPhase(gameState);
        }
    }

    submitCards(gameState: ServerGameState, playerId: string, cards: (ProgramCard | null)[]): void {
        console.log(`PLAYER ${playerId} SUBMITS CARDS:`, cards);
        const player = gameState.players[playerId];
        if (player) {
            player.selectedCards = cards;
        }
    }

    resetCards(gameState: ServerGameState, playerId: string): void {
        console.log(`PLAYER ${playerId} RESET CARDS`);
        const player = gameState.players[playerId];
        if (player) {
            // Calculate locked registers based on damage
            const lockedCount = Math.max(0, player.damage - 4);

            // Keep locked registers (at the end) unchanged
            // Registers lock from 5 down to 1 (indices 4 down to 0)
            // Only clear non-locked registers (from the beginning)
            for (let i = 0; i < 5 - lockedCount; i++) {
                player.selectedCards[i] = null;
            }

            player.submitted = false;
            console.log(`Reset cards for ${player.name}. Locked registers: ${lockedCount}`);
        }
    }

    // lib/game/gameEngine.ts - Updated executeProgramPhase method

    async executeProgramPhase(gameState: ServerGameState): Promise<void> {
        console.log('All players submitted! Starting execution phase...');
        gameState.phase = GamePhase.EXECUTING;

        // Announce power down decisions now that all cards are submitted
        const announcingPlayers = Object.values(gameState.players).filter(p => p.powerState === PowerState.ANNOUNCING);
        if (announcingPlayers.length > 0) {
            for (const player of announcingPlayers) {
                this.io.to(gameState.roomCode).emit('execution-log', {
                    message: `${player.name} announced power down`,
                    type: 'power-down'
                });
            }
        }

        //gameState.currentRegister = 0;

        // Reset submitted flags for next round
        //Object.values(gameState.players).forEach(p => p.submitted = false);

        //this.io.to(gameState.roomCode).emit('game-state', gameState);

        // Execute all 5 registers
        await this.executeRegisters(gameState, gameState.roomCode);
        //console.log('Registers executed, moving to cleanup phase...');

        // If game ended during register execution, don't continue
        if ((gameState.phase as GamePhase) === GamePhase.ENDED) return;

        // Respawn any dead robots and check if we need to wait for their decisions
        const needToWaitForRespawnDecisions = this.respawnDeadRobots(gameState);

        if (needToWaitForRespawnDecisions) {
            console.log('Waiting for respawn power-down decisions before ending turn...');
            // Don't call endTurn yet - it will be called after all respawn decisions are made
            return;
        }

        // 2. TODO: Handle repairs & upgrades

        // 3. TODO: Handle power downs

        // 4. End turn and start programming phase for the next turn
        this.endTurn(gameState);
    }


    // Execute all 5 registers
    async executeRegisters(gameState: ServerGameState, roomCode: string) {
        for (let i = 0; i < 5; i++) {
            gameState.currentRegister = i;
            
            // Reset Shield and Power-Down Shield usage for all players at the start of each register
            Object.values(gameState.players).forEach(player => {
                if (player.optionCards) {
                    player.optionCards.forEach(card => {
                        if (card.type === OptionCardType.SHIELD || card.type === OptionCardType.POWER_DOWN_SHIELD) {
                            card.usedThisRegister = false;
                            // For Power-Down Shield, track which directions have blocked damage this register
                            card.directionsUsed = [];
                        }
                    });
                }
            });
            
            this.io.to(roomCode).emit('register-start', { register: i });

            this.io.to(roomCode).emit('register-started', {
                register: i,
                registerNumber: i + 1
            });

            await this.executeRegister(gameState, i);

            const playerToLog = gameState.players[gameState.host];
            console.log(`Player ${playerToLog.name} (${gameState.host}) submitted cards:`, playerToLog.selectedCards);

            // Execute board elements after player cards have been executed for this register phase
            await this.executeBoardElements(gameState);

            // Broadcast updated game state after each register
            this.io.to(gameState.roomCode).emit('game-state', gameState);

            // Check if game ended
            if (gameState.phase === 'ended') {
                console.log(`Game ended! Winner: ${gameState.winner}`);
                this.io.to(roomCode).emit('game-over', { winner: gameState.winner || 'No winner' });
                return;
            }

            // Check if all players are dead
            if (gameState.allPlayersDead) {
                console.log('All players are dead, ending turn early.');
                break; // Exit the register loop
            }

            // Delay between registers
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async endTurn(gameState: ServerGameState): Promise<void> {
        // Don't end turn if game has already ended
        if (gameState.phase === GamePhase.ENDED) return;

        console.log('Ending turn and dealing cards for next turn');

        // Execute repairs at the end of the turn (robots on repair sites get healed)
        await this.executeRepairs(gameState);

        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];

            if (player.lives > 0) {
                // 2. Wipe registers - discard all program cards from non-locked registers
                // Clear selected cards (keeping locked ones if damage >= 5)
                const lockedCount = Math.max(0, player.damage - 4);
                console.log("CLEANING UP CARDS FOR PLAYER", player.name, "LOCKED COUNT:", lockedCount);
                for (let i = 0; i < 5 - lockedCount; i++) {
                    player.selectedCards[i] = null;
                }

                // 3. Reset submission state for next turn
                player.submitted = false; //is this needed or does dealCards handle it?

                // 4. Clear dealt cards (they were used this turn)
                player.dealtCards = []; //is this needed or does dealCards handle it?
            }
        }

        // 5. Deal new cards for the next turn
        console.log('Dealing new cards for next turn');
        gameState.currentRegister = 0;
        gameState.roundNumber++;
        gameState.allPlayersDead = false; // Reset the flag
        this.dealCards(gameState);

        // 6. Reset turn number (if tracking)
        //gameState.turnNumber = (gameState.turnNumber || 0) + 1;
        this.io.to(gameState.roomCode).emit('game-state', gameState);
    }

    async executeRegister(gameState: ServerGameState, registerIndex: number): Promise<void> {
        // Don't execute register if game has ended
        if (gameState.phase === GamePhase.ENDED) return;

        console.log(`Executing register ${registerIndex + 1}`);
        const programmedCards: Array<{ playerId: string; card: ProgramCard; player: Player }> = [];

        Object.entries(gameState.players).forEach(([playerId, player]) => {
            if (player.lives > 0 && player.selectedCards[registerIndex]) {
                programmedCards.push({
                    playerId,
                    card: player.selectedCards[registerIndex] as ProgramCard,
                    player
                });
            }
        });

        programmedCards.sort((a, b) => b.card.priority - a.card.priority);

        console.log('Cards to execute this register:', programmedCards.map(c =>
            `${c.player.name}: ${c.card.type}(${c.card.priority})`
        ));

        //var playerToLog = gameState.players[gameState.host];
        //console.log(`BEFORE EXECUTING THIS REGISTER: Player ${playerToLog.name}'s CARDS:`, playerToLog.selectedCards);

        for (const { playerId, card, player } of programmedCards) {
            if (player.isDead) continue;

            //console.log(`BEFORE EXECUTING THIS CARD: Player ${playerToLog.name}'s CARDS:`, playerToLog.selectedCards);
            console.log(`${player.name} executes ${card.type} (priority ${card.priority})`);
            await this.executeCard(gameState, player, card);
            //console.log(`AFTER EXECUTING THIS CARD: Player ${playerToLog.name}'s CARDS:`, playerToLog.selectedCards);
            this.io.to(gameState.roomCode).emit('card-executed', {
                playerId,
                playerName: player.name,
                card,
                register: registerIndex
            });
            this.io.to(gameState.roomCode).emit('game-state', gameState);
            await new Promise(resolve => setTimeout(resolve, this.registerExecutionDelay));
        }
        //console.log(`AFTER EXECUTING THIS REGISTER: Player ${playerToLog.name}'s CARDS:`, playerToLog.selectedCards);
    }

    async executeCard(gameState: ServerGameState, player: Player, card: ProgramCard): Promise<void> {
        switch (card.type) {
            case CardType.MOVE_1:
                await this.moveRobot(gameState, player, 1);
                break;
            case CardType.MOVE_2:
                await this.moveRobot(gameState, player, 2);
                break;
            case CardType.MOVE_3:
                // Check for Fourth Gear option card
                let moveDistance = 3;
                if (player.optionCards?.some(card => card.type === OptionCardType.FOURTH_GEAR)) {
                    moveDistance = 4;
                    console.log(`${player.name} has Fourth Gear - moving 4 spaces instead of 3`);
                }
                await this.moveRobot(gameState, player, moveDistance);
                break;
            case CardType.BACK_UP:
                // TODO: Implement Reverse Gear option (requires player choice)
                await this.moveRobot(gameState, player, -1);
                break;
            case CardType.ROTATE_LEFT:
                player.direction = (player.direction + 3) % 4;
                break;
            case CardType.ROTATE_RIGHT:
                player.direction = (player.direction + 1) % 4;
                break;
            case CardType.U_TURN:
                player.direction = (player.direction + 2) % 4;
                break;
        }
    }

    async moveRobot(gameState: ServerGameState, player: Player, distance: number): Promise<void> {
        const direction = distance < 0 ?
            (player.direction + 2) % 4 :
            player.direction;
        const moves = Math.abs(distance);

        for (let i = 0; i < moves; i++) {
            const vector = this.DIRECTION_VECTORS[direction];
            const currentPos = { x: player.position.x, y: player.position.y };
            const newX = player.position.x + vector.x;
            const newY = player.position.y + vector.y;
            const newPos = { x: newX, y: newY };

            // Check for walls blocking the movement first (even if destination is off-board)
            if (hasWallBetween(currentPos, newPos, gameState.course.board)) {
                // Movement blocked by wall, stop here
                this.executionLog(gameState, `${player.name} blocked by wall`);
                break;
            }

            // Check if move is off the board (after wall check)
            if (newX < 0 || newX >= gameState.course.board.width ||
                newY < 0 || newY >= gameState.course.board.height) {
                this.destroyRobot(gameState, player, 'fell off board');
                break;
            }

            // Check for other robots
            const occupant = this.getPlayerAt(gameState, newX, newY);
            if (occupant) {
                // Try to push the other robot (pass the pusher, this is active movement)
                const pushed = await this.pushRobot(gameState, occupant, direction, player, true);
                if (!pushed) {
                    // Can't push (blocked by wall or another robot), movement stops
                    break;
                } else {
                    // Successfully pushed, continue moving
                    this.executionLog(gameState, `${player.name} pushed ${occupant.name}`);
                }
            }

            // Movement is valid, update position
            player.position.x = newX;
            player.position.y = newY;
        }
    }


    async pushRobot(gameState: ServerGameState, playerToPush: Player, direction: Direction, pusher?: Player, isActiveMovement: boolean = false): Promise<boolean> {
        const vector = this.DIRECTION_VECTORS[direction];
        const currentPos = { x: playerToPush.position.x, y: playerToPush.position.y };
        const newX = playerToPush.position.x + vector.x;
        const newY = playerToPush.position.y + vector.y;
        const newPos = { x: newX, y: newY };

        // Check for walls blocking the push first (even if destination is off-board)
        if (hasWallBetween(currentPos, newPos, gameState.course.board)) {
            // Can't push through wall
            this.executionLog(gameState, `${playerToPush.name} cannot be pushed through wall`);
            return false;
        }

        // Check if push would go off the board (after wall check)
        if (newX < 0 || newX >= gameState.course.board.width ||
            newY < 0 || newY >= gameState.course.board.height) {
            this.destroyRobot(gameState, playerToPush, 'fell off board');
            return true; // Pushed off the board
        }

        // Check for other robots in the push destination
        const occupant = this.getPlayerAt(gameState, newX, newY);
        if (occupant) {
            // Try to push the next robot in the chain
            // For chain pushing, the robot being pushed becomes the pusher for the next robot
            // Chain pushes are NOT active movement (false)
            const pushed = await this.pushRobot(gameState, occupant, direction, playerToPush, false);
            if (!pushed) {
                return false; // Chain pushing failed
            }
        }

        // Push is valid, update position
        playerToPush.position.x = newX;
        playerToPush.position.y = newY;
        
        // Check for Ramming Gear and apply damage
        // Only applies when the robot with Ramming Gear is actively moving (not being pushed or moved by conveyors)
        if (pusher && isActiveMovement) {
            const pusherHasRammingGear = pusher.optionCards?.some(card => card.type === OptionCardType.RAMMING_GEAR);
            
            if (pusherHasRammingGear) {
                // Target takes damage from being pushed by robot with Ramming Gear during active movement
                playerToPush.damage = (playerToPush.damage || 0) + 1;
                this.executionLog(gameState, `${playerToPush.name} damaged by ${pusher.name}'s Ramming Gear`, 'option');
                
                // Check if robot is destroyed
                if (playerToPush.damage >= 10) {
                    this.destroyRobot(gameState, playerToPush, 'took too much damage');
                }
            }
        }
        
        return true;
    }

    getPlayerAt(gameState: ServerGameState, x: number, y: number): Player | undefined {
        return Object.values(gameState.players).find(p => p.position.x === x && p.position.y === y && !p.isDead);
    }
    
    // Helper function to determine what direction damage is coming from
    getIncomingDamageDirection(targetPos: Position, shooterPos: Position): Direction | null {
        const dx = shooterPos.x - targetPos.x;
        const dy = shooterPos.y - targetPos.y;
        
        // Determine the primary direction
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else if (dy !== 0) {
            return dy > 0 ? Direction.DOWN : Direction.UP;
        }
        
        return null; // Same position
    }

    async processDamageForMultiplePlayers(
        gameState: ServerGameState,
        playersWithDamage: Array<{
            playerId: string;
            damageInfo: DamageInfo;
            totalDamage: number;
            damageSource: string;
        }>
    ): Promise<void> {
        console.log(`[DamagePrevention] Processing damage for ${playersWithDamage.length} players in parallel`);
        
        // Initialize pending damage for all affected players
        if (!gameState.pendingDamage) {
            gameState.pendingDamage = new Map();
        }
        
        // Track which players need manual damage prevention dialog
        const playersNeedingDialog: string[] = [];
        
        // Process automatic damage prevention and determine who needs dialog
        for (const { playerId, totalDamage, damageSource, damageInfo } of playersWithDamage) {
            const player = gameState.players[playerId];
            if (!player || player.lives <= 0) continue;
            
            let remainingDamage = totalDamage;
            console.log(`[DamagePrevention] Player ${player.name} taking ${totalDamage} damage from ${damageSource}`);
            
            // Apply automatic damage prevention cards
            if (player.optionCards && player.optionCards.length > 0) {
                // Check for Shield (blocks first robot laser from the front this register)
                const shieldCard = player.optionCards.find(card => card.type === OptionCardType.SHIELD);
                if (shieldCard && !damageSource.includes('board laser') && damageInfo.robotHits.length > 0) {
                    // Check if any robot damage is from the front
                    const frontHit = damageInfo.robotHits.find(hit => {
                        if (!hit.shooterPosition) return false;
                        // Determine if shooter is in front of this player
                        const isFromFront = this.isDamageFromFront(player, hit.shooterPosition);
                        return isFromFront;
                    });
                    
                    if (frontHit && !shieldCard.usedThisRegister) {
                        console.log(`[DamagePrevention] Shield automatically blocks robot laser damage from front for ${player.name}`);
                        this.executionLog(gameState, `${player.name}'s Shield blocks laser damage from the front`, 'option');
                        // Shield blocks one source of damage from the front
                        remainingDamage = Math.max(0, remainingDamage - frontHit.damage);
                        shieldCard.usedThisRegister = true;
                    }
                }
                
                // Check for Power-Down Shield (only works when powered down)
                const powerDownShield = player.optionCards.find(card => card.type === OptionCardType.POWER_DOWN_SHIELD);
                if (powerDownShield && player.powerState === PowerState.OFF) {
                    // Power-Down Shield blocks 1 damage from each direction per register
                    if (!powerDownShield.directionsUsed) {
                        powerDownShield.directionsUsed = [];
                    }
                    
                    // Process each damage source individually
                    let damageBlocked = 0;
                    // Find the damage info for this player
                    const playerDamageData = playersWithDamage.find(pd => pd.playerId === playerId);
                    if (playerDamageData) {
                        // Process robot laser hits
                        if (playerDamageData.damageInfo.robotHits) {
                            for (const hit of playerDamageData.damageInfo.robotHits) {
                                if (hit.shooterPosition && damageBlocked < remainingDamage) {
                                    const incomingDirection = this.getIncomingDamageDirection(player.position, hit.shooterPosition);
                                    if (incomingDirection !== null && !powerDownShield.directionsUsed.includes(incomingDirection)) {
                                        // Block 1 damage from this direction
                                        const blocked = Math.min(hit.damage, 1);
                                        damageBlocked += blocked;
                                        powerDownShield.directionsUsed.push(incomingDirection);
                                        
                                        const directionName = ['UP', 'RIGHT', 'DOWN', 'LEFT'][incomingDirection];
                                        console.log(`[DamagePrevention] Power-Down Shield blocks ${blocked} damage from ${directionName} (robot laser) for powered-down ${player.name}`);
                                        this.executionLog(gameState, `${player.name}'s Power-Down Shield blocks robot laser from ${directionName}`, 'option');
                                    }
                                }
                            }
                        }
                        
                        // Process board laser hits
                        if (playerDamageData.damageInfo.boardHits) {
                            for (const hit of playerDamageData.damageInfo.boardHits) {
                                if (hit.laserPosition && damageBlocked < remainingDamage) {
                                    const incomingDirection = this.getIncomingDamageDirection(player.position, hit.laserPosition);
                                    if (incomingDirection !== null && !powerDownShield.directionsUsed.includes(incomingDirection)) {
                                        // Block 1 damage from this direction
                                        const blocked = Math.min(hit.damage, 1);
                                        damageBlocked += blocked;
                                        powerDownShield.directionsUsed.push(incomingDirection);
                                        
                                        const directionName = ['UP', 'RIGHT', 'DOWN', 'LEFT'][incomingDirection];
                                        console.log(`[DamagePrevention] Power-Down Shield blocks ${blocked} damage from ${directionName} (board laser) for powered-down ${player.name}`);
                                        this.executionLog(gameState, `${player.name}'s Power-Down Shield blocks board laser from ${directionName}`, 'option');
                                    }
                                }
                            }
                        }
                    }
                    
                    remainingDamage = Math.max(0, remainingDamage - damageBlocked);
                    if (damageBlocked > 0) {
                        powerDownShield.usedThisRegister = true;
                    }
                }
                
                // Check for Ablative Coat
                if (remainingDamage > 0) {
                    const ablativeCard = player.optionCards.find(card => card.type === OptionCardType.ABLATIVE_COAT);
                    if (ablativeCard) {
                        const absorbed = ablativeCard.damageAbsorbed || 0;
                        const canAbsorb = Math.min(remainingDamage, 3 - absorbed);
                        if (canAbsorb > 0) {
                            ablativeCard.damageAbsorbed = absorbed + canAbsorb;
                            remainingDamage -= canAbsorb;
                            console.log(`[DamagePrevention] Ablative Coat automatically absorbs ${canAbsorb} damage for ${player.name}`);
                            this.executionLog(gameState, `${player.name}'s Ablative Coat absorbs ${canAbsorb} damage (${ablativeCard.damageAbsorbed}/3)`, 'option');
                            
                            // Remove card if fully used
                            if (ablativeCard.damageAbsorbed >= 3) {
                                player.optionCards = player.optionCards.filter(c => c.id !== ablativeCard.id);
                                this.executionLog(gameState, `${player.name}'s Ablative Coat is fully used and discarded`, 'option');
                                // Add to discard pile
                                if (!gameState.discardedOptions) gameState.discardedOptions = [];
                                gameState.discardedOptions.push(ablativeCard);
                            }
                        }
                    }
                }
                
                // Check if player has any cards they can discard for damage prevention
                // In RoboRally, ANY option card can be discarded to prevent 1 damage
                // Only exclude Ablative Coat (always automatic)
                // Shield and Power-Down Shield can be manually discarded when their automatic effects don't apply
                const hasManualCards = player.optionCards.some(card => 
                    card.type !== OptionCardType.ABLATIVE_COAT
                );
                
                if (remainingDamage > 0 && hasManualCards) {
                    // Player needs dialog for manual damage prevention choices
                    playersNeedingDialog.push(playerId);
                    gameState.pendingDamage.set(playerId, {
                        amount: remainingDamage,
                        source: damageSource,
                        prevented: 0,
                        completed: false
                    });
                    
                    // Send all cards except Ablative Coat (which is always automatic)
                    // Shield and Power-Down Shield can be manually discarded when their automatic effects don't apply
                    // Any option card can be discarded to prevent 1 damage
                    const manualCards = player.optionCards.filter(card => 
                        card.type !== OptionCardType.ABLATIVE_COAT
                    );
                    
                    console.log(`[DamagePrevention] Emitting damage-prevention-opportunity to ${player.name} for ${remainingDamage} damage`);
                    this.io.to(playerId).emit('damage-prevention-opportunity', {
                        damageAmount: remainingDamage,
                        source: damageSource,
                        optionCards: manualCards
                    });
                } else if (remainingDamage > 0) {
                    // Apply remaining damage immediately
                    player.damage += remainingDamage;
                    console.log(`[DamagePrevention] Applied ${remainingDamage} damage to ${player.name}`);
                }
            } else {
                // No option cards, apply damage immediately
                player.damage += remainingDamage;
                console.log(`[DamagePrevention] No option cards for ${player.name}, applied ${remainingDamage} damage`);
            }
        }
        
        // If no players need dialog, we're done
        if (playersNeedingDialog.length === 0) {
            console.log(`[DamagePrevention] No players need manual damage prevention, damage application complete`);
            return;
        }
        
        console.log(`[DamagePrevention] Waiting for ${playersNeedingDialog.length} players to complete damage prevention`);
        
        // Wait for all players needing dialog to complete their choices (15 second timeout)
        await new Promise(resolve => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                // Check if all players have completed
                let allCompleted = true;
                for (const playerId of playersNeedingDialog) {
                    const pending = gameState.pendingDamage?.get(playerId);
                    if (pending && !pending.completed) {
                        allCompleted = false;
                        break;
                    }
                }
                
                // Check if timeout reached
                const elapsed = Date.now() - startTime;
                const timeout = this.config?.damagePreventionTimeout || 15000;
                if (allCompleted || elapsed >= timeout) {
                    clearInterval(checkInterval);
                    console.log(`[DamagePrevention] All players completed or timeout reached after ${elapsed}ms`);
                    resolve(true);
                }
            }, 50); // Check every 50ms
        });
        
        // Apply final damage for all players with pending damage
        for (const playerId of playersNeedingDialog) {
            const player = gameState.players[playerId];
            const pending = gameState.pendingDamage?.get(playerId);
            if (!pending) continue;
            
            const finalDamage = Math.max(0, pending.amount - pending.prevented);
            player.damage += finalDamage;
            
            console.log(`[DamagePrevention] Applied final damage to ${player.name}: ${finalDamage} (prevented ${pending.prevented} of ${pending.amount})`);
            
            // Clean up
            gameState.pendingDamage.delete(playerId);
        }
        
        // Emit updated game state
        this.io.to(gameState.roomCode).emit('game-state', gameState);
    }

    async applyDamageWithOptions(
        gameState: ServerGameState, 
        playerId: string, 
        damageAmount: number, 
        source: string
    ): Promise<number> {
        const player = gameState.players[playerId];
        if (!player || player.lives <= 0) return 0;
        
        console.log(`[DamagePrevention] Player ${player.name} taking ${damageAmount} damage from ${source}`);
        console.log(`[DamagePrevention] Player has ${player.optionCards?.length || 0} option cards`);
        
        // If player has no option cards, apply damage immediately
        if (!player.optionCards || player.optionCards.length === 0) {
            console.log(`[DamagePrevention] No option cards, applying damage immediately`);
            player.damage += damageAmount;
            return damageAmount;
        }
        
        // Store pending damage info
        if (!gameState.pendingDamage) {
            gameState.pendingDamage = new Map();
            console.log(`[DamagePrevention] Created new pendingDamage Map`);
        }
        gameState.pendingDamage.set(playerId, {
            amount: damageAmount,
            source,
            prevented: 0,
            completed: false
        });
        console.log(`[DamagePrevention] Set pending damage for ${playerId}: ${damageAmount} from ${source}`);
        
        // Emit damage prevention opportunity
        console.log(`[DamagePrevention] Emitting damage-prevention-opportunity to ${playerId}`);
        this.io.to(playerId).emit('damage-prevention-opportunity', {
            damageAmount,
            source,
            optionCards: player.optionCards
        });
        
        // WAIT for player to make choices (15 second timeout)
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                const pending = gameState.pendingDamage?.get(playerId);
                // Resolve if player completed the dialog or prevented all damage
                if (!pending || pending.completed || pending.prevented >= damageAmount) {
                    clearInterval(checkInterval);
                    clearTimeout(timeout);
                    console.log(`[DamagePrevention] Resolving early - completed: ${pending?.completed}, prevented: ${pending?.prevented}/${damageAmount}`);
                    resolve(true);
                }
            }, 50); // Check every 50ms for faster response
            
            const timeout = setTimeout(() => {
                clearInterval(checkInterval);
                console.log(`[DamagePrevention] Timeout for ${player.name}`);
                resolve(false);
            }, this.config.damagePreventionTimeout); // Use configured timeout
        });
        
        // Apply final damage after prevention
        const pending = gameState.pendingDamage?.get(playerId);
        const finalDamage = Math.max(0, damageAmount - (pending?.prevented || 0));
        player.damage += finalDamage;
        
        console.log(`[DamagePrevention] Applied final damage: ${finalDamage}, player now has ${player.damage} total damage`);
        
        // Clean up
        if (gameState.pendingDamage?.has(playerId)) {
            gameState.pendingDamage.delete(playerId);
        }
        
        // Emit updated game state
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        
        return finalDamage;
    }

    destroyRobot(gameState: ServerGameState, player: Player, reason: string): void {
        if (player.isDead) return;

        console.log(`${player.name} destroyed: ${reason}`);

        player.lives--;
        player.damage = 2;
        player.isDead = true;
        player.position = { x: -1, y: -1 };

        this.io.to(gameState.roomCode).emit('robot-destroyed', {
            playerName: player.name,
            reason: reason
        });

        if (player.lives <= 0) {
            console.log(`${player.name} is out of lives!`);

            // Reset power state for eliminated players
            player.powerState = PowerState.ON;
            player.announcedPowerDown = false;

            // Clear cards and registers for eliminated players
            player.dealtCards = [];
            player.selectedCards = [null, null, null, null, null];
            player.submitted = true; // Mark as submitted so they don't block game progression

            this.io.to(gameState.roomCode).emit('robot-destroyed', {
                playerName: player.name,
                reason: 'out of lives'
            });

            // Check for "last robot standing" win condition after elimination
            this.checkLastRobotStanding(gameState);
        }

        const allPlayers = Object.values(gameState.players);
        const allDead = allPlayers.every(p => p.isDead || p.lives <= 0);
        if (allDead) {
            gameState.allPlayersDead = true;
            console.log('All players are destroyed. Turn will end early.');
        }
    }

    performRespawn(gameState: ServerGameState, playerId: string, direction: Direction) {
        const player = gameState.players[playerId];
        if (!player || !player.awaitingRespawn) return;

        console.log(`Performing respawn for ${player.name} at archive position facing ${Direction[direction]}`);

        // Respawn at archive position with chosen direction
        player.position = { ...player.archiveMarker };
        player.direction = direction;

        // Robot is no longer dead or awaiting respawn
        player.isDead = false;
        player.awaitingRespawn = false;

        // Check if player has Superior Archive option card
        const hasSuperiorArchive = player.optionCards?.some(card => card.type === OptionCardType.SUPERIOR_ARCHIVE);
        
        if (hasSuperiorArchive) {
            // Superior Archive prevents the normal 2 damage tokens when respawning
            player.damage = 0;
            this.executionLog(gameState, `${player.name} respawns with Superior Archive - no damage!`, 'option');
        } else {
            // Robots reenter with 2 damage tokens (per rules)
            player.damage = 2;
        }

        this.io.to(gameState.roomCode).emit('robot-respawned', {
            playerName: player.name,
            position: player.position,
            direction: player.direction,
            damage: player.damage
        });
    }

    respawnDeadRobots(gameState: ServerGameState): boolean {
        const respawningPlayers: string[] = [];
        Object.values(gameState.players).forEach(player => {
            if (player.isDead) {
                console.log(`Checking respawn for ${player.name}: lives=${player.lives}, isDead=${player.isDead}`);
                if (player.lives > 0) {
                    console.log(`${player.name} will respawn at their archive marker.`);

                    // Clear previous turn's registers BEFORE showing respawn decision (cosmetic fix)
                    player.selectedCards = [null, null, null, null, null];
                    player.lockedRegisters = 0;
                    player.submitted = false;
                    player.dealtCards = [];

                    // Mark that this player is awaiting respawn (but don't respawn yet!)
                    player.awaitingRespawn = true;

                    // Ask the player to choose direction and power down mode
                    console.log(`Emitting respawn-power-down-option ONLY to player ${player.id} (${player.name})`);
                    this.io.to(player.id).emit('respawn-power-down-option', {
                        message: `You will respawn with 2 damage. Choose your facing direction and whether to enter powered down mode for safety.`,
                        isRespawn: true
                    });

                    // Track that this player needs to make a respawn decision
                    respawningPlayers.push(player.id);
                } else {
                    console.log(`${player.name} has no lives left and is eliminated.`);
                }
            }
        });

        // If we have respawning players, set up the waiting mechanism
        if (respawningPlayers.length > 0) {
            gameState.waitingForRespawnDecisions = respawningPlayers;
            // Initialize the tracking array for players who made respawn decisions
            gameState.playersWhoMadeRespawnDecisions = [];
            console.log(`Waiting for respawn decisions from: ${respawningPlayers.map(id => gameState.players[id].name).join(', ')}`);
            return true; // Indicate we need to wait
        }

        return false; // No respawning players, can proceed immediately
    }

    async executeBoardElements(gameState: ServerGameState) {
        // Don't execute board elements if game has ended
        if (gameState.phase === GamePhase.ENDED) return;

        console.log('Executing board elements...');
        await this.executeConveyorBelts(gameState, true, false);
        await this.executeConveyorBelts(gameState, true, true);
        await this.executePushers(gameState);
        await this.executeGears(gameState);
        await this.executePits(gameState);
        await this.executeLasers(gameState);
        await this.checkCheckpoints(gameState);
    }

    async executeConveyorBelts(gameState: ServerGameState, includeExpress: boolean, includeNormal: boolean) {
        const movements: ConveyorMovement[] = [];
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (!tile) return;
            if ((tile.type === TileType.EXPRESS_CONVEYOR && includeExpress) || (tile.type === TileType.CONVEYOR && includeNormal)) {
                if (!tile.direction && tile.direction !== 0) {
                    console.warn(`Conveyor at (${tile.position.x}, ${tile.position.y}) has no direction`);
                    return;
                }
                const vector = this.DIRECTION_VECTORS[tile.direction];
                if (!vector) {
                    console.warn(`Invalid direction ${tile.direction} for conveyor at (${tile.position.x}, ${tile.position.y})`);
                    return;
                }
                const newX = player.position.x + vector.x;
                const newY = player.position.y + vector.y;
                this.executionLog(gameState, `${player.name} moved by conveyor`);
                movements.push({
                    player,
                    to: { x: newX, y: newY },
                    fromTile: tile
                });
            }
        });

        const resolvedMovements = this.resolveConveyorMovements(gameState, movements);

        resolvedMovements.forEach(movement => {
            const { player, to, fromTile } = movement;
            if (to.x < 0 || to.x >= gameState.course.board.width || to.y < 0 || to.y >= gameState.course.board.height) {
                this.destroyRobot(gameState, player, 'fell off board');
                return;
            }
            player.position = { ...to };
            const toTile = this.getTileAt(gameState, to.x, to.y);
            // Only rotate if moving from conveyor to another conveyor (corner conveyors)
            // Don't rotate when moving onto gears or other rotating elements
            if (toTile && toTile.rotate && 
                (fromTile.type === TileType.CONVEYOR || fromTile.type === TileType.EXPRESS_CONVEYOR) &&
                (toTile.type === TileType.CONVEYOR || toTile.type === TileType.EXPRESS_CONVEYOR)) {
                if (toTile.rotate === 'clockwise') {
                    player.direction = (player.direction + 1) % 4;
                } else if (toTile.rotate === 'counterclockwise') {
                    player.direction = (player.direction + 3) % 4;
                }
                this.executionLog(gameState, `${player.name} rotated by conveyor`);
            }
        });
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        await new Promise(resolve => setTimeout(resolve, this.boardElementDelay));
    }

    resolveConveyorMovements(gameState: ServerGameState, movements: ConveyorMovement[]) {
        const resolved: ConveyorMovement[] = [];
        const destinations = new Map();
        movements.forEach(movement => {
            const key = `${movement.to.x},${movement.to.y}`;
            if (!destinations.has(key)) {
                destinations.set(key, []);
            }
            destinations.get(key).push(movement);
        });

        movements.forEach(movement => {
            const destKey = `${movement.to.x},${movement.to.y}`;
            const conflicts = destinations.get(destKey);
            const occupant = this.getPlayerAt(gameState, movement.to.x, movement.to.y);
            if (conflicts.length > 1) {
                return;
            }
            if (occupant && !movements.find(m => m.player.id === occupant.id)) {
                return;
            }
            resolved.push(movement);
        });
        return resolved;
    }

    async executePushers(gameState: ServerGameState) {
        const currentRegister = gameState.currentRegister;
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (!tile || tile.type !== TileType.PUSHER) return;
            if (tile.registers && tile.registers.includes(currentRegister + 1)) {
                this.pushRobot(gameState, player, tile.direction!);
                // if (this.pushRobot(gameState, player, tile.direction!)) {
                //     this.executionLog(gameState, `${player.name} pushed by pusher`);
                //}
            }
        });
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        await new Promise(resolve => setTimeout(resolve, this.boardElementDelay));
    }

    async executeGears(gameState: ServerGameState) {
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (!tile || (tile.type !== TileType.GEAR_CW && tile.type !== TileType.GEAR_CCW)) return;
            if (tile.type === TileType.GEAR_CW) {
                player.direction = (player.direction + 1) % 4;
            } else if (tile.type === TileType.GEAR_CCW) {
                player.direction = (player.direction + 3) % 4;
            }
            this.executionLog(gameState, `${player.name} rotated by gear`);
        });
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        await new Promise(resolve => setTimeout(resolve, this.boardElementDelay));
    }

    async executePits(gameState: ServerGameState) {
        console.log('Executing pits...');
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (!tile || tile.type !== TileType.PIT) return;

            console.log(`${player.name} fell into a pit at (${player.position.x}, ${player.position.y})`);
            this.executionLog(gameState, `${player.name} fell into a pit!`);
            this.destroyRobot(gameState, player, 'fell into a pit');
        });
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        await new Promise(resolve => setTimeout(resolve, this.boardElementDelay));
    }

    async executeLasers(gameState: ServerGameState) {
        const damages = new Map();
        const getDamageInfo = (playerId: string) => {
            if (!damages.has(playerId)) {
                damages.set(playerId, { boardDamage: 0, boardHits: [], robotHits: [] });
            }
            return damages.get(playerId);
        };

        const boardLaserShots: {shooterId: string; targetId?: string; path: LaserPath[]; damage: number; timestamp?: number}[] = [];

        if (gameState.course.board.lasers) {
            gameState.course.board.lasers.forEach(laser => {
                const beam = this.traceLaser(gameState, laser.position.x, laser.position.y, laser.direction, laser.damage || 1, undefined, laser.position);
                
                // Use the path from the beam object for animation
                const path: LaserPath[] = beam.path.map(pos => ({ x: pos.x, y: pos.y }));

                // Create board laser shot animation data
                if (path.length > 0) {
                    boardLaserShots.push({
                        shooterId: `board-laser-${laser.position.x}-${laser.position.y}`,
                        path: path,
                        damage: laser.damage || 1,
                        targetId: beam.hits.length > 0 ? beam.hits[0].player.id : undefined,
                        timestamp: Date.now()
                    });
                }

                beam.hits.forEach(hit => {
                    const info = getDamageInfo(hit.player.id);
                    info.boardDamage += hit.damage;
                    info.boardHits.push({
                        damage: hit.damage,
                        laserPosition: laser.position
                    });
                });
            });
        }

        // Emit board laser animations
        if (boardLaserShots.length > 0) {
            this.io.to(gameState.roomCode).emit('robot-lasers-fired', boardLaserShots);
            await new Promise(resolve => setTimeout(resolve, 600)); // Wait for board laser animation to complete
        }

        const robotLaserShots: {shooterId: string; targetId?: string; targetIds?: string[]; path: LaserPath[]; damage: number; timestamp?: number}[] = [];
        Object.values(gameState.players).forEach(shooter => {
            if (shooter.lives <= 0 || shooter.powerState === PowerState.OFF) return;

            const vector = this.DIRECTION_VECTORS[shooter.direction];

            // Check if there's a wall immediately blocking the robot's laser from firing
            const frontX = shooter.position.x + vector.x;
            const frontY = shooter.position.y + vector.y;

            // Check if robot has option cards that modify laser behavior
            const hasHighPowerLaser = shooter.optionCards?.some(card => card.type === OptionCardType.HIGH_POWER_LASER);
            const hasDoubleBarreledLaser = shooter.optionCards?.some(card => card.type === OptionCardType.DOUBLE_BARRELED_LASER);
            const hasRearFiringLaser = shooter.optionCards?.some(card => card.type === OptionCardType.REAR_FIRING_LASER);

            // Check if robot has a wall in front blocking its laser (unless they have High-Power Laser)
            if (!hasHighPowerLaser && hasWallBetween(shooter.position, { x: frontX, y: frontY }, gameState.course.board)) {
                // Robot's laser is blocked by wall immediately - can't fire front laser
                // But might still be able to fire rear laser
                if (!hasRearFiringLaser) {
                    return;
                }
            }

            // Determine number of shots (Double-Barreled Laser fires 2 shots)
            const numberOfShots = hasDoubleBarreledLaser ? 2 : 1;
            
            // Collect all hits for animation purposes
            const allHits: RobotHit[] = [];
            
            // Fire front laser (if not blocked)
            const canFireFront = hasHighPowerLaser || !hasWallBetween(shooter.position, { x: frontX, y: frontY }, gameState.course.board);
            let frontBeam: LaserBeam | null = null;
            if (canFireFront) {
                for (let shot = 0; shot < numberOfShots; shot++) {
                    // Trace the laser using the standard traceLaser function
                    // Start from the shooter's position, not one tile ahead
                    const beam = this.traceLaser(gameState, shooter.position.x, shooter.position.y, shooter.direction, 1, shooter.name, shooter.position);
                    
                    // Save the first beam for animation (all shots follow same path)
                    if (!frontBeam) {
                        frontBeam = beam;
                    }
                    
                    // Record hits for this shot
                    beam.hits.forEach(hit => {
                        allHits.push(hit);
                        if (hit.player.id !== shooter.id) { // Can't shoot yourself
                            getDamageInfo(hit.player.id).robotHits.push({
                                shooterName: shooter.name,
                                damage: hit.damage,
                                shooterPosition: hit.shooterPosition
                            });
                        }
                    });
                }
            }
            
            // Fire rear laser if robot has Rear-Firing Laser
            let rearBeam: LaserBeam | null = null;
            if (hasRearFiringLaser) {
                // Calculate opposite direction for rear laser
                const oppositeDirection = (shooter.direction + 2) % 4 as Direction;
                const rearVector = this.DIRECTION_VECTORS[oppositeDirection];
                const rearX = shooter.position.x + rearVector.x;
                const rearY = shooter.position.y + rearVector.y;
                
                // Check if rear laser is blocked (rear laser doesn't benefit from High-Power)
                const canFireRear = !hasWallBetween(shooter.position, { x: rearX, y: rearY }, gameState.course.board);
                
                if (canFireRear) {
                    // Rear laser always fires once (doesn't benefit from Double-Barreled or High-Power)
                    rearBeam = this.traceLaser(gameState, shooter.position.x, shooter.position.y, oppositeDirection, 1, shooter.name, shooter.position, false);
                    
                    // Record hits for rear laser
                    rearBeam.hits.forEach(hit => {
                        allHits.push(hit);
                        if (hit.player.id !== shooter.id) {
                            getDamageInfo(hit.player.id).robotHits.push({
                                shooterName: shooter.name,
                                damage: hit.damage,
                                shooterPosition: hit.shooterPosition
                            });
                        }
                    });
                }
                
                console.log(`${shooter.name} fires Rear-Firing Laser`);
                this.executionLog(gameState, `${shooter.name} fires Rear-Firing Laser`, 'option');
            }
            
            if (hasDoubleBarreledLaser) {
                console.log(`${shooter.name} fires Double-Barreled Laser (2 shots)`);
                this.executionLog(gameState, `${shooter.name} fires Double-Barreled Laser`, 'option');
            }

            // Build laser path for front laser animation (if it can fire)
            if (frontBeam && frontBeam.path.length > 0) {
                const path: LaserPath[] = frontBeam.path.map(pos => ({ x: pos.x, y: pos.y }));
                
                // Collect target IDs from all hits in the front direction
                // For Double-Barreled Laser, this will include duplicates
                const frontTargetIds = allHits
                    .filter(hit => {
                        // Check if this hit is from the front laser (same direction as shooter)
                        const dx = hit.player.position.x - shooter.position.x;
                        const dy = hit.player.position.y - shooter.position.y;
                        return (vector.x !== 0 ? Math.sign(dx) === Math.sign(vector.x) : Math.sign(dy) === Math.sign(vector.y));
                    })
                    .map(hit => hit.player.id)
                    .filter(id => id !== shooter.id);
                
                robotLaserShots.push({
                    shooterId: shooter.id,
                    path: path,
                    damage: 1,
                    targetId: frontTargetIds.length > 0 ? frontTargetIds[0] : undefined, // Legacy support
                    targetIds: frontTargetIds.length > 0 ? frontTargetIds : undefined, // All targets for High-Power Laser and Double-Barreled
                    timestamp: Date.now()
                });
            }
            
            // Build laser path for rear laser animation (if robot has Rear-Firing Laser and can fire)
            if (rearBeam && rearBeam.path.length > 0) {
                const rearPath: LaserPath[] = rearBeam.path.map(pos => ({ x: pos.x, y: pos.y }));
                
                // Calculate opposite direction for filtering rear hits
                const oppositeDirection = (shooter.direction + 2) % 4 as Direction;
                const rearVector = this.DIRECTION_VECTORS[oppositeDirection];
                
                // Collect target IDs from all hits in the rear direction
                const rearTargetIds = allHits
                    .filter(hit => {
                        // Check if this hit is from the rear laser (opposite direction from shooter)
                        const dx = hit.player.position.x - shooter.position.x;
                        const dy = hit.player.position.y - shooter.position.y;
                        return (rearVector.x !== 0 ? Math.sign(dx) === Math.sign(rearVector.x) : Math.sign(dy) === Math.sign(rearVector.y));
                    })
                    .map(hit => hit.player.id)
                    .filter(id => id !== shooter.id);
                
                robotLaserShots.push({
                    shooterId: shooter.id,
                    path: rearPath,
                    damage: 1,
                    targetId: rearTargetIds.length > 0 ? rearTargetIds[0] : undefined,
                    targetIds: rearTargetIds.length > 0 ? rearTargetIds : undefined,
                    timestamp: Date.now() + 100 // Slight delay for rear laser animation
                });
            }

        });

        if (robotLaserShots.length > 0) {
            this.io.to(gameState.roomCode).emit('robot-lasers-fired', robotLaserShots);
            await new Promise(resolve => setTimeout(resolve, 600)); // Wait for robot laser animation to complete
        }

        // Collect all players who will take damage
        const playersWithDamage: Array<{
            playerId: string;
            damageInfo: DamageInfo;
            totalDamage: number;
            damageSource: string;
        }> = [];
        
        for (const [playerId, damageInfo] of damages) {
            const totalDamage = damageInfo.boardDamage + damageInfo.robotHits.reduce((sum: number, hit: { shooterName: string; damage: number }) => sum + hit.damage, 0);
            if (totalDamage === 0) continue;
            
            // Build descriptive damage source
            const sources: string[] = [];
            if (damageInfo.boardDamage > 0) {
                sources.push(`board laser (${damageInfo.boardDamage})`);
            }
            if (damageInfo.robotHits.length > 0) {
                const robotSources = damageInfo.robotHits.map((hit: { shooterName: string; damage: number }) => 
                    `${hit.shooterName} (${hit.damage})`
                ).join(', ');
                sources.push(robotSources);
            }
            const damageSource = sources.join(' and ') || 'laser';
            
            playersWithDamage.push({
                playerId,
                damageInfo,
                totalDamage,
                damageSource
            });
        }
        
        // Process all damage prevention in parallel
        if (playersWithDamage.length > 0) {
            await this.processDamageForMultiplePlayers(gameState, playersWithDamage);
        }
        
        // After damage is resolved, handle destruction and notifications
        for (const { playerId, damageInfo } of playersWithDamage) {
            const victim = gameState.players[playerId];
            
            // Handle register locking for powered down robots
            this.handleRegisterLockingDuringPowerDown(gameState, victim);

            if (damageInfo.boardDamage > 0) {
                const message = `${victim.name} takes ${damageInfo.boardDamage} damage from laser`;
                console.log(message);
                this.io.to(gameState.roomCode).emit('robot-damaged', { playerName: victim.name, damage: damageInfo.boardDamage, reason: 'laser' });
            }
            damageInfo.robotHits.forEach((hit) => {
                const message = `${victim.name} shot by ${hit.shooterName}`;
                console.log(message);
                this.io.to(gameState.roomCode).emit('robot-damaged', { playerName: victim.name, damage: hit.damage, reason: hit.shooterName, shooterName: hit.shooterName, message });
            });
            if (victim.damage >= 10) {
                console.log(`${victim.name} is destroyed!`);
                this.destroyRobot(gameState, victim, 'took too much damage');
            }
        }
    }

    traceLaser(gameState: ServerGameState, startX: number, startY: number, direction: Direction, damage: number, shooterName?: string, shooterPosition?: Position, allowHighPower: boolean = true): LaserBeam {
        const hits: RobotHit[] = [];
        const path: Position[] = [];
        const vector = this.DIRECTION_VECTORS[direction];
        let x = startX;
        let y = startY;
        let blockedBy: 'wall' | 'edge' | 'robot' | null = null;
        let endPosition: Position | null = null;
        let endAtFront = false;
        
        // Determine if this is a board laser (starts from back of tile) or robot laser (starts from front)
        const startFromBack = !shooterName;

        // Check if shooter has High-Power Laser (only if allowed)
        let hasHighPowerLaser = false;
        let obstaclesPassed = 0;
        if (shooterName && allowHighPower) {
            const shooter = Object.values(gameState.players).find(p => p.name === shooterName);
            if (shooter?.optionCards?.some(card => card.type === OptionCardType.HIGH_POWER_LASER)) {
                hasHighPowerLaser = true;
                console.log(`${shooterName} has High-Power Laser - can shoot through one obstacle`);
            }
        }

        // First check if there's a robot at the laser origin position (for board lasers)
        if (!shooterName) {
            const playerAtOrigin = this.getPlayerAt(gameState, x, y);
            if (playerAtOrigin) {
                hits.push({ player: playerAtOrigin, damage, shooterName: 'board laser', shooterPosition });
                path.push({ x, y });
                blockedBy = 'robot';
                endPosition = { x, y };
                endAtFront = true; // Stopped at front of tile by robot
                return {
                    startPosition: { x: startX, y: startY },
                    startFromBack,
                    direction,
                    path,
                    hits,
                    blockedBy,
                    endPosition,
                    endAtFront
                };
            }
        }

        // Move through the laser path
        while (true) {
            // Calculate next position
            const nextX = x + vector.x;
            const nextY = y + vector.y;

            // Check if next position is out of bounds
            if (nextX < 0 || nextX >= gameState.course.board.width ||
                nextY < 0 || nextY >= gameState.course.board.height) {
                blockedBy = 'edge';
                endPosition = { x, y }; // Last valid position
                endAtFront = false; // Edge is at the back of the tile
                break;
            }

            // Check for wall blocking the laser path
            const fromPos = { x, y };
            const toPos = { x: nextX, y: nextY };

            if (hasWallBetween(fromPos, toPos, gameState.course.board)) {
                if (hasHighPowerLaser && obstaclesPassed < 1) {
                    // High-Power Laser can shoot through one wall
                    obstaclesPassed++;
                    console.log(`High-Power Laser shooting through wall`);
                } else {
                    // Laser blocked by wall
                    blockedBy = 'wall';
                    endPosition = { x, y }; // Stopped at current position
                    endAtFront = false; // Wall is at the back/edge of the tile
                    break;
                }
            }

            // Move to the next position
            x = nextX;
            y = nextY;
            path.push({ x, y });

            // Check for robot at this position
            const player = this.getPlayerAt(gameState, x, y);
            if (player) {
                hits.push({ player, damage, shooterName: shooterName || 'board laser', shooterPosition });
                
                if (hasHighPowerLaser && obstaclesPassed < 1) {
                    // High-Power Laser can shoot through one robot
                    obstaclesPassed++;
                    console.log(`High-Power Laser shooting through ${player.name}`);
                    // Continue to check for another robot behind this one
                } else {
                    // Normal laser stops at robot
                    blockedBy = 'robot';
                    endPosition = { x, y };
                    endAtFront = true; // Stopped at front of tile by robot
                    break;
                }
            }
        }

        // If we haven't set endPosition yet (path continues to edge normally)
        if (!endPosition && path.length > 0) {
            endPosition = path[path.length - 1];
        }
        
        return {
            startPosition: { x: startX, y: startY },
            startFromBack,
            direction,
            path,
            hits,
            blockedBy,
            endPosition,
            endAtFront
        };
    }

    // Check if damage is coming from the front of the player
    isDamageFromFront(player: Player, shooterPosition: Position): boolean {
        const dx = shooterPosition.x - player.position.x;
        const dy = shooterPosition.y - player.position.y;
        
        // Determine relative direction based on player's facing
        switch (player.direction) {
            case Direction.UP:
                // Front is negative Y (up on screen)
                return dy < 0 && Math.abs(dx) <= Math.abs(dy);
            case Direction.RIGHT:
                // Front is positive X
                return dx > 0 && Math.abs(dy) <= Math.abs(dx);
            case Direction.DOWN:
                // Front is positive Y (down on screen)
                return dy > 0 && Math.abs(dx) <= Math.abs(dy);
            case Direction.LEFT:
                // Front is negative X
                return dx < 0 && Math.abs(dy) <= Math.abs(dx);
            default:
                return false;
        }
    }
    
    // Get tiles adjacent to a position that can be touched with Mechanical Arm
    getAccessibleAdjacentTiles(gameState: ServerGameState, position: Position): { tile: Tile, x: number, y: number }[] {
        const adjacentTiles: { tile: Tile, x: number, y: number }[] = [];
        
        // Check all 8 adjacent positions (orthogonal and diagonal)
        const offsets = [
            { x: 0, y: -1, dir: Direction.UP },      // Up
            { x: 1, y: -1, dir: null },              // Up-Right (diagonal)
            { x: 1, y: 0, dir: Direction.RIGHT },    // Right
            { x: 1, y: 1, dir: null },               // Down-Right (diagonal)
            { x: 0, y: 1, dir: Direction.DOWN },     // Down
            { x: -1, y: 1, dir: null },              // Down-Left (diagonal)
            { x: -1, y: 0, dir: Direction.LEFT },    // Left
            { x: -1, y: -1, dir: null }              // Up-Left (diagonal)
        ];
        
        for (const offset of offsets) {
            const adjX = position.x + offset.x;
            const adjY = position.y + offset.y;
            
            // Check if position is on the board
            if (adjX < 0 || adjX >= gameState.course.board.width ||
                adjY < 0 || adjY >= gameState.course.board.height) {
                continue;
            }
            
            // For orthogonal moves, check if wall blocks the path
            if (offset.dir !== null) {
                const fromPos = { x: position.x, y: position.y };
                const toPos = { x: adjX, y: adjY };
                if (hasWallBetween(fromPos, toPos, gameState.course.board)) {
                    continue; // Wall blocks access
                }
            } else {
                // For diagonal moves, check if either orthogonal path is blocked
                // We need at least one clear orthogonal path to reach diagonal
                const canReachHorizontally = !hasWallBetween(
                    position,
                    { x: adjX, y: position.y },
                    gameState.course.board
                );
                const canReachVertically = !hasWallBetween(
                    position,
                    { x: position.x, y: adjY },
                    gameState.course.board
                );
                
                if (!canReachHorizontally && !canReachVertically) {
                    continue; // Both paths blocked, can't reach diagonal
                }
            }
            
            const tile = this.getTileAt(gameState, adjX, adjY);
            if (tile) {
                adjacentTiles.push({ tile, x: adjX, y: adjY });
            }
        }
        
        return adjacentTiles;
    }

    async checkCheckpoints(gameState: ServerGameState) {
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;

            console.log(`${player.name} checking for checkpoints at position (${player.position.x}, ${player.position.y})`);

            // Check if player is standing on a checkpoint
            const checkpoint = gameState.course.definition.checkpoints.find(
                cp => cp.position.x === player.position.x && cp.position.y === player.position.y
            );

            let touchedCheckpoint = false;

            if (checkpoint && checkpoint.number === player.checkpointsVisited + 1) {
                player.checkpointsVisited++;
                console.log(`${player.name} reached checkpoint ${checkpoint.number}!`);

                // Update archive position when touching a checkpoint
                this.updateArchivePosition(gameState, player);

                this.executionLog(gameState, `${player.name} reached checkpoint ${checkpoint.number}!`);
                touchedCheckpoint = true;

                // Check if player has won
                if (player.checkpointsVisited === gameState.course.definition.checkpoints.length) {
                    gameState.winner = player.name;
                    gameState.phase = GamePhase.ENDED;
                    console.log(`${player.name} wins the game!`);
                    this.io.to(gameState.roomCode).emit('game-over', { winner: player.name });
                    this.saveGameResults(gameState);
                }
            } else if (checkpoint) {
                // Still update archive position even if checkpoint is out of order
                this.updateArchivePosition(gameState, player);
                touchedCheckpoint = true;
            }

            // Check for Mechanical Arm - allows touching adjacent checkpoints
            if (!touchedCheckpoint && player.optionCards?.some(card => card.type === OptionCardType.MECHANICAL_ARM)) {
                const adjacentTiles = this.getAccessibleAdjacentTiles(gameState, player.position);
                
                // Look for the next checkpoint the player needs
                const nextCheckpointNumber = player.checkpointsVisited + 1;
                
                for (const adj of adjacentTiles) {
                    const adjCheckpoint = gameState.course.definition.checkpoints.find(
                        cp => cp.position.x === adj.x && cp.position.y === adj.y
                    );
                    
                    if (adjCheckpoint && adjCheckpoint.number === nextCheckpointNumber) {
                        player.checkpointsVisited++;
                        console.log(`${player.name} reached checkpoint ${adjCheckpoint.number} with Mechanical Arm!`);
                        
                        // Update archive position when touching a checkpoint
                        this.updateArchivePosition(gameState, player);
                        
                        this.executionLog(gameState, `${player.name} reached checkpoint ${adjCheckpoint.number} with Mechanical Arm!`, 'option');
                        
                        // Check if player has won
                        if (player.checkpointsVisited === gameState.course.definition.checkpoints.length) {
                            gameState.winner = player.name;
                            gameState.phase = GamePhase.ENDED;
                            console.log(`${player.name} wins the game!`);
                            this.io.to(gameState.roomCode).emit('game-over', { winner: player.name });
                            this.saveGameResults(gameState);
                        }
                        
                        break; // Only touch one checkpoint
                    }
                }
            }

            // Also check for repair sites to update archive position
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (tile && (tile.type === TileType.REPAIR || tile.type === TileType.OPTION)) {
                this.updateArchivePosition(gameState, player);
            }
        });

        // Check for "last robot standing" win condition
        this.checkLastRobotStanding(gameState);
    }

    checkLastRobotStanding(gameState: ServerGameState) {
        // Don't check if game is already won
        if (gameState.winner) return;

        // Get all players with lives remaining
        const playersAlive = Object.values(gameState.players).filter(player => player.lives > 0);

        // If only one player is alive and there are multiple players total, they win
        if (playersAlive.length === 1 && Object.keys(gameState.players).length > 1) {
            const winner = playersAlive[0];
            gameState.winner = winner.name;
            gameState.phase = GamePhase.ENDED;
            console.log(`${winner.name} wins by being the last robot standing!`);
            this.io.to(gameState.roomCode).emit('game-over', { winner: winner.name });
            this.saveGameResults(gameState);
        }
    }

    async executeRepairs(gameState: ServerGameState) {
        console.log('Executing repairs...');
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0 || player.powerState === PowerState.OFF) return;

            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            const hasMechanicalArm = player.optionCards?.some(card => card.type === OptionCardType.MECHANICAL_ARM);

            // Check if robot is on a checkpoint/flag
            const checkpoint = gameState.course.definition.checkpoints.find(
                cp => cp.position.x === player.position.x && cp.position.y === player.position.y
            );

            // Handle standing on a tile
            if (tile && tile.type === TileType.REPAIR) {
                if (player.damage > 0) {
                    player.damage--;
                    this.executionLog(gameState, `${player.name} repaired 1 damage at repair site`, 'board-element');
                }
                // Update archive position at repair site
                this.updateArchivePosition(gameState, player);
            } else if (tile && tile.type === TileType.OPTION) {
                if (player.damage > 0) {
                    player.damage--;
                }
                // Draw an option card
                this.drawOptionCard(gameState, player);
                // Update archive position at upgrade site
                this.updateArchivePosition(gameState, player);
            } else if (checkpoint) {
                // Flags/checkpoints also act as repair sites
                if (player.damage > 0) {
                    player.damage--;
                    this.executionLog(gameState, `${player.name} repaired 1 damage at checkpoint ${checkpoint.number}`, 'checkpoint');
                }
                // Update archive position at checkpoint (already handled in updateArchivePosition)
                this.updateArchivePosition(gameState, player);
            }

            // Handle Mechanical Arm - can touch adjacent sites
            if (hasMechanicalArm) {
                const adjacentTiles = this.getAccessibleAdjacentTiles(gameState, player.position);
                
                // Priority: next flag > option > repair (includes non-next flags)
                // But we already handled flags in checkCheckpoints, so here we only handle option and repair
                
                let selectedTile: { tile: Tile, x: number, y: number } | null = null;
                let isOption = false;
                
                // First look for option sites
                for (const adj of adjacentTiles) {
                    if (adj.tile.type === TileType.OPTION) {
                        selectedTile = adj;
                        isOption = true;
                        break;
                    }
                }
                
                // If no option site, look for repair sites (including flags that aren't next)
                if (!selectedTile) {
                    for (const adj of adjacentTiles) {
                        if (adj.tile.type === TileType.REPAIR) {
                            selectedTile = adj;
                            break;
                        }
                        
                        // Check if it's a flag (acts as repair site)
                        const adjCheckpoint = gameState.course.definition.checkpoints.find(
                            cp => cp.position.x === adj.x && cp.position.y === adj.y
                        );
                        if (adjCheckpoint) {
                            selectedTile = adj;
                            break;
                        }
                    }
                }
                
                // Apply the effect of the selected adjacent tile
                if (selectedTile) {
                    if (isOption) {
                        if (player.damage > 0) {
                            player.damage--;
                        }
                        this.drawOptionCard(gameState, player);
                        this.executionLog(gameState, `${player.name} used Mechanical Arm to access option site`, 'option');
                    } else {
                        // Repair site or flag
                        if (player.damage > 0) {
                            player.damage--;
                            this.executionLog(gameState, `${player.name} used Mechanical Arm to repair at adjacent site`, 'option');
                        }
                    }
                }
            }
        });

        this.io.to(gameState.roomCode).emit('game-state', gameState);
    }

    drawOptionCard(gameState: ServerGameState, player: Player): void {
        // Check if deck is empty
        if (!gameState.optionDeck || gameState.optionDeck.length === 0) {
            this.executionLog(gameState, `No option cards available in deck`, 'option');
            console.log(`Option deck is empty - no more cards available this game`);
            return;
        }

        // Check if player already has max option cards (7)
        if (!player.optionCards) {
            player.optionCards = [];
        }
        
        const maxOptionCards = 7;
        if (player.optionCards.length >= maxOptionCards) {
            this.executionLog(gameState, `${player.name} already has ${maxOptionCards} option cards (max)`, 'option');
            // TODO: Later implement UI to let player choose which card to keep
            return;
        }

        // Draw a card from the deck
        const drawnCard = gameState.optionDeck.pop();
        if (drawnCard) {
            player.optionCards.push(drawnCard);
            this.executionLog(gameState, `${player.name} drew option card: ${drawnCard.name}`, 'option');
            console.log(`${player.name} drew ${drawnCard.name}. Deck has ${gameState.optionDeck.length} cards remaining`);
        }
    }

    updateArchivePosition(gameState: ServerGameState, player: Player): void {
        // Update archive position when robot ends register on flag or repair site
        const tile = this.getTileAt(gameState, player.position.x, player.position.y);

        // Check if on a checkpoint/flag
        const checkpoint = gameState.course.definition.checkpoints.find(
            cp => cp.position.x === player.position.x && cp.position.y === player.position.y
        );

        // Check if on a repair site
        const isRepairSite = tile && (tile.type === TileType.REPAIR || tile.type === TileType.OPTION);

        if (checkpoint || isRepairSite) {
            player.archiveMarker = { ...player.position };

            const locationType = checkpoint ? `checkpoint ${checkpoint.number}` : 'repair site';
            console.log(`${player.name} updated archive position to (${player.position.x}, ${player.position.y}) at ${locationType}`);

            this.io.to(gameState.roomCode).emit('archive-updated', {
                playerName: player.name,
                position: player.archiveMarker,
                locationType
            });
        }
    }

    getTileAt(gameState: ServerGameState, x: number, y: number): Tile | undefined {
        return getCanonicalTileAt(gameState.course.board, x, y);
    }

    executionLog(gameState: ServerGameState, message: string, type: string = 'info'): void {
        this.io.to(gameState.roomCode).emit('execution-log', { message, type });
    }

    private createDeck(excludedCards: ProgramCard[] = []): ProgramCard[] {
        const deck: ProgramCard[] = [];

        // U-Turn (6 cards, priorities 10-60, step 10)
        for (let i = 0; i < 6; i++) {
            const priority = 10 + i * 10;
            deck.push({ id: priority, type: CardType.U_TURN, priority });
        }

        // Rotate Left (18 cards, priorities 70-410, step 20)
        for (let i = 0; i < 18; i++) {
            const priority = 70 + i * 20;
            deck.push({ id: priority, type: CardType.ROTATE_LEFT, priority });
        }

        // Rotate Right (18 cards, priorities 80-420, step 20)
        for (let i = 0; i < 18; i++) {
            const priority = 80 + i * 20;
            deck.push({ id: priority, type: CardType.ROTATE_RIGHT, priority });
        }

        // Back-Up (6 cards, priorities 430-480, step 10)
        for (let i = 0; i < 6; i++) {
            const priority = 430 + i * 10;
            deck.push({ id: priority, type: CardType.BACK_UP, priority });
        }

        // Move 1 (18 cards, priorities 490-660, step 10)
        for (let i = 0; i < 18; i++) {
            const priority = 490 + i * 10;
            deck.push({ id: priority, type: CardType.MOVE_1, priority });
        }

        // Move 2 (12 cards, priorities 670-780, step 10)
        for (let i = 0; i < 12; i++) {
            const priority = 670 + i * 10;
            deck.push({ id: priority, type: CardType.MOVE_2, priority });
        }

        // Move 3 (6 cards, priorities 790-840, step 10)
        for (let i = 0; i < 6; i++) {
            const priority = 790 + i * 10;
            deck.push({ id: priority, type: CardType.MOVE_3, priority });
        }

        if (excludedCards.length === 0) {
            return deck;
        }

        const excludedIds = new Set(excludedCards.map(c => c.id));
        return deck.filter(card => !excludedIds.has(card.id));
    }

    private shuffleDeck(deck: ProgramCard[]): void {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    private handleRegisterLockingDuringPowerDown(gameState: ServerGameState, player: Player): void {
        // Only applies to powered down robots
        if (player.powerState !== PowerState.OFF) return;

        // Check if damage has increased enough to lock new registers
        const newLockedCount = Math.max(0, player.damage - 4);
        const oldLockedCount = player.lockedRegisters;

        if (newLockedCount > oldLockedCount) {
            console.log(`${player.name} is powered down and took damage - locking ${newLockedCount - oldLockedCount} additional registers`);

            // Create a small deck to draw random cards from
            const tempDeck = this.createDeck([]);
            this.shuffleDeck(tempDeck);

            // Lock additional registers and assign random cards
            for (let registerIndex = 5 - newLockedCount; registerIndex < 5 - oldLockedCount; registerIndex++) {
                if (tempDeck.length > 0) {
                    const randomCard = tempDeck.pop()!;
                    player.selectedCards[registerIndex] = randomCard;
                    console.log(`Locked register ${registerIndex + 1} for ${player.name} with random card: ${randomCard.type} (${randomCard.priority})`);

                    this.io.to(gameState.roomCode).emit('execution-log', {
                        message: `${player.name}'s damaged systems randomly programmed register ${registerIndex + 1} with ${randomCard.type.replace(/_/g, ' ')}`,
                        type: 'system-malfunction'
                    });
                }
            }

            // Update locked register count
            player.lockedRegisters = newLockedCount;
        }
    }

    checkTimerStart(gameState: ServerGameState): void {
        // Don't start timer if already started or game not in programming phase
        if (gameState.timerStartTime || gameState.phase !== GamePhase.PROGRAMMING) {
            return;
        }

        const config = gameState.timerConfig || {
            mode: 'players-remaining',
            threshold: 1,
            duration: 30
        };

        // Count active players (not powered down or dead)
        const activePlayers = Object.values(gameState.players).filter(p =>
            p.lives > 0 && p.powerState !== PowerState.OFF
        );

        // Count how many have submitted
        const submittedCount = activePlayers.filter(p => p.submitted).length;
        const remainingCount = activePlayers.length - submittedCount;

        let shouldStart = false;

        if (config.mode === 'players-remaining') {
            // Start timer when only N players haven't submitted
            shouldStart = remainingCount <= config.threshold && remainingCount > 0;
        } else {
            // Start timer when N players have submitted
            shouldStart = submittedCount >= config.threshold;
        }

        if (shouldStart) {
            console.log(`Starting timer: ${submittedCount} submitted, ${remainingCount} remaining`);
            this.startTimer(gameState, config.duration);
        }
    }

    startTimer(gameState: ServerGameState, duration?: number): void {
        const roomCode = gameState.roomCode;

        // Clear any existing timer for this room
        this.stopTimer(roomCode);

        // Set timer start time and duration
        gameState.timerStartTime = Date.now();
        gameState.timerDuration = duration || 30; // Use provided duration or default to 30

        // Send initial timer update
        this.io.to(roomCode).emit('timer-update', { timeLeft: gameState.timerDuration || 30 });

        // Set up countdown interval (update every second)
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - (gameState.timerStartTime || 0)) / 1000);
            const timeLeft = Math.max(0, (gameState.timerDuration || 30) - elapsed);

            this.io.to(roomCode).emit('timer-update', { timeLeft });

            if (timeLeft === 0) {
                clearInterval(interval);
                this.timerIntervals.delete(roomCode);
            }
        }, 1000);

        this.timerIntervals.set(roomCode, interval);

        // Set up the main timer that expires after the configured duration
        const timer = setTimeout(() => {
            this.onTimerExpired(gameState);
        }, (gameState.timerDuration || 30) * 1000);

        this.timers.set(roomCode, timer);
    }

    stopTimer(roomCode: string): void {
        // Clear the main timer
        const timer = this.timers.get(roomCode);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(roomCode);
        }

        // Clear the countdown interval
        const interval = this.timerIntervals.get(roomCode);
        if (interval) {
            clearInterval(interval);
            this.timerIntervals.delete(roomCode);
        }
    }

    onTimerExpired(gameState: ServerGameState): void {
        console.log(`Timer expired for room ${gameState.roomCode}`);

        // Clear intervals
        this.stopTimer(gameState.roomCode);

        // Emit timer expired event
        this.io.to(gameState.roomCode).emit('timer-expired');

        // Auto-fill empty registers for all players who haven't submitted
        let anyChanges = false;

        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];

            // Skip if player is powered down, dead, or already submitted
            if (player.powerState === PowerState.OFF || player.lives <= 0 || player.submitted) {
                continue;
            }

            // Auto-fill empty registers with random cards from dealt cards
            const availableCards = [...(player.dealtCards || [])];
            const selectedCards = [...(player.selectedCards || [null, null, null, null, null])];

            for (let i = 0; i < 5; i++) {
                if (selectedCards[i] === null && availableCards.length > 0) {
                    // Find a card that hasn't been selected yet
                    const unusedCards = availableCards.filter(card =>
                        !selectedCards.some(selected => selected?.id === card.id)
                    );

                    if (unusedCards.length > 0) {
                        // Pick a random unused card
                        const randomIndex = Math.floor(Math.random() * unusedCards.length);
                        selectedCards[i] = unusedCards[randomIndex];
                        anyChanges = true;
                    }
                }
            }

            player.selectedCards = selectedCards;
            player.submitted = true;

            console.log(`Auto-filled cards for player ${player.name} due to timer expiry`);
        }

        // Check if all players have now submitted
        const allSubmitted = Object.values(gameState.players).every(p =>
            p.submitted || p.powerState === PowerState.OFF || p.lives <= 0
        );

        if (allSubmitted) {
            console.log('All players submitted after timer expiry, starting execution phase');
            this.executeProgramPhase(gameState);
        } else if (anyChanges) {
            // Emit updated game state if we made changes
            this.io.to(gameState.roomCode).emit('game-state', gameState);
        }
    }

    async saveGameResults(gameState: ServerGameState) {
        try {
            console.log(`Saving game results for room ${gameState.roomCode}`);
            
            // Find the game in database
            const game = await prisma.game.findUnique({
                where: { roomCode: gameState.roomCode }
            });
            
            if (!game) {
                console.error(`Game ${gameState.roomCode} not found in database`);
                return;
            }

            // Calculate game duration
            const startTime = game.startedAt || game.createdAt;
            const endTime = new Date();
            const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

            // Find winner's user ID
            let winnerId: string | null = null;
            if (gameState.winner) {
                const winnerPlayer = Object.values(gameState.players).find(p => p.name === gameState.winner);
                if (winnerPlayer) {
                    winnerId = winnerPlayer.id;
                }
            }

            // Prepare final results
            const finalResults = Object.values(gameState.players).map((player, index) => ({
                playerId: player.id,
                playerName: player.name,
                position: index + 1, // Will be updated based on actual ranking
                flags: player.checkpointsVisited || 0,
                finalDamage: player.damage || 0,
                livesRemaining: player.lives || 0
            }));

            // Sort players to determine final positions
            finalResults.sort((a, b) => {
                // Winner is first
                if (a.playerName === gameState.winner) return -1;
                if (b.playerName === gameState.winner) return 1;
                
                // Then by flags reached
                if (b.flags !== a.flags) return b.flags - a.flags;
                
                // Then by lives remaining
                if (b.livesRemaining !== a.livesRemaining) return b.livesRemaining - a.livesRemaining;
                
                // Then by least damage
                return a.finalDamage - b.finalDamage;
            });

            // Update positions
            finalResults.forEach((result, index) => {
                result.position = index + 1;
            });

            // Update game in database
            await prisma.game.update({
                where: { id: game.id },
                data: {
                    endedAt: endTime,
                    winnerId: winnerId,
                    finalResults: finalResults,
                    totalDuration: durationSeconds
                }
            });

            // Update game players with final stats
            for (const player of Object.values(gameState.players)) {
                const finalResult = finalResults.find(r => r.playerId === player.id);
                if (!finalResult) continue;

                await prisma.gamePlayer.updateMany({
                    where: {
                        gameId: game.id,
                        userId: player.id
                    },
                    data: {
                        finalPosition: finalResult.position,
                        flagsReached: player.checkpointsVisited || 0,
                        livesRemaining: player.lives || 0,
                        finalDamage: player.damage || 0,
                        robotsDestroyed: 0 // TODO: Track robot destructions in future
                    }
                });
            }

            console.log(`Game results saved for ${gameState.roomCode}. Winner: ${gameState.winner || 'None'}, Duration: ${durationSeconds}s`);
        } catch (error) {
            console.error('Error saving game results:', error);
        }
    }
}