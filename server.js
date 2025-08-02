// server.js
// Note: This is a .js file, not .ts - it runs outside Next.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const GameEngine = require('./gameEngine');
const { SAMPLE_BOARD } = require('./boardConfig');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Game state storage (in-memory for now)
const games = new Map();
const playerSockets = new Map(); // socket.id -> { gameId, playerId }

// Card deck (simplified for now - we'll import from constants later)
const CARD_DECK = [
    // U-Turn cards (6 total)
    ...Array.from({ length: 6 }, (_, i) => ({
        id: i,
        type: 'U_TURN',
        priority: 10 + (i * 10)
    })),
    // Rotate Left cards (18 total)
    ...Array.from({ length: 18 }, (_, i) => ({
        id: 6 + i,
        type: 'ROTATE_LEFT',
        priority: 70 + (i * 20)
    })),
    // Rotate Right cards (18 total)
    ...Array.from({ length: 18 }, (_, i) => ({
        id: 24 + i,
        type: 'ROTATE_RIGHT',
        priority: 80 + (i * 20)
    })),
    // Back Up cards (6 total)
    ...Array.from({ length: 6 }, (_, i) => ({
        id: 42 + i,
        type: 'BACK_UP',
        priority: 430 + (i * 10)
    })),
    // Move 1 cards (18 total)
    ...Array.from({ length: 18 }, (_, i) => ({
        id: 48 + i,
        type: 'MOVE_1',
        priority: 490 + (i * 10)
    })),
    // Move 2 cards (12 total)
    ...Array.from({ length: 12 }, (_, i) => ({
        id: 66 + i,
        type: 'MOVE_2',
        priority: 670 + (i * 10)
    })),
    // Move 3 cards (6 total)
    ...Array.from({ length: 6 }, (_, i) => ({
        id: 78 + i,
        type: 'MOVE_3',
        priority: 790 + (i * 10)
    })),
];

