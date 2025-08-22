import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { GameState, ProgramCard, GamePhase, Course, Player, PowerState, Direction } from './lib/game/types';
import { GameEngine, ServerGameState } from './lib/game/gameEngine';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
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
}

interface ClientToServerEvents {
    'create-game': (data: { playerName: string; playerId: string; courseId?: string }, callback?: (response: { success: boolean; roomCode?: string; game?: any; error?: string }) => void) => void;
    'join-game': (data: { roomCode: string; playerName: string; playerId: string }) => void;
    'leave-game': () => void;
    'start-game': (data: { roomCode: string; selectedCourse?: string }) => void;
    'select-course': (data: { roomCode: string; courseId: string }) => void;
    'submit-cards': (data: { roomCode: string; playerId: string; cards: (ProgramCard | null)[] }) => void;
    'reset-cards': (data: { roomCode: string; playerId: string; }) => void;
    'request-game-state': (roomCode: string) => void;
    'toggle-power-down': (data: { roomCode: string; playerId: string; selectedCards: (ProgramCard | null)[] }) => void;
    'continue-power-down': (data: { roomCode: string; playerId: string; continueDown: boolean }) => void;
    'respawn-decision': (data: { roomCode: string; playerId: string; powerDown: boolean; direction: Direction }) => void;
}

interface InterServerEvents { }

interface SocketData {
    roomCode?: string;
    playerId?: string;
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
                phase: game.phase
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

        socket.on('join-game', ({ roomCode, playerName, playerId }) => {
            try {
                console.log(`join-game event received: roomCode=${roomCode}, playerName=${playerName}, playerId=${playerId}`);
                let gameState = games.get(roomCode);

                if (!gameState) {
                    console.log(`Game ${roomCode} not found, creating it`);
                    gameState = gameEngine.createGame(roomCode, `${playerName}'s Game`); // Create if not found
                    games.set(roomCode, gameState);
                }

                gameEngine.addPlayerToGame(gameState, playerId, playerName);

                socket.join(roomCode);
                socket.join(playerId);
                socket.data.roomCode = roomCode;
                socket.data.playerId = playerId;

                const newPlayer = gameState.players[playerId];
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

        socket.on('start-game', ({ roomCode, selectedCourse = 'test' }) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            console.log(`Starting game ${roomCode} with course: ${selectedCourse}`);

            // Ensure the board is set based on the selected course
            gameEngine.selectCourse(gameState, selectedCourse);

            gameEngine.startGame(gameState, selectedCourse);

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

            // Check if all players have submitted
            const allSubmitted = Object.values(gameState.players).every(p => p.submitted || p.powerState === PowerState.OFF || p.lives <= 0);
            console.log(`Players submitted: ${Object.values(gameState.players).filter(p => p.submitted).length}/${Object.keys(gameState.players).length}`);

            if (allSubmitted) {
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
