import { GameState, Player, ProgramCard, Tile, Direction, CardType, GamePhase, Course, PowerState } from './types';
import { TileType } from './types/enums';
import { GAME_CONFIG } from './constants';
import { buildCourse, getCourseById, RISKY_EXCHANGE } from './courses/courses';
import { hasWallBetween } from './wall-utils';
import { getTileAt as getCanonicalTileAt } from './tile-utils';

export interface ServerGameState extends GameState {
    host: string;
    winner?: string;
    allPlayersDead?: boolean;
    waitingForPowerDownDecisions?: string[];
    waitingForRespawnDecisions?: string[];
    playersWhoMadeRespawnDecisions?: string[];
}

interface IoServer {
    to(room: string): { emit(event: string, ...args: any[]): void; };
}

interface DirectionVectors {
    [key: number]: { x: number; y: number; };
}

export class GameEngine {
    private io: IoServer;
    private DIRECTION_VECTORS: DirectionVectors;
    private registerExecutionDelay: number;
    private boardElementDelay: number;

    constructor(io: IoServer) {
        this.io = io;
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
            player.dealtCards = deck.splice(0, 9 - player.damage);
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
            this.io.to(roomCode).emit('register-start', { register: i });

            this.io.to(roomCode).emit('register-started', {
                register: i,
                registerNumber: i + 1
            });

            await this.executeRegister(gameState, i);

            var playerToLog = gameState.players[gameState.host];
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

        var playerToLog = gameState.players[gameState.host];
        //console.log(`BEFORE EXECUTING THIS REGISTER: Player ${playerToLog.name}'s CARDS:`, playerToLog.selectedCards);

        for (const { playerId, card, player } of programmedCards) {
            if ((player as any).isDead) continue;

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
                await this.moveRobot(gameState, player, 3);
                break;
            case CardType.BACK_UP:
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
                // Try to push the other robot
                const pushed = await this.pushRobot(gameState, occupant, direction);
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


    async pushRobot(gameState: ServerGameState, playerToPush: Player, direction: Direction): Promise<boolean> {
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
            const pushed = await this.pushRobot(gameState, occupant, direction);
            if (!pushed) {
                return false; // Chain pushing failed
            }
        }

        // Push is valid, update position
        playerToPush.position.x = newX;
        playerToPush.position.y = newY;
        return true;
    }

    getPlayerAt(gameState: ServerGameState, x: number, y: number): Player | undefined {
        return Object.values(gameState.players).find(p => p.position.x === x && p.position.y === y && !(p as any).isDead);
    }

    destroyRobot(gameState: ServerGameState, player: Player, reason: string): void {
        if ((player as any).isDead) return;

        console.log(`${player.name} destroyed: ${reason}`);

        player.lives--;
        player.damage = 2;
        (player as any).isDead = true;
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
        const allDead = allPlayers.every(p => (p as any).isDead || p.lives <= 0);
        if (allDead) {
            gameState.allPlayersDead = true;
            console.log('All players are destroyed. Turn will end early.');
        }
    }

    performRespawn(gameState: ServerGameState, playerId: string, direction: Direction) {
        const player = gameState.players[playerId];
        if (!player || !(player as any).awaitingRespawn) return;

        console.log(`Performing respawn for ${player.name} at archive position facing ${Direction[direction]}`);

        // Respawn at archive position with chosen direction
        player.position = { ...player.archiveMarker };
        player.direction = direction;

        // Robot is no longer dead or awaiting respawn
        (player as any).isDead = false;
        (player as any).awaitingRespawn = false;

        // Robots reenter with 2 damage tokens (per rules)
        player.damage = 2;

        console.log(`${player.name} respawned at (${player.archiveMarker.x}, ${player.archiveMarker.y}) facing ${Direction[direction]}`);

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
            if ((player as any).isDead) {
                console.log(`Checking respawn for ${player.name}: lives=${player.lives}, isDead=${(player as any).isDead}`);
                if (player.lives > 0) {
                    console.log(`${player.name} will respawn at their archive marker.`);

                    // Clear previous turn's registers BEFORE showing respawn decision (cosmetic fix)
                    player.selectedCards = [null, null, null, null, null];
                    player.lockedRegisters = 0;
                    player.submitted = false;
                    player.dealtCards = [];

                    // Mark that this player is awaiting respawn (but don't respawn yet!)
                    (player as any).awaitingRespawn = true;

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
        const movements: any[] = [];
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;
            const tile = this.getTileAt(gameState, player.position.x, player.position.y);
            if (!tile) return;
            if ((tile.type === TileType.EXPRESS_CONVEYOR && includeExpress) || (tile.type === TileType.CONVEYOR && includeNormal)) {
                const vector = this.DIRECTION_VECTORS[(tile as any).direction];
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
            if (toTile && (toTile as any).rotate && (fromTile.type === TileType.CONVEYOR || fromTile.type === TileType.EXPRESS_CONVEYOR)) {
                if ((toTile as any).rotate === 'clockwise') {
                    player.direction = (player.direction + 1) % 4;
                } else if ((toTile as any).rotate === 'counterclockwise') {
                    player.direction = (player.direction + 3) % 4;
                }
                this.executionLog(gameState, `${player.name} rotated by conveyor`);
            }
        });
        this.io.to(gameState.roomCode).emit('game-state', gameState);
        await new Promise(resolve => setTimeout(resolve, this.boardElementDelay));
    }

    resolveConveyorMovements(gameState: ServerGameState, movements: any[]) {
        const resolved: any[] = [];
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
            if ((tile as any).registers && (tile as any).registers.includes(currentRegister + 1)) {
                this.pushRobot(gameState, player, (tile as any).direction);
                // if (this.pushRobot(gameState, player, (tile as any).direction)) {
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
                damages.set(playerId, { boardDamage: 0, robotHits: [] });
            }
            return damages.get(playerId);
        };

        if (gameState.course.board.lasers) {
            gameState.course.board.lasers.forEach(laser => {
                const hits = this.traceLaser(gameState, laser.position.x, laser.position.y, laser.direction, laser.damage || 1);
                hits.forEach(hit => {
                    getDamageInfo(hit.player.id).boardDamage += hit.damage;
                });
            });
        }

        const robotLaserShots: any[] = [];
        Object.values(gameState.players).forEach(shooter => {
            if (shooter.lives <= 0 || shooter.powerState === PowerState.OFF) return;

            const vector = this.DIRECTION_VECTORS[shooter.direction];

            // Check if there's a wall immediately blocking the robot's laser from firing
            const frontX = shooter.position.x + vector.x;
            const frontY = shooter.position.y + vector.y;

            // Check if robot has a wall in front blocking its laser
            if (hasWallBetween(shooter.position, { x: frontX, y: frontY }, gameState.course.board)) {
                // Robot's laser is blocked by wall immediately - can't fire
                return;
            }

            // Trace the laser using the standard traceLaser function
            // Start from the shooter's position, not one tile ahead
            const hits = this.traceLaser(gameState, shooter.position.x, shooter.position.y, shooter.direction, 1);

            // Build laser path for animation
            const path: any[] = [];
            let x = frontX;
            let y = frontY;

            // Build the visual path, checking for walls and robots
            while (x >= 0 && x < gameState.course.board.width &&
                y >= 0 && y < gameState.course.board.height) {

                // Check if we can enter this tile (wall blocking entry)
                const fromPos = { x: x - vector.x, y: y - vector.y };
                const toPos = { x, y };

                if (hasWallBetween(fromPos, toPos, gameState.course.board)) {
                    // Wall blocks entry to this tile
                    break;
                }

                path.push({ x, y });

                // Check if we hit a robot
                if (this.getPlayerAt(gameState, x, y)) break;

                // Check if we can exit this tile (wall blocking exit)
                const nextX = x + vector.x;
                const nextY = y + vector.y;
                if (nextX >= 0 && nextX < gameState.course.board.width &&
                    nextY >= 0 && nextY < gameState.course.board.height) {
                    if (hasWallBetween({ x, y }, { x: nextX, y: nextY }, gameState.course.board)) {
                        // Wall blocks exit from this tile
                        break;
                    }
                }

                x += vector.x;
                y += vector.y;
            }

            if (path.length > 0) {
                robotLaserShots.push({
                    shooterId: shooter.id,
                    path: path,
                    targetId: hits.length > 0 ? hits[0].player.id : undefined,
                    timestamp: Date.now()
                });
            }

            hits.forEach(hit => {
                if (hit.player.id !== shooter.id) { // Can't shoot yourself
                    getDamageInfo(hit.player.id).robotHits.push({
                        shooterName: shooter.name,
                        damage: hit.damage
                    });
                }
            });
        });

        if (robotLaserShots.length > 0) {
            this.io.to(gameState.roomCode).emit('robot-lasers-fired', robotLaserShots);
        }

        damages.forEach((damageInfo, playerId) => {
            const victim = gameState.players[playerId];
            const totalDamage = damageInfo.boardDamage + damageInfo.robotHits.reduce((sum: number, hit: any) => sum + hit.damage, 0);
            if (totalDamage === 0) return;
            victim.damage += totalDamage;

            // Handle register locking for powered down robots
            this.handleRegisterLockingDuringPowerDown(gameState, victim);

            if (damageInfo.boardDamage > 0) {
                const message = `${victim.name} takes ${damageInfo.boardDamage} damage from laser`;
                console.log(message);
                this.io.to(gameState.roomCode).emit('robot-damaged', { playerName: victim.name, damage: damageInfo.boardDamage, reason: 'laser' });
            }
            damageInfo.robotHits.forEach((hit: any) => {
                const message = `${victim.name} shot by ${hit.shooterName}`;
                console.log(message);
                this.io.to(gameState.roomCode).emit('robot-damaged', { playerName: victim.name, damage: hit.damage, reason: hit.shooterName, shooterName: hit.shooterName, message });
            });
            if (victim.damage >= 10) {
                console.log(`${victim.name} is destroyed!`);
                this.destroyRobot(gameState, victim, 'took too much damage');
            }
        });
    }

    traceLaser(gameState: ServerGameState, startX: number, startY: number, direction: Direction, damage: number) {
        const hits: any[] = [];
        const vector = this.DIRECTION_VECTORS[direction];
        let x = startX + vector.x;
        let y = startY + vector.y;

        while (x >= 0 && x < gameState.course.board.width &&
            y >= 0 && y < gameState.course.board.height) {

            // Check for wall blocking the laser path
            const fromPos = { x: x - vector.x, y: y - vector.y };
            const toPos = { x, y };

            if (hasWallBetween(fromPos, toPos, gameState.course.board)) {
                // Laser blocked by wall
                break;
            }

            // Check for robot
            const player = this.getPlayerAt(gameState, x, y);
            if (player) {
                hits.push({ player, damage });
                break; // Laser stops at first robot
            }

            // Move to next position
            x += vector.x;
            y += vector.y;
        }

        return hits;
    }

    async checkCheckpoints(gameState: ServerGameState) {
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;

            console.log(`${player.name} checking for checkpoints at position (${player.position.x}, ${player.position.y})`);

            const checkpoint = gameState.course.definition.checkpoints.find(
                cp => cp.position.x === player.position.x && cp.position.y === player.position.y
            );

            if (checkpoint && checkpoint.number === player.checkpointsVisited + 1) {
                player.checkpointsVisited++;
                console.log(`${player.name} reached checkpoint ${checkpoint.number}!`);

                // Update archive position when touching a checkpoint
                this.updateArchivePosition(gameState, player);

                this.executionLog(gameState, `${player.name} reached checkpoint ${checkpoint.number}!`);

                // Check if player has won
                if (player.checkpointsVisited === gameState.course.definition.checkpoints.length) {
                    gameState.winner = player.name;
                    gameState.phase = GamePhase.ENDED;
                    console.log(`${player.name} wins the game!`);
                    this.io.to(gameState.roomCode).emit('game-over', { winner: player.name });
                }
            } else if (checkpoint) {
                // Still update archive position even if checkpoint is out of order
                this.updateArchivePosition(gameState, player);
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
        }
    }

    async executeRepairs(gameState: ServerGameState) {
        console.log('Executing repairs...');
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0 || player.powerState === PowerState.OFF) return;

            const tile = this.getTileAt(gameState, player.position.x, player.position.y);

            // Check if robot is on a checkpoint/flag
            const checkpoint = gameState.course.definition.checkpoints.find(
                cp => cp.position.x === player.position.x && cp.position.y === player.position.y
            );

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
                    this.executionLog(gameState, `${player.name} repaired 1 damage and drew option card`, 'board-element');
                }
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
        });

        this.io.to(gameState.roomCode).emit('game-state', gameState);
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
}