// Shuffle array helper
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Deal cards to all players
function dealCards(gameState) {
    const shuffledDeck = shuffleArray(CARD_DECK);
    let deckIndex = 0;

    Object.values(gameState.players).forEach(player => {
        // Deal 9 cards to each player (minus damage)
        const cardsToDeal = Math.max(0, 9 - player.damage);
        player.dealtCards = shuffledDeck.slice(deckIndex, deckIndex + cardsToDeal);
        deckIndex += cardsToDeal;

        // Reset selected cards
        player.selectedCards = [null, null, null, null, null];

        // Calculate locked registers (5+ damage locks registers)
        player.lockedRegisters = Math.max(0, player.damage - 4);
    });

    gameState.phase = 'programming';
    gameState.cardsDealt = true;
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);

        // Add API endpoint for open games
        if (parsedUrl.pathname === '/api/socket/games') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const openGames = Array.from(games.values())
                .filter(game => game.phase === 'waiting')
                .map(game => ({
                    roomCode: game.roomCode,
                    name: game.name,
                    playerCount: Object.keys(game.players).length,
                    maxPlayers: 8,
                    phase: game.phase
                }));

            res.end(JSON.stringify(openGames));
            return;
        }

        handle(req, res, parsedUrl);
    });

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Initialize game engine
    const gameEngine = new GameEngine(io);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join-game', async (data) => {
            const { roomCode, playerName, playerId } = data;
            console.log(`Player ${playerName} joining room ${roomCode}`);

            // Get or create game state
            let gameState = games.get(roomCode);
            if (!gameState) {
                gameState = {
                    id: roomCode,
                    roomCode,
                    name: `Game ${roomCode}`,
                    phase: 'waiting',
                    currentRegister: 0,
                    players: {},
                    board: null,
                    roundNumber: 0,
                    cardsDealt: false,
                    hostId: null,
                };
                games.set(roomCode, gameState);
            }

            // Add player to game
            const newPlayerId = playerId || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            if (!gameState.players[newPlayerId]) {
                gameState.players[newPlayerId] = {
                    id: newPlayerId,
                    userId: newPlayerId,
                    name: playerName,
                    position: { x: 0, y: 0 },
                    direction: 0,
                    damage: 0,
                    lives: 3,
                    checkpointsVisited: 0,
                    isPoweredDown: false,
                    dealtCards: [],
                    selectedCards: [null, null, null, null, null],
                    lockedRegisters: 0,
                    submitted: false,
                };
            }

            // Set host if this is the first player
            if (!gameState.hostId || Object.keys(gameState.players).length === 1) {
                gameState.hostId = newPlayerId;
                console.log(`Setting ${playerName} (${newPlayerId}) as host`);
            }

            // Track socket connection
            playerSockets.set(socket.id, { gameId: roomCode, playerId: newPlayerId });

            // Join socket room
            socket.join(roomCode);

            console.log(`Current game state:`, {
                roomCode: gameState.roomCode,
                hostId: gameState.hostId,
                players: Object.keys(gameState.players),
                phase: gameState.phase
            });

            // Send current game state to joining player
            socket.emit('game-state', gameState);

            // Notify other players
            socket.to(roomCode).emit('player-joined', {
                player: gameState.players[newPlayerId],
            });
        });

        socket.on('start-game', (roomCode) => {
            const gameState = games.get(roomCode);
            if (!gameState) return;

            // Check if enough players
            const playerCount = Object.keys(gameState.players).length;
            if (playerCount < 2) {
                socket.emit('game-error', { message: 'Need at least 2 players to start' });
                return;
            }

            // Use the enhanced board configuration
            gameState.board = SAMPLE_BOARD;

            // Assign starting positions
            const players = Object.values(gameState.players);
            players.forEach((player, index) => {
                const startPos = gameState.board.startingPositions[index % gameState.board.startingPositions.length];
                player.position = { ...startPos.position };
                player.direction = startPos.direction;
            });

            // Update game phase
            gameState.phase = 'starting';

            // Broadcast updated state to all players
            io.to(roomCode).emit('game-state', gameState);

            // After a short delay, deal cards and start programming phase
            setTimeout(() => {
                dealCards(gameState);
                console.log('Cards dealt! Game state:', JSON.stringify(gameState.players, null, 2));
                io.to(roomCode).emit('game-state', gameState);
            }, 2000);
        });

        socket.on('submit-cards', (data) => {
            const { roomCode, playerId, cards } = data;
            const gameState = games.get(roomCode);

            if (!gameState || !gameState.players[playerId]) return;

            // Store the submitted cards
            gameState.players[playerId].selectedCards = cards;
            gameState.players[playerId].submitted = true;

            // Check if all players have submitted
            const allSubmitted = Object.values(gameState.players).every(p => p.submitted);

            if (allSubmitted) {
                // Move to execution phase
                gameState.phase = 'executing';
                gameState.currentRegister = 0;

                // Reset submitted flags for next round
                Object.values(gameState.players).forEach(p => p.submitted = false);

                io.to(roomCode).emit('game-state', gameState);

                // Start executing registers
                console.log('All players submitted! Starting execution...');
                executeRegisters(gameState);
            } else {
                // Just update this player's status
                io.to(roomCode).emit('player-submitted', { playerId });
            }
        });

        // File: server.js - Update the leave-game handler (around line 240)

        socket.on('leave-game', () => {
            const socketInfo = playerSockets.get(socket.id);
            if (!socketInfo) return;

            const { gameId, playerId } = socketInfo;
            const gameState = games.get(gameId);

            if (gameState && gameState.players[playerId]) {
                const leavingPlayer = gameState.players[playerId];
                delete gameState.players[playerId];

                // If the host is leaving, assign a new host
                if (gameState.hostId === playerId) {
                    const remainingPlayers = Object.keys(gameState.players);
                    if (remainingPlayers.length > 0) {
                        gameState.hostId = remainingPlayers[0];
                        console.log(`Host left. New host is ${gameState.players[gameState.hostId].name}`);

                        // Notify all players of the updated game state with new host
                        io.to(gameId).emit('game-state', gameState);
                    }
                }

                // Notify other players
                socket.to(gameId).emit('player-left', { playerId });

                // Clean up empty games
                if (Object.keys(gameState.players).length === 0) {
                    games.delete(gameId);
                }
            }

            playerSockets.delete(socket.id);
            socket.leave(gameId);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Handle player leaving on disconnect
            const socketInfo = playerSockets.get(socket.id);
            if (socketInfo) {
                const { gameId, playerId } = socketInfo;
                socket.to(gameId).emit('player-disconnected', { playerId });
                // Don't remove player from game on disconnect - they might reconnect
            }

            playerSockets.delete(socket.id);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });

    // Execute all 5 registers
    async function executeRegisters(gameState) {
        // Announce execution start
        io.to(gameState.roomCode).emit('execution-start');

        for (let i = 0; i < 5; i++) {
            gameState.currentRegister = i;

            // Announce register start with fanfare
            io.to(gameState.roomCode).emit('register-start', {
                register: i,
                totalPlayers: Object.keys(gameState.players).length
            });

            // Wait for UI to show register announcement
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Execute program cards phase
            io.to(gameState.roomCode).emit('register-phase', {
                register: i,
                phase: 'cards'
            });

            await gameEngine.executeRegister(gameState, i);

            // Brief pause after all cards executed
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Announce board elements phase
            io.to(gameState.roomCode).emit('register-phase', {
                register: i,
                phase: 'board-elements'
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Execute board elements with visual feedback
            await gameEngine.executeBoardElements(gameState);

            // Broadcast updated game state
            io.to(gameState.roomCode).emit('game-state', gameState);

            // Check if game ended
            if (gameState.phase === 'ended') {
                console.log(`Game ended! Winner: ${gameState.winner}`);
                io.to(gameState.roomCode).emit('game-ended', {
                    winner: gameState.winner,
                    finalState: gameState
                });

                // Celebration pause
                await new Promise(resolve => setTimeout(resolve, 3000));
                return;
            }

            // Mark register as complete
            io.to(gameState.roomCode).emit('register-complete', { register: i });

            // Pause between registers
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // All registers complete - cleanup phase
        io.to(gameState.roomCode).emit('cleanup-phase');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle end of turn repairs
        Object.values(gameState.players).forEach(player => {
            if (player.lives <= 0) return;

            const tile = getTileAt(gameState, player.position.x, player.position.y);
            if (tile && (tile.type === 'repair' || tile.type === 'upgrade')) {
                if (player.damage > 0) {
                    player.damage--;
                    io.to(gameState.roomCode).emit('player-repaired', {
                        playerId: player.id,
                        newDamage: player.damage
                    });
                }
            }
        });

        // After all registers, go back to programming phase
        await new Promise(resolve => setTimeout(resolve, 1000));

        gameState.phase = 'programming';
        gameState.currentRegister = 0;
        dealCards(gameState);

        io.to(gameState.roomCode).emit('programming-phase-start');
        io.to(gameState.roomCode).emit('game-state', gameState);
    }
});