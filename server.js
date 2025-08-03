// File: /server.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Game state storage (in-memory for now)
const games = new Map();
const playerSockets = new Map(); // socket.id -> { gameId, playerId }

// Card deck (simplified for now)
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

// Default board configuration
const DEFAULT_BOARD = {
    width: 12,
    height: 12,
    tiles: [],
    checkpoints: [
        { position: { x: 6, y: 9 }, number: 1 },
        { position: { x: 9, y: 5 }, number: 2 },
        { position: { x: 3, y: 2 }, number: 3 },
        { position: { x: 6, y: 2 }, number: 4 }
    ],
    startingPositions: [
        { position: { x: 1, y: 11 }, direction: 0 },
        { position: { x: 3, y: 11 }, direction: 0 },
        { position: { x: 5, y: 11 }, direction: 0 },
        { position: { x: 7, y: 11 }, direction: 0 },
        { position: { x: 9, y: 11 }, direction: 0 },
        { position: { x: 11, y: 11 }, direction: 0 }
    ]
};

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
        player.submitted = false;

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

    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);

        socket.on('join-game', ({ roomCode, playerName, playerId }) => {
            try {
                console.log(`Player ${playerName} (${playerId}) joining room ${roomCode}`);

                let game = games.get(roomCode);

                if (!game) {
                    // Create new game if it doesn't exist
                    game = {
                        id: roomCode,
                        roomCode,
                        name: `Game ${roomCode}`,
                        phase: 'waiting',
                        currentRegister: 0,
                        players: {},
                        board: { ...DEFAULT_BOARD },
                        roundNumber: 0,
                        cardsDealt: false,
                        hostId: playerId
                    };
                    games.set(roomCode, game);
                    console.log(`Created new game: ${roomCode}`);
                }

                // Check if player is rejoining
                let player = game.players[playerId];
                if (!player) {
                    // New player
                    const playerCount = Object.keys(game.players).length;
                    const startingPos = game.board.startingPositions[playerCount] ||
                        { position: { x: 6, y: 6 }, direction: 0 };

                    player = {
                        id: playerId,
                        userId: playerId,
                        name: playerName,
                        position: { ...startingPos.position },
                        direction: startingPos.direction,
                        damage: 0,
                        lives: 3,
                        checkpointsVisited: 0,
                        isPoweredDown: false,
                        dealtCards: [],
                        selectedCards: [null, null, null, null, null],
                        lockedRegisters: 0,
                        submitted: false
                    };

                    game.players[playerId] = player;
                    console.log(`Added new player ${playerName} to game ${roomCode}`);
                }

                // Update socket mapping
                playerSockets.set(socket.id, { gameId: roomCode, playerId });

                // Join socket room
                socket.join(roomCode);

                // Send game state to joining player
                socket.emit('game-state', game);

                // Notify others
                socket.to(roomCode).emit('player-joined', { player });

            } catch (error) {
                console.error('Error in join-game:', error);
                socket.emit('game-error', { message: 'Failed to join game' });
            }
        });

        socket.on('start-game', () => {
            const socketInfo = playerSockets.get(socket.id);
            if (!socketInfo) return;

            const { gameId, playerId } = socketInfo;
            const game = games.get(gameId);

            if (!game || game.hostId !== playerId) {
                socket.emit('game-error', { message: 'Only the host can start the game' });
                return;
            }

            if (Object.keys(game.players).length < 2) {
                socket.emit('game-error', { message: 'Need at least 2 players to start' });
                return;
            }

            console.log(`Starting game ${gameId}`);
            game.phase = 'programming';
            dealCards(game);

            io.to(gameId).emit('game-state', game);
            io.to(gameId).emit('cards-dealt');
        });

        socket.on('select-cards', ({ selectedCards }) => {
            const socketInfo = playerSockets.get(socket.id);
            if (!socketInfo) return;

            const { gameId, playerId } = socketInfo;
            const game = games.get(gameId);

            if (!game || !game.players[playerId]) return;

            game.players[playerId].selectedCards = selectedCards;
            io.to(gameId).emit('game-state', game);
        });

        socket.on('submit-cards', () => {
            const socketInfo = playerSockets.get(socket.id);
            if (!socketInfo) return;

            const { gameId, playerId } = socketInfo;
            const game = games.get(gameId);

            if (!game || !game.players[playerId]) return;

            game.players[playerId].submitted = true;

            // Check if all players have submitted
            const allSubmitted = Object.values(game.players).every(p => p.submitted);

            if (allSubmitted) {
                console.log(`All players submitted in game ${gameId}, starting execution`);
                game.phase = 'executing';
                // TODO: Execute registers
            }

            io.to(gameId).emit('game-state', game);
        });

        socket.on('leave-game', () => {
            const socketInfo = playerSockets.get(socket.id);
            if (!socketInfo) return;

            const { gameId, playerId } = socketInfo;
            const game = games.get(gameId);

            if (game && game.players[playerId]) {
                delete game.players[playerId];

                // If host left, assign new host
                if (game.hostId === playerId && Object.keys(game.players).length > 0) {
                    game.hostId = Object.keys(game.players)[0];
                }

                io.to(gameId).emit('game-state', game);
                socket.to(gameId).emit('player-left', { playerId });
            }

            playerSockets.delete(socket.id);
            socket.leave(gameId);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            const socketInfo = playerSockets.get(socket.id);
            if (socketInfo) {
                const { gameId, playerId } = socketInfo;
                // Mark player as disconnected but don't remove them
                const game = games.get(gameId);
                if (game && game.players[playerId]) {
                    game.players[playerId].isDisconnected = true;
                    io.to(gameId).emit('game-state', game);
                }
            }

            playerSockets.delete(socket.id);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
        console.log('> Socket.io server running');
    });
});