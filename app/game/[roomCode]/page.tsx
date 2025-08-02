// File: app/game/[roomCode]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { GameState, Player, ProgramCard, Position, Direction } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';
import Board from '@/components/game/Board';
import Hand from '@/components/game/Hand';
import ProgramRegisters from '@/components/game/ProgramRegisters';
import GameContent from '@/components/game/GameContent';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const playerIdRef = useRef<string>('');

  // Add state for tracking execution
  const [executionState, setExecutionState] = useState<{
    currentCard?: ProgramCard;
    executingPlayer?: string;
    phase?: 'cards' | 'board-elements';
  }>({});

  useEffect(() => {
    // Check if we have a player name in localStorage
    const storedName = localStorage.getItem('playerName');
    const storedPlayerId = localStorage.getItem('playerId');

    if (storedName) {
      setPlayerName(storedName);
      playerIdRef.current = storedPlayerId || '';
      connectToGame(storedName, storedPlayerId || undefined);
    } else {
      setShowNameModal(true);
      setLoading(false);
    }

    return () => {
      socketClient.leaveGame();
      socketClient.disconnect();
    };
  }, [roomCode]);

  const connectToGame = (name: string, playerId?: string) => {
    setLoading(true);

    // Connect to Socket.io
    socketClient.connect();

    // Listen for game state updates
    socketClient.on('game-updated', (updatedState: GameState) => {
      console.log('Game state updated:', updatedState);
      setGameState(updatedState);
      setLoading(false);

      // Reset submission state when new programming phase starts
      if (updatedState.phase === 'programming') {
        setIsSubmitted(false);
      }
    });

    // Handle errors
    socketClient.on('error', (errorMsg: string) => {
      console.error('Socket error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
    });

    // Handle player joined
    socketClient.on('player-joined', (data: { playerId: string; player: Player }) => {
      console.log('Player joined:', data);
    });

    // Handle player left
    socketClient.on('player-left', (data: { playerId: string }) => {
      console.log('Player left:', data);
    });

    // Handle game not found
    socketClient.on('game-not-found', () => {
      setError('Game not found');
      setLoading(false);
    });

    // Handle cards dealt
    socketClient.on('cards-dealt', (data: { playerId: string; cards: ProgramCard[] }) => {
      console.log('Cards dealt:', data);
    });

    // Handle card played animation
    socketClient.on('card-executed', (data: {
      playerId: string;
      card: ProgramCard;
      register: number
    }) => {
      console.log('Card executed:', data);
      setExecutionState({
        currentCard: data.card,
        executingPlayer: data.playerId,
        phase: 'cards'
      });

      // Clear after animation
      setTimeout(() => {
        setExecutionState({});
      }, 1000);
    });

    // Handle board element phase
    socketClient.on('register-phase', (data: {
      register: number;
      phase: string;
    }) => {
      console.log('Register phase:', data);
      if (data.phase === 'board-elements') {
        setExecutionState({
          phase: 'board-elements'
        });
      }
    });

    // Handle register start
    socketClient.on('register-start', (data: { register: number }) => {
      console.log('Executing register:', data.register);
    });

    // Join the game
    const id = playerId || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    playerIdRef.current = id;
    localStorage.setItem('playerId', id);
    socketClient.joinGame(roomCode, name, id);
  };

  const handleJoinGame = () => {
    if (playerName.trim()) {
      localStorage.setItem('playerName', playerName);
      setShowNameModal(false);
      connectToGame(playerName);
    }
  };

  const handleStartGame = () => {
    socketClient.startGame(roomCode);
  };

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      router.push('/');
    }
  };

  const handleCardClick = (index: number) => {
    if (!gameState || gameState.phase !== 'programming' || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const card = currentPlayer.dealtCards[index];
    if (!card) return;

    // Find first empty slot
    const emptySlotIndex = currentPlayer.selectedCards.findIndex(c => c === null);
    if (emptySlotIndex === -1) return;

    // Check if card already selected
    if (currentPlayer.selectedCards.some(c => c?.id === card.id)) return;

    socketClient.emit('select-card', {
      roomCode,
      playerId: playerIdRef.current,
      cardId: card.id,
      slotIndex: emptySlotIndex,
    });
  };

  const handleCardDrop = (card: ProgramCard, slotIndex: number) => {
    if (!gameState || gameState.phase !== 'programming' || isSubmitted) return;

    socketClient.emit('select-card', {
      roomCode,
      playerId: playerIdRef.current,
      cardId: card.id,
      slotIndex,
    });
  };

  const handleCardRemove = (slotIndex: number) => {
    if (!gameState || gameState.phase !== 'programming' || isSubmitted) return;

    socketClient.emit('remove-card', {
      roomCode,
      playerId: playerIdRef.current,
      slotIndex,
    });
  };

  const handleSubmitCards = () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const filledSlots = currentPlayer.selectedCards.filter(c => c !== null).length;
    if (filledSlots < 5) {
      alert(`You need to select 5 cards. You have ${filledSlots}/5`);
      return;
    }

    setIsSubmitted(true);
    socketClient.emit('submit-cards', {
      roomCode,
      playerId: playerIdRef.current,
      cards: currentPlayer.selectedCards,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading game...</div>
      </div>
    );
  }

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Join Game</h2>
          <p className="text-gray-400 mb-4">Room Code: <span className="font-mono text-yellow-400">{roomCode}</span></p>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
            autoFocus
          />
          <button
            onClick={handleJoinGame}
            disabled={!playerName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-red-500 mb-4">Error</h2>
          <p>{error}</p>
          <a href="/" className="text-blue-400 hover:underline mt-4 inline-block">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState ? gameState.players[playerIdRef.current] : null;
  const isHost = gameState && gameState.hostId === playerIdRef.current;

  return (
    <GameContent>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">RobotMadness</h1>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">Room Code</p>
                <p className="text-2xl font-mono font-bold text-yellow-400">{roomCode}</p>
              </div>
              <button
                onClick={handleLeaveGame}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
              >
                Leave Game
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex flex-col gap-6">
            {/* Top Section - Board and Players/Controls */}
            <div className="flex gap-6">
              {/* Game Board - takes most space */}
              <div className="flex-1 bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <Board
                    board={gameState?.board!}
                    players={gameState?.players || {}}
                    currentPlayerId={playerIdRef.current}
                  />
                </div>
              </div>

              {/* Right side - Players and Controls stacked */}
              <div className="w-80 space-y-6">
                {/* Players */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Players ({Object.keys(gameState?.players || {}).length}/8)
                  </h2>
                  <div className="space-y-2">
                    {gameState && Object.values(gameState.players).map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded ${player.id === playerIdRef.current ? 'bg-gray-700' : ''
                          } ${player.isDisconnected ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-${['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'][index % 8]
                            }-500 flex items-center justify-center text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <span className={player.isDisconnected ? 'line-through' : ''}>
                            {player.name}
                            {player.id === gameState.hostId && ' 👑'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {player.lives > 0 && (
                            <span className="text-sm">❤️ {player.lives}</span>
                          )}
                          {player.damage > 0 && (
                            <span className="text-sm text-yellow-400">⚡ {player.damage}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Controls */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Game Status</h2>
                  {gameState?.phase === 'waiting' && (
                    <>
                      {isHost ? (
                        <button
                          onClick={handleStartGame}
                          disabled={Object.keys(gameState.players).length < 2}
                          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {Object.keys(gameState.players).length < 2
                            ? 'Need at least 2 players'
                            : 'Start Game'}
                        </button>
                      ) : (
                        <p className="text-gray-400 text-center">
                          Waiting for host to start game...
                        </p>
                      )}
                    </>
                  )}
                  {gameState?.phase === 'starting' && (
                    <p className="text-yellow-400 text-center animate-pulse">
                      Game starting...
                    </p>
                  )}
                  {gameState?.phase === 'programming' && (
                    <p className="text-gray-400 text-center">
                      Program your robot!
                    </p>
                  )}
                  {gameState?.phase === 'executing' && (
                    <p className="text-yellow-400 text-center animate-pulse">
                      Executing programs...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section - Cards */}
            <div className="space-y-6">
              {gameState?.phase === 'programming' && currentPlayer && (
                <>
                  {/* Hand */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <Hand
                      cards={currentPlayer.dealtCards || []}
                      selectedCards={currentPlayer.selectedCards}
                      onCardClick={handleCardClick}
                      isSubmitted={isSubmitted}
                    />
                  </div>

                  {/* Program Registers */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <ProgramRegisters
                          selectedCards={currentPlayer.selectedCards}
                          lockedRegisters={currentPlayer.lockedRegisters}
                          onCardDrop={handleCardDrop}
                          onCardRemove={handleCardRemove}
                          isSubmitted={isSubmitted}
                        />
                      </div>

                      {!isSubmitted && (
                        <button
                          onClick={handleSubmitCards}
                          disabled={currentPlayer.selectedCards.filter(c => c !== null).length < 5}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded font-semibold"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {gameState?.phase === 'waiting' && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Cards</h2>
                  <p className="text-gray-400">Cards will appear here when the game starts</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visual indicator for current executing card */}
        {executionState.executingPlayer && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg p-4 animate-bounce">
              <div className="text-center">
                <p className="text-yellow-400 font-bold">
                  {gameState?.players[executionState.executingPlayer]?.name} plays:
                </p>
                <div className={`mt-2 p-3 rounded ${executionState.currentCard?.type.includes('MOVE') ? 'bg-blue-600' :
                  executionState.currentCard?.type.includes('ROTATE') ? 'bg-yellow-600' :
                    executionState.currentCard?.type === 'U_TURN' ? 'bg-red-600' :
                      'bg-purple-600'
                  }`}>
                  <p className="text-white font-bold text-lg">
                    {executionState.currentCard?.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm opacity-75">
                    Priority: {executionState.currentCard?.priority}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameContent>
  );
}