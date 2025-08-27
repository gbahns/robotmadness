import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { GameState, ProgramCard, GamePhase, Course, Player, PowerState, Direction } from './lib/game/types';
import { GameEngine, ServerGameState } from './lib/game/gameEngine';
import { prisma } from './lib/prisma';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, turbo: dev }); // Enable Turbopack in development
const handle = app.getRequestHandler();

// Socket event types
interface ServerToClientEvents {
    'game-state': (gameState: GameState) => void;
    'player-joined': (data: { player: Player }) => void;
    'player-left': (data: { playerId: string }) => void;
    'player-disconnected': (data: { playerId: string }) => void;
    'player-reconnected': (data: { playerId: string }) => void;
    'player-reset': (data: { playerId: string, playerName: string }) => void;
    'cards-dealt': () => void;
    'timer-update': (data: { timeLeft: number }) => void;
    'timer-expired': () => void;
    'phase-change': (data: { phase: string }) => void;
    'execution-update': (data: { message: string; playerId?: string; action?: string }) => void;
    'card-executed': (data: { playerId: string; playerName: string; card: ProgramCard; register: number }) => void;
    'game-over': (data: { winner: string }) => void;
    'course-selected': (data: { courseId: string, previewCourse: Course }) => void;
    'error': (data: { message: string }) => void;
    'player-submitted': (data: { playerId: string, playerName: string }) => void;
    'register-start': (data: { register: number }) => void;
    'register-started': (data: { register: number, registerNumber: number }) => void;
    'player-powered-down': (data: { playerId: string, playerName: string }) => void;
    'power-down-option': (data: { message: string }) => void;
    'player-power-state-changed': (data: { playerId: string, playerName: string, powerState: PowerState, announcedPowerDown?: boolean }) => void;
    'respawn-power-down-option': (data: { message: string; isRespawn?: boolean }) => void;
    'register-update': (data: { playerId: string; selectedCards: (ProgramCard | null)[] }) => void;
    'damage-prevention-opportunity': (data: { 
        damageAmount: number; 
        source: string; 
        optionCards: any[] 
    }) => void;
    'option-card-used-for-damage': (data: { 
        playerId: string; 
        playerName: string; 
        card: any; 
        damagePreventedSoFar: number; 
        damageRemaining: number 
    }) => void;
}

interface ClientToServerEvents {
    'create-game': (data: { playerName: string; playerId: string; courseId?: string }, callback?: (response: { success: boolean; roomCode?: string; game?: any; error?: string }) => void) => void;
    'join-game': (data: { 
        roomCode: string; 
        playerName: string; 
        playerId: string;
        userId?: string;
        username?: string;
        isAuthenticated?: boolean;
    }) => void;
    'leave-game': () => void;
    'start-game': (data: { 
        roomCode: string; 
        selectedCourse?: string;
        timerConfig?: {
            mode: 'players-submitted' | 'players-remaining';
            threshold: number;
            duration: number;
        };
    }) => void;
    'select-course': (data: { roomCode: string; courseId: string }) => void;
    'submit-cards': (data: { roomCode: string; playerId: string; cards: (ProgramCard | null)[] }) => void;
    'reset-cards': (data: { roomCode: string; playerId: string; }) => void;
    'request-game-state': (roomCode: string) => void;
    'toggle-power-down': (data: { roomCode: string; playerId: string; selectedCards: (ProgramCard | null)[] }) => void;
    'continue-power-down': (data: { roomCode: string; playerId: string; continueDown: boolean }) => void;
    'respawn-decision': (data: { roomCode: string; playerId: string; powerDown: boolean; direction: Direction }) => void;
    'respawn-preview': (data: { roomCode: string; playerId: string; direction: Direction }) => void;
    'damage-prevention-complete': (data: { roomCode: string }) => void;
    'use-option-for-damage': (data: { roomCode: string; cardId: string }) => void;
    'register-update': (data: { roomCode: string; playerId: string; selectedCards: (ProgramCard | null)[] }) => void;
    'deal-option-cards-to-all': (data: { roomCode: string }) => void;
}

interface InterServerEvents { }

interface SocketData {
    roomCode?: string;
    playerId?: string;
    userId?: string;
    isAuthenticated?: boolean;
}

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Store active games
const games = new Map<string, ServerGameState>();

