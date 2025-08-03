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

  useEffect(() => {
    // Check if we have a player name in localStorage
    const storedName = localStorage.getItem('playerName');
    const storedPlayerId = localStorage.getItem('playerId');
    
    if (storedName) {
      setPlayerName(storedName);
      playerIdRef.current = storedPlayerId || '';
      connectToGame(storedName, storedPlayerId);
    } else {
      setShowNameModal(true);
      setLoading(false);
    }

    return () => {
      socketClient.leaveGame();
      socketClient.disconnect();
    };
  }, [roomCode]);

  const connectToGame = (name: string, playerId?: string | null) => {
    // Connect to socket server
    socketClient.connect();

    // Set up event listeners
    socketClient.onGameState((state: GameState) => {
      console.log('Received game state:', state);
      console.log('Current player:', state.players[playerIdRef.current]);
      setGameState(state);
      setLoading(false);
      
      // Reset submission state when new cards are dealt
      if (state.phase === 'programming' && state.players[playerIdRef.current]?.dealtCards?.length > 0) {
        setIsSubmitted(false);
      }
    });

    socketClient.onPlayerJoined((data) => {
      console.log('Player joined:', data.player.name);
      // Update the game state with the new player
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.player.id]: data.player
          }
        };
      });
    });

    socketClient.onPlayerLeft((data) => {
      console.log('Player left:', data.playerId);
      // Remove the player from game state
      setGameState(prev => {
        if (!prev) return prev;
        const newPlayers = { ...prev.players };
        delete newPlayers[data.playerId];
        return {
          ...prev,
          players: newPlayers
        };
      });
    });

    socketClient.onGameError((data) => {
      setError(data.message);
    });

    // Handle player disconnection (different from leaving)
    socketClient.on('player-disconnected', (data: { playerId: string }) => {
      console.log('Player disconnected:', data.playerId);
      // Mark player as disconnected but don't remove them
      setGameState(prev => {
        if (!prev || !prev.players[data.playerId]) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.playerId]: {
              ...prev.players[data.playerId],
              isDisconnected: true
            }
          }
        };
      });
    });

    // Handle player reconnection
    socketClient.on('player-reconnected', (data: { playerId: string }) => {
      console.log('Player reconnected:', data.playerId);
      setGameState(prev => {
        if (!prev || !prev.players[data.playerId]) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.playerId]: {
              ...prev.players[data.playerId],
              isDisconnected: false
            }
          }
        };
      });
    });

    // Handle card execution animations
    socketClient.on('card-executed', (data: { 
      playerId: string; 
      card: ProgramCard; 
      newPosition: Position; 
      newDirection: Direction 
    }) => {
      console.log('Card executed:', data);
      // The game state will be updated separately
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
      socketClient.leaveGame();
      router.push('/');
    }
  };

  const currentPlayer = gameState?.players[playerIdRef.current];
  const isHost = Object.keys(gameState?.players || {}).indexOf(playerIdRef.current) === 0;

  // Card management functions
  const handleCardClick = (index: number) => {
    if (isSubmitted || !currentPlayer) return;
    
    // Find first empty register slot
    const emptySlotIndex = currentPlayer.selectedCards.findIndex(card => card === null);
    if (emptySlotIndex === -1) return; // All slots full
    
    // Get the card
    const card = currentPlayer.dealtCards[index];
    if (!card) return;
    
    // Place card in first empty slot
    const newSelectedCards = [...currentPlayer.selectedCards];
    newSelectedCards[emptySlotIndex] = card;
    
    // Update game state
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [playerIdRef.current]: {
            ...prev.players[playerIdRef.current],
            selectedCards: newSelectedCards,
          },
        },
      };
    });
  };

  const handleCardDrop = (card: ProgramCard, registerIndex: number) => {
    if (!currentPlayer || isSubmitted) return;
    
    // Check if this card is already in a register
    const existingIndex = currentPlayer.selectedCards.findIndex(
      c => c && c.id === card.id
    );
    
    const newSelectedCards = [...currentPlayer.selectedCards];
    
    // If card exists in another slot, remove it first
    if (existingIndex !== -1 && existingIndex !== registerIndex) {
      newSelectedCards[existingIndex] = null;
    }
    
    // Place card in new slot
    newSelectedCards[registerIndex] = card;
    
    // Update game state
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [playerIdRef.current]: {
            ...prev.players[playerIdRef.current],
            selectedCards: newSelectedCards,
          },
        },
      };
    });
  };

  const handleCardRemove = (registerIndex: number) => {
    if (!currentPlayer || isSubmitted) return;
    
    const newSelectedCards = [...currentPlayer.selectedCards];
    newSelectedCards[registerIndex] = null;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [playerIdRef.current]: {
            ...prev.players[playerIdRef.current],
            selectedCards: newSelectedCards,
          },
        },
      };
    });
  };

  const handleSubmitCards = () => {
    if (!currentPlayer) return;
    
    const filledSlots = currentPlayer.selectedCards.filter(c => c !== null).length;
    if (filledSlots < 5) {
      alert(`Please select all 5 cards! You have ${filledSlots}/5`);
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
                        className={`flex items-center justify-between p-2 rounded ${
                          player.id === playerIdRef.current ? 'bg-gray-700' : ''
                        } ${player.isDisconnected ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-${
                            ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'][index % 8]
                          }-500 flex items-center justify-center text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <span className={player.isDisconnected ? 'line-through' : ''}>
                            {player.name}
                          </span>
                          {player.id === playerIdRef.current && (
                            <span className="text-xs text-gray-400">(You)</span>
                          )}
                          {index === 0 && (
                            <span className="text-xs text-yellow-400">(Host)</span>
                          )}
                          {player.isDisconnected && (
                            <span className="text-xs text-red-400">(Disconnected)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>❤️ {player.lives}</span>
                          <span>⚡ {player.damage}</span>
                        </div>
                      </div>
                    ))}
                    {!gameState && <p className="text-gray-400">Connecting...</p>}
                  </div>
                </div>

                {/* Game Controls */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
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
      </div>
    </GameContent>
  );
}