'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from '@/components/game/Board';
import Card from '@/components/game/Card';
import ProgramRegisters from '@/components/game/ProgramRegisters';
import { GameState, ProgramCard, GamePhase } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';

// Simple Timer component (can be moved to its own file later)
function Timer({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const percentage = (timeLeft / totalTime) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="w-32 bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm">{timeLeft}s</span>
    </div>
  );
}

// Simple PlayerStatus component (can be moved to its own file later)
function PlayerStatus({ player, isCurrentPlayer }: { player: any; isCurrentPlayer: boolean }) {
  return (
    <div className={`p-3 rounded ${isCurrentPlayer ? 'bg-gray-800 border-2 border-green-500' : 'bg-gray-800'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{player.name}</span>
        {isCurrentPlayer && <span className="text-xs text-green-400">You</span>}
      </div>
      <div className="text-sm space-y-1">
        <div>Lives: {player.lives}</div>
        <div>Damage: {player.damage}</div>
        <div>Checkpoints: {player.checkpointsVisited}</div>
        {player.submitted && <div className="text-green-400">✓ Ready</div>}
      </div>
    </div>
  );
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const playerIdRef = useRef<string>('');

  useEffect(() => {
    // Get player ID from session storage
    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) {
      router.push('/');
      return;
    }
    playerIdRef.current = playerId;

    // Connect to socket
    socketClient.connect();

    // Get player name from localStorage
    const playerName = localStorage.getItem('playerName') || 'Player';

    // Join the game using the joinGame method which emits the correct event
    socketClient.joinGame(roomCode, playerName, playerId);

    // Define socket event handlers
    const handleGameState = (state: GameState) => {
      setGameState(state);

      // Check if current player has submitted
      const currentPlayer = state.players[playerId];
      if (currentPlayer) {
        setIsSubmitted(currentPlayer.submitted || false);

        // Reset submission status when new turn starts
        if (state.phase === GamePhase.PROGRAMMING && !currentPlayer.submitted) {
          setIsSubmitted(false);
          setSelectedSlot(0);
        }
      }
    };

    const handleTimerUpdate = (time: number) => {
      setTimeLeft(time);
    };

    const handleError = (error: string) => {
      alert(error);
    };

    // Set up socket listeners
    socketClient.on('game-state', handleGameState);
    socketClient.on('timer-update', handleTimerUpdate);
    socketClient.on('error', handleError);

    return () => {
      socketClient.off('game-state', handleGameState);
      socketClient.off('timer-update', handleTimerUpdate);
      socketClient.off('error', handleError);
      socketClient.disconnect();
    };
  }, [roomCode, router]);

  const handleCardClick = (index: number) => {
    if (!gameState || gameState.phase !== GamePhase.PROGRAMMING || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const card = currentPlayer.dealtCards[index];
    if (!card) return;

    // Check if this slot is empty and not locked
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const isSlotLocked = selectedSlot >= (5 - lockedRegisters);

    if (isSlotLocked) {
      alert(`Register ${selectedSlot + 1} is locked due to damage!`);
      return;
    }

    // Check if slot is already occupied
    if (currentPlayer.selectedCards[selectedSlot] !== null) {
      alert(`Register ${selectedSlot + 1} already has a card. Click on it to remove it first.`);
      return;
    }

    // Check if card is already selected in another slot
    if (currentPlayer.selectedCards.some(c => c?.id === card.id)) {
      alert('This card is already selected in another register!');
      return;
    }

    // Place the card in the selected slot
    socketClient.emit('select-card', {
      roomCode,
      playerId: playerIdRef.current,
      cardId: card.id,
      slotIndex: selectedSlot,
    });

    // Move to next empty slot
    const nextEmptySlot = findNextEmptySlot(currentPlayer.selectedCards, selectedSlot);
    setSelectedSlot(nextEmptySlot);
  };

  const findNextEmptySlot = (selectedCards: (ProgramCard | null)[], currentSlot: number): number => {
    const totalSlots = selectedCards.length;

    // Check slots after current slot
    for (let i = currentSlot + 1; i < totalSlots; i++) {
      if (selectedCards[i] === null) {
        return i;
      }
    }

    // Wrap around and check from beginning
    for (let i = 0; i <= currentSlot; i++) {
      if (selectedCards[i] === null) {
        return i;
      }
    }

    // No empty slots found, stay on current
    return currentSlot;
  };

  const handleRegisterClick = (index: number) => {
    if (!gameState || gameState.phase !== GamePhase.PROGRAMMING || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const isSlotLocked = index >= (5 - lockedRegisters);

    if (!isSlotLocked) {
      setSelectedSlot(index);
    }
  };

  const handleCardDrop = (card: ProgramCard, slotIndex: number) => {
    if (!gameState || gameState.phase !== GamePhase.PROGRAMMING || isSubmitted) return;

    socketClient.emit('select-card', {
      roomCode,
      playerId: playerIdRef.current,
      cardId: card.id,
      slotIndex,
    });
  };

  const handleCardRemove = (slotIndex: number) => {
    if (!gameState || gameState.phase !== GamePhase.PROGRAMMING || isSubmitted) return;

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
      alert(`You need to select 5 cards. You have selected ${filledSlots}.`);
      return;
    }

    socketClient.emit('submit-cards', {
      roomCode,
      playerId: playerIdRef.current,
    });
    setIsSubmitted(true);
  };

  const handleLeaveGame = () => {
    const confirmLeave = window.confirm('Are you sure you want to leave the game?');
    if (confirmLeave) {
      socketClient.emit('leave-room', {
        roomCode,
        playerId: playerIdRef.current,
      });
      router.push('/');
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4">Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[playerIdRef.current];
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>Error: Player not found in game</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
            <div className="flex items-center gap-4">
              <span className="text-lg">
                Phase: <span className="text-green-400">{gameState.phase}</span>
              </span>
              {gameState.phase === GamePhase.PROGRAMMING && (
                <Timer timeLeft={timeLeft} totalTime={30} />
              )}
              <button
                onClick={handleLeaveGame}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Leave Game
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Panel - Player Status */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold">Players</h2>
              {Object.values(gameState.players).map((player) => (
                <PlayerStatus
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === playerIdRef.current}
                />
              ))}
            </div>

            {/* Center - Game Board */}
            <div className="lg:col-span-1">
              <Board
                board={gameState.board}
                players={gameState.players}
                currentPlayerId={playerIdRef.current}
              />
            </div>

            {/* Right Panel - Cards and Controls */}
            <div className="lg:col-span-1 space-y-4">
              {gameState.phase === GamePhase.PROGRAMMING && (
                <>
                  {/* Program Registers */}
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Program Registers</h2>
                    <ProgramRegisters
                      selectedCards={currentPlayer.selectedCards}
                      lockedRegisters={Math.min(currentPlayer.damage, 5)}
                      onCardDrop={handleCardDrop}
                      onCardRemove={handleCardRemove}
                      isSubmitted={isSubmitted}
                      selectedSlot={selectedSlot}
                      onRegisterClick={handleRegisterClick}
                    />
                  </div>

                  {/* Dealt Cards */}
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Your Cards</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {currentPlayer.dealtCards.map((card, index) => {
                        const isAlreadySelected = currentPlayer.selectedCards.some(
                          c => c?.id === card.id
                        );
                        return (
                          <div
                            key={card.id}
                            onClick={() => !isAlreadySelected && handleCardClick(index)}
                            className={`
                              cursor-pointer transition-all
                              ${isAlreadySelected ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                            `}
                          >
                            <Card
                              card={card}
                              isDraggable={!isSubmitted && !isAlreadySelected}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  {!isSubmitted && (
                    <button
                      onClick={handleSubmitCards}
                      disabled={currentPlayer.selectedCards.filter(c => c !== null).length < 5}
                      className={`
                        w-full py-3 rounded font-semibold text-lg
                        ${currentPlayer.selectedCards.filter(c => c !== null).length === 5
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-700 cursor-not-allowed'
                        }
                      `}
                    >
                      Submit Program ({currentPlayer.selectedCards.filter(c => c !== null).length}/5)
                    </button>
                  )}
                </>
              )}

              {gameState.phase === GamePhase.EXECUTING && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">Executing Programs</h2>
                  <p className="text-gray-400">
                    Register {gameState.currentRegister + 1} of 5
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${((gameState.currentRegister + 1) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}