let gameEngine: GameEngine;

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Main server setup
app.prepare().then(() => {
    const expressApp = express();
    const httpServer = createServer(expressApp);
    const io: IoServer = new Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV !== 'production'
                ? false
                : ["http://localhost:3000", "http://localhost:3001"],
            methods: ["GET", "POST"]
        }
    });

    gameEngine = new GameEngine(io as any);

    expressApp.get('/api/games/open', (req, res) => {
        const openGames = Array.from(games.values())
            .filter(game => game.phase === GamePhase.WAITING)
            .map(game => ({
                roomCode: game.roomCode,
                name: game.name,
                playerCount: Object.keys(game.players).length,
                maxPlayers: 8,
                phase: game.phase,
                isPractice: game.isPractice || false
            }));

        res.json(openGames);
    });

    // Socket.io connection handling
    io.on('connection', (socket: IoSocket) => {
        console.log('Client connected:', socket.id);

        // socket.on('create-game', ({ playerName, playerId: playerId, courseId }, callback) => {
        //     console.log(`create-game event received: ${playerName}, playerId: ${playerId}, courseId: ${courseId}`);
        //     if (!playerId || !playerName) {
        //         if (callback) {
        //             callback({ success: false, error: 'playerId and playerName are required' });
        //         }
        //         return;
        //     }

        //     try {
        //         const roomCode = generateRoomCode();
        //         console.log(`Creating game with room code: ${roomCode}, player: ${playerName}, courseId: ${courseId}`);
        //         const gameState = gameEngine.createGame(roomCode, "{playerName}'s Game");
        //         gameEngine.addPlayerToGame(gameState, playerId, playerName);

        //         games.set(roomCode, gameState);

        //         socket.join(roomCode);
        //         socket.join(playerId);
        //         socket.data.roomCode = roomCode;
        //         socket.data.playerId = playerId;

        //         if (callback) {
        //             callback({
        //                 success: true,
        //                 roomCode,
        //                 game: gameState
        //             });
        //         } else {
        //             socket.emit('game-state', gameState);
        //         }
        //         console.log(`Game created: ${roomCode} by ${playerName}` + (courseId ? ` with course ${courseId}` : ''));
        //     } catch (error) {
        //         console.error(`Error creating game: ${error}`);
        //         if (callback) {
        //             callback({
        //                 success: false,
        //                 error: error instanceof Error ? error.message : 'An unknown error occurred'
        //             });
        //         }
        //     }
        //     console.log('create-game event exit');
        // });

        socket.on('join-game', async ({ roomCode, playerName, playerId, userId, username, isAuthenticated, isPractice }) => {
            try {
                console.log(`join-game event received: roomCode=${roomCode}, playerName=${playerName}, playerId=${playerId}, isAuthenticated=${isAuthenticated}, isPractice=${isPractice}`);
                let gameState = games.get(roomCode);
                let isNewGame = false;

                if (!gameState) {
                    // Check if unauthenticated user is trying to create a real game
                    if (!isAuthenticated && !isPractice) {
                        console.log(`Unauthenticated user ${playerName} attempted to create a real game`);
                        socket.emit('error', { message: 'You must be signed in to create or join real games. Please sign in or create a practice game instead.' });
                        return;
                    }
                    
                    console.log(`Game ${roomCode} not found, creating it`);
                    gameState = gameEngine.createGame(roomCode, `${playerName}'s Game`); // Create if not found
                    games.set(roomCode, gameState);
                    isNewGame = true;
                } else {
                    // Check if unauthenticated user is trying to join a real game
                    if (!isAuthenticated && !gameState.isPractice) {
                        console.log(`Unauthenticated user ${playerName} attempted to join real game ${roomCode}`);
                        socket.emit('error', { message: 'You must be signed in to join real games. Please sign in or join a practice game instead.' });
                        return;
                    }
                }

                // Handle user based on authentication status
                let user;
                let effectivePlayerId: string;
                
                if (isAuthenticated && userId) {
                    // For authenticated users, use their actual user ID
                    effectivePlayerId = userId;
                    user = await prisma.user.findUnique({
                        where: { id: userId }
                    });
                    
                    if (!user) {
                        // This shouldn't happen for authenticated users, but handle it gracefully
                        console.error(`Authenticated user ${userId} not found in database`);
                        socket.emit('error', { message: 'User authentication error' });
                        return;
                    }
                    console.log(`Authenticated user ${user.username} joining game`);
                } else {
                    // For guest users, use the generated playerId as a temporary user
                    effectivePlayerId = playerId;
                    
                    // Check if a temporary guest user already exists with this ID
                    user = await prisma.user.findUnique({
                        where: { id: playerId }
                    });

                    if (!user) {
                        // Create a temporary guest user
                        const guestUsername = `guest.${playerName.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}`;
                        user = await prisma.user.create({
                            data: {
                                id: playerId,
                                username: guestUsername,
                                email: `${guestUsername}@guest.local`,
                                name: `${playerName} (Guest)`
                            }
                        });
                        console.log(`Created guest user: ${user.username}`);
                    }
                }

                // Create or get game in database
                if (isNewGame) {
                    const game = await prisma.game.create({
                        data: {
                            roomCode: roomCode,
                            name: `${playerName}'s Game`,
                            hostId: user.id,
                            maxPlayers: 8,
                            isPrivate: false,
                            isPractice: isPractice || false
                        }
                    });
                    console.log(`Created ${isPractice ? 'practice ' : ''}game in database: ${game.id}`);
                    
                    // Store practice mode in game state
                    gameState.isPractice = isPractice || false;
                }

                // Add player to game using the effective player ID
                gameEngine.addPlayerToGame(gameState, effectivePlayerId, playerName);

                // Get player's starting position (dock number)
                const newPlayer = gameState.players[effectivePlayerId];
                const playerIndex = Object.keys(gameState.players).indexOf(effectivePlayerId);
                const ROBOT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
                const robotColor = ROBOT_COLORS[playerIndex % ROBOT_COLORS.length];
                const startingDock = newPlayer.startingPosition?.number || (playerIndex + 1);

                // Add player to database game
                const existingGamePlayer = await prisma.gamePlayer.findUnique({
                    where: {
                        gameId_userId: {
                            gameId: (await prisma.game.findUnique({ where: { roomCode } }))?.id || '',
                            userId: user.id
                        }
                    }
                });

                if (!existingGamePlayer) {
                    const game = await prisma.game.findUnique({ where: { roomCode } });
                    if (game) {
                        await prisma.gamePlayer.create({
                            data: {
                                gameId: game.id,
                                userId: user.id,
                                robotColor: robotColor,
                                startingDock: startingDock
                            }
                        });
                        console.log(`Added player ${user.username} to game ${roomCode} in database`);
                    }
                }

                socket.join(roomCode);
                socket.join(effectivePlayerId);
                socket.data.roomCode = roomCode;
                socket.data.playerId = effectivePlayerId;
                socket.data.userId = user.id;
                socket.data.isAuthenticated = isAuthenticated || false;

                io.to(roomCode).emit('player-joined', { player: newPlayer });
                io.to(roomCode).emit('game-state', gameState);
                console.log(`${playerName} joined game ${roomCode}`);
            } catch (error) {
                if (error instanceof Error) {
                    console.error(`Error joining game: ${error.message} ${error.stack}`);
                } else {
                    console.error(`Error joining game: ${String(error)}`);
                }
            }
        });

        socket.on('start-game', async ({ roomCode, selectedCourse = 'test', timerConfig }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            console.log(`Starting game ${roomCode} with course: ${selectedCourse}`, timerConfig);

            // Store timer configuration
            if (timerConfig) {
                gameState.timerConfig = timerConfig;
            } else {
                // Default timer configuration (official rules: timer starts when only 1 player hasn't submitted)
                gameState.timerConfig = {
                    mode: 'players-remaining',
                    threshold: 1,
                    duration: 30
                };
            }

            // Ensure the board is set based on the selected course
            gameEngine.selectCourse(gameState, selectedCourse);

            gameEngine.startGame(gameState, selectedCourse);

            // Update database when game starts
            const game = await prisma.game.findUnique({ where: { roomCode } });
            if (game) {
                await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        startedAt: new Date(),
                        boardName: gameState.course?.definition?.boards?.[0] || null, // Use first board ID from course
                        courseName: selectedCourse
                    }
                });
                console.log(`Updated game ${roomCode} in database: started at ${new Date().toISOString()}`);
            }

            io.to(roomCode).emit('game-state', gameState);

            setTimeout(() => {
                gameEngine.dealCards(gameState);
                console.log('Cards dealt, starting programming phase');
                io.to(roomCode).emit('cards-dealt');
                io.to(roomCode).emit('game-state', gameState);
            }, 2000);
        });

        socket.on('select-course', ({ roomCode, courseId }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            gameEngine.selectCourse(gameState, courseId);
            var previewCourse = gameState.course;
            io.to(roomCode).emit('course-selected', { courseId, previewCourse });
            io.to(roomCode).emit('game-state', gameState);
        });

        socket.on('register-update', (data) => {
            const { roomCode, playerId, selectedCards } = data;
            const gameState = games.get(roomCode);

            if (!gameState || !gameState.players[playerId]) return;

            // Update the player's selected cards
            gameState.players[playerId].selectedCards = selectedCards;

            // Broadcast to all OTHER players in the room
            socket.to(roomCode).emit('register-update', {
                playerId,
                selectedCards
            });
        });

        socket.on('submit-cards', (data) => {
            const { roomCode, playerId, cards } = data;
            const gameState = games.get(roomCode);

            if (!gameState || !gameState.players[playerId]) return;

            console.log(`Player ${gameState.players[playerId].name} (${playerId}) submitted cards:`, cards.map(c => c ? `${c.type}(${c.priority})` : 'null'));

            // Store the submitted cards
            gameState.players[playerId].selectedCards = cards;
            gameState.players[playerId].submitted = true;

            // Check if timer should start based on configuration
            gameEngine.checkTimerStart(gameState);

            // Check if all players have submitted
            const allSubmitted = Object.values(gameState.players).every(p => p.submitted || p.powerState === PowerState.OFF || p.lives <= 0);
            console.log(`Players submitted: ${Object.values(gameState.players).filter(p => p.submitted).length}/${Object.keys(gameState.players).length}`);

            if (allSubmitted) {
                // Stop the timer since all players have submitted
                gameEngine.stopTimer(roomCode);
                gameEngine.executeProgramPhase(gameState);
            } else {
                // Just update this player's status
                io.to(roomCode).emit('player-submitted', { playerId, playerName: gameState.players[playerId].name });
                console.log(`Player ${gameState.players[playerId].name} submitted, waiting for others...`);
            }
        });


        // Toggle power down announcement
        socket.on('toggle-power-down', ({ roomCode, playerId, selectedCards }) => {
            console.log(`Received toggle-power-down from player ${playerId} in game ${roomCode}`);
            const gameState = games.get(roomCode);
            if (!gameState || !gameState.players[playerId]) return;
            const player = gameState.players[playerId];

            // Update selected cards
            if (selectedCards) {
                player.selectedCards = selectedCards;
            }

            // Toggle power down state
            if (player.powerState === PowerState.ON) {
                // Check if this is a respawn scenario
                if (selectedCards === null || (Array.isArray(selectedCards) && selectedCards.length === 0)) {
                    // This is a respawn power-down decision
                    if (selectedCards === null) {
                        // Immediate power down for respawn
                        player.powerState = PowerState.OFF;
                        player.damage = 0; // Repair all damage immediately
                        player.dealtCards = []; // No cards when powered down
                        player.selectedCards = [null, null, null, null, null];
                        player.lockedRegisters = 0;
                        player.announcedPowerDown = false;
                        player.submitted = true; // Auto-submit for powered down players
                        console.log(`${player.name} immediately powered down after respawn - all damage repaired`);
                    } else {
                        // Empty array means "don't power down" for respawn - keep ON state
                        console.log(`${player.name} chose not to power down after respawn`);
                    }
                } else {
                    // Normal power down announcement for next turn
                    player.powerState = PowerState.ANNOUNCING;
                    player.announcedPowerDown = true;
                    console.log(`${player.name} announced power down for next turn`);
                }

            } else if (player.powerState === PowerState.ANNOUNCING) {
                player.powerState = PowerState.ON;
                player.announcedPowerDown = false;
                console.log(`${player.name} cancelled power down announcement`);

            } else if (player.powerState === PowerState.OFF) {
                // Toggle whether to continue being powered down
                player.continuesPowerDown = !player.continuesPowerDown;
                console.log(`${player.name} will ${player.continuesPowerDown ? 'stay' : 'not stay'} powered down`);
            }

            // Notify all clients of the state change
            io.to(roomCode).emit('player-power-state-changed', {
                playerId: player.id,
                playerName: player.name,
                powerState: player.powerState,
                announcedPowerDown: player.announcedPowerDown
            });

            // Check if this was a respawn power-down decision
            if (gameState.waitingForRespawnDecisions && gameState.waitingForRespawnDecisions.includes(playerId)) {
                // Track that this player made a respawn decision (to avoid double prompting later)
                if (!gameState.playersWhoMadeRespawnDecisions) {
                    gameState.playersWhoMadeRespawnDecisions = [];
                }
                gameState.playersWhoMadeRespawnDecisions.push(playerId);

                // Remove this player from respawn waiting list
                gameState.waitingForRespawnDecisions = gameState.waitingForRespawnDecisions.filter(
                    id => id !== playerId
                );

                if (selectedCards === null) {
                    console.log(`${player.name} chose to power down after respawn. ${gameState.waitingForRespawnDecisions.length} players still waiting.`);
                } else if (Array.isArray(selectedCards) && selectedCards.length === 0) {
                    console.log(`${player.name} chose NOT to power down after respawn. ${gameState.waitingForRespawnDecisions.length} players still waiting.`);
                }

                // If all respawning players have decided, proceed with ending the turn
                if (gameState.waitingForRespawnDecisions.length === 0) {
                    console.log('All respawn decisions received, ending turn and dealing cards...');
                    gameState.waitingForRespawnDecisions = undefined;
                    gameEngine.endTurn(gameState);
                    // endTurn will emit game-state, so no need to emit it again
                    return;
                }
            }

            // Send updated game state
            io.to(roomCode).emit('game-state', gameState);
        });

        // Handle continuing power down decision
        socket.on('continue-power-down', ({ roomCode, playerId, continueDown }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            const player = gameState.players[playerId];
            if (!player || player.powerState !== PowerState.OFF) return;

            if (continueDown) {
                // Stay powered down
                player.powerState = PowerState.OFF;
                console.log(`${player.name} chooses to stay powered down`);
            } else {
                // Power back on
                player.powerState = PowerState.ON;
                console.log(`${player.name} will power back on this turn`);
            }

            // Remove this player from waiting list
            if (gameState.waitingForPowerDownDecisions) {
                gameState.waitingForPowerDownDecisions = gameState.waitingForPowerDownDecisions.filter(
                    id => id !== playerId
                );

                // If all powered down players have decided, proceed with dealing cards
                if (gameState.waitingForPowerDownDecisions.length === 0) {
                    console.log('All power down decisions received, dealing cards...');
                    gameEngine.proceedWithDealingCards(gameState);
                    io.to(roomCode).emit('game-state', gameState);
                }
            }
        });

        // Handle respawn preview - update robot position and direction for preview
        socket.on('respawn-preview', ({ roomCode, playerId, direction }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            const player = gameState.players[playerId];
            if (!player) return;

            // Place robot at archive position with selected direction for preview
            if (player.lives <= 0 || (player as any).awaitingRespawn) {
                player.position = { ...player.archiveMarker };
                player.direction = direction;
                
                // Broadcast updated game state to all players so they see the robot
                io.to(roomCode).emit('game-state', gameState);
            }
        });

        // Handle respawn decision with direction choice
        socket.on('respawn-decision', ({ roomCode, playerId, powerDown, direction }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            const player = gameState.players[playerId];
            if (!player) return;

            // Perform the actual respawn with the chosen direction
            gameEngine.performRespawn(gameState, playerId, direction);

            if (powerDown) {
                // Enter powered down mode
                player.powerState = PowerState.OFF;
                console.log(`${player.name} respawns facing ${Direction[direction]} and enters powered down mode`);
            } else {
                // Stay powered on
                player.powerState = PowerState.ON;
                console.log(`${player.name} respawns facing ${Direction[direction]} and stays powered on`);
            }

            // Remove this player from waiting list
            if (gameState.waitingForRespawnDecisions) {
                gameState.waitingForRespawnDecisions = gameState.waitingForRespawnDecisions.filter(
                    id => id !== playerId
                );

                // Track that this player made a respawn decision
                if (!gameState.playersWhoMadeRespawnDecisions) {
                    gameState.playersWhoMadeRespawnDecisions = [];
                }
                gameState.playersWhoMadeRespawnDecisions.push(playerId);

                // If all respawning players have decided, proceed with dealing cards
                if (gameState.waitingForRespawnDecisions.length === 0) {
                    console.log('All respawn decisions received, ending turn...');
                    gameEngine.endTurn(gameState);
                    io.to(roomCode).emit('game-state', gameState);
                }
            }
        });

        //player notifies the server when they have reset their cards
        //server resets that player's cards in gameState
        //server emits the current gameState - this was causing other players' cards to be reset so I commented it out
        //server emits player-reset to let other players know (they don't currently handle this)
        socket.on('reset-cards', ({ roomCode, playerId }) => {
            const gameState = games.get(roomCode);
            if (!gameState || !gameState.players[playerId]) return;

            gameEngine.resetCards(gameState, playerId);
            //io.to(roomCode).emit('game-state', gameState);
            io.to(roomCode).emit('player-reset', { playerId, playerName: gameState.players[playerId].name });
        });

        socket.on('request-game-state', (roomCode) => {
            const gameState = games.get(roomCode);
            if (gameState) {
                socket.emit('game-state', gameState);
            }
        });

        socket.on('damage-prevention-complete', ({ roomCode }) => {
            console.log(`[DamagePrevention] Received damage-prevention-complete from socket ${socket.id} for room ${roomCode}`);
            const gameState = games.get(roomCode);
            if (!gameState) {
                console.log(`[DamagePrevention] No game state found for room ${roomCode}`);
                return;
            }
            
            // Find the player by socket ID
            const player = Object.values(gameState.players).find(p => p.id === socket.id);
            if (!player) {
                console.log(`[DamagePrevention] No player found for socket ${socket.id}`);
                // Try using socket data as fallback
                const playerId = socket.data.playerId;
                if (playerId && gameState.pendingDamage?.has(playerId)) {
                    const pending = gameState.pendingDamage.get(playerId);
                    console.log(`[DamagePrevention] Using socket.data.playerId: ${playerId}. Prevented ${pending?.prevented || 0} of ${pending?.amount || 0} damage`);
                    if (pending) {
                        pending.completed = true;
                        console.log(`[DamagePrevention] Set completed flag to true for ${playerId}`);
                    }
                }
                return;
            }
            
            const playerId = player.id;
            
            // Mark damage prevention as complete
            if (gameState.pendingDamage?.has(playerId)) {
                const pending = gameState.pendingDamage.get(playerId);
                console.log(`[DamagePrevention] Player ${player.name} completed damage prevention. Prevented ${pending?.prevented || 0} of ${pending?.amount || 0} damage`);
                // Set completed flag to trigger immediate resolution
                if (pending) {
                    pending.completed = true;
                    console.log(`[DamagePrevention] Set completed flag to true for ${playerId}`);
                }
            } else {
                console.log(`[DamagePrevention] No pending damage found for ${playerId}`);
            }
        });

        socket.on('use-option-for-damage', ({ roomCode, cardId }) => {
            console.log(`[DamagePrevention] Received use-option-for-damage from socket ${socket.id}, cardId: ${cardId}`);
            const gameState = games.get(roomCode);
            if (!gameState) {
                console.log(`[DamagePrevention] No game state found`);
                return;
            }
            
            // Use socket.data.playerId which should have the actual player ID
            const playerId = socket.data.playerId || socket.id;
            console.log(`[DamagePrevention] Looking for player with ID: ${playerId}`);
            
            const player = gameState.players[playerId];
            if (!player) {
                console.log(`[DamagePrevention] No player found for ${playerId}`);
                // Try to find by socket id as fallback
                const playerBySocket = Object.values(gameState.players).find(p => p.id === socket.id);
                if (!playerBySocket) {
                    console.log(`[DamagePrevention] Could not find player by socket ID either`);
                    return;
                }
                // Use the found player
                const actualPlayerId = playerBySocket.id;
                const actualPlayer = playerBySocket;
                console.log(`[DamagePrevention] Found player ${actualPlayer.name} by socket ID, actual ID: ${actualPlayerId}`);
                
                const pending = gameState.pendingDamage?.get(actualPlayerId);
                if (!pending) {
                    console.log(`[DamagePrevention] No pending damage for ${actualPlayerId}`);
                    socket.emit('error', { message: 'No pending damage to prevent' });
                    return;
                }
                
                // Process with the found player
                processOptionCardUsage(gameState, actualPlayer, actualPlayerId, pending, cardId, io, roomCode);
                return;
            }
            
            console.log(`[DamagePrevention] Player ${player.name} has ${player.optionCards?.length || 0} option cards`);
            
            const pending = gameState.pendingDamage?.get(playerId);
            if (!pending) {
                console.log(`[DamagePrevention] No pending damage for ${playerId}`);
                socket.emit('error', { message: 'No pending damage to prevent' });
                return;
            }
            
            processOptionCardUsage(gameState, player, playerId, pending, cardId, io, roomCode);
        });
        
        function processOptionCardUsage(gameState: any, player: any, playerId: string, pending: any, cardId: string, io: any, roomCode: string) {
            console.log(`[DamagePrevention] Processing option card usage for ${player.name}`);
            
            // Find and remove the option card
            const cardIndex = player.optionCards.findIndex((card: any) => card.id === cardId);
            if (cardIndex === -1) {
                console.log(`[DamagePrevention] Option card ${cardId} not found in player's hand`);
                return;
            }
            
            const card = player.optionCards.splice(cardIndex, 1)[0];
            if (!gameState.discardedOptions) {
                gameState.discardedOptions = [];
            }
            gameState.discardedOptions.push(card);
            
            // Track prevented damage (actual damage reduction happens after the wait)
            const previousPrevented = pending.prevented;
            pending.prevented = Math.min(pending.prevented + 1, pending.amount);
            const actuallyPrevented = pending.prevented - previousPrevented;
            
            console.log(`[DamagePrevention] ${player.name} used ${card.name} to prevent ${actuallyPrevented} damage (${pending.prevented}/${pending.amount} total prevented)`);
            
            // If all damage prevented, immediately mark as complete
            if (pending.prevented >= pending.amount) {
                console.log(`[DamagePrevention] All damage prevented for ${player.name}, triggering immediate resolution`);
                pending.completed = true;
            }
            
            io.to(roomCode).emit('option-card-used-for-damage', {
                playerId: playerId,
                playerName: player.name,
                card: card,
                damagePreventedSoFar: pending.prevented,
                damageRemaining: pending.amount - pending.prevented
            });
            
            // Update game state so UI reflects the reduced damage
            io.to(roomCode).emit('game-state', gameState);
        }

        // Dev/Test: Deal random option cards to all players
        socket.on('deal-option-cards-to-all', ({ roomCode }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;
            
            // Only host can use this
            if (socket.data.playerId !== gameState.host) {
                console.log(`Non-host ${socket.data.playerId} tried to deal option cards`);
                return;
            }
            
            console.log(`[Dev] Host dealing 1 random option card to each player`);
            
            Object.values(gameState.players).forEach(player => {
                gameEngine.drawOptionCard(gameState, player);
            });
            
            io.to(roomCode).emit('game-state', gameState);
        });

        socket.on('leave-game', () => {
            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;

            if (roomCode && playerId) {
                const gameState = games.get(roomCode);
                if (gameState) {
                    gameEngine.removePlayerFromGame(gameState, playerId);
                    socket.leave(roomCode);

                    io.to(roomCode).emit('player-left', { playerId });

                    if (Object.keys(gameState.players).length === 0) {
                        games.delete(roomCode);
                        console.log(`Game ${roomCode} deleted as all players left.`);
                    } else if (gameState.host === playerId) {
                        // Host left, assign new host
                        const remainingPlayers = Object.keys(gameState.players);
                        if (remainingPlayers.length > 0) {
                            gameState.host = remainingPlayers[0];
                            io.to(roomCode).emit('game-state', gameState);
                            console.log(`Host changed to ${gameState.players[gameState.host].name} in game ${roomCode}`);
                        }
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;

            if (roomCode && playerId) {
                const gameState = games.get(roomCode);
                if (gameState) {
                    // Mark player as disconnected but don't remove them immediately
                    if (gameState.players[playerId]) {
                        gameState.players[playerId].isDisconnected = true;
                        io.to(roomCode).emit('player-disconnected', { playerId });
                        io.to(roomCode).emit('game-state', gameState);
                        console.log(`Player ${gameState.players[playerId].name} disconnected from game ${roomCode}`);
                    }
                }
            }
        });
    });

    // Next.js request handling  
    expressApp.all('*', (req: any, res: any) => {
        return handle(req, res);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
