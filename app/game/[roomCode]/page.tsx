'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from '@/components/game/Board';
import Card from '@/components/game/Card';
import ProgramRegisters from '@/components/game/ProgramRegisters';
import PlayerStatus from '@/components/game/PlayerStatus';
import Timer from '@/components/game/Timer';
import { GameState, ProgramCard, GamePhase } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const playerIdRef = useRef<string>('');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get player ID from session storage
    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) {
      router.push('/');
      return;
    }
    playerIdRef.current = playerId;

    // Connect socket
    socketClient.connect();

    // Get player name
    const playerName = localStorage.getItem('playerName') || 'Player';

    // Join game
    socketClient.joinGame(roomCode, playerName, playerId);

    // Set up socket listeners
    const handleGameState = (state: GameState) => {
      setGameState(state);

      // Reset submission state when new programming phase starts
      if (state.phase === GamePhase.PROGRAMMING && state.cardsDealt) {
        setIsSubmitted(false);
        setSelectedSlot(0);
        setTimeLeft(30); // Reset timer for new programming phase

        // Start countdown timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }

        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 0) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (state.phase !== GamePhase.PROGRAMMING) {
        // Clear timer if not in programming phase
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }

      // Check if current player has already submitted
      const currentPlayer = state.players[playerId];
      if (currentPlayer?.submitted) {
        setIsSubmitted(true);
      }
    };

    socketClient.onGameState(handleGameState);

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      socketClient.leaveGame();
      socketClient.disconnect();
    };
  }, [roomCode, router]);

  const handleStartGame = () => {
    socketClient.startGame();
  };

  const handleLeaveGame = () => {
    socketClient.leaveGame();
    router.push('/');
  };

  const handleCardDrop = (card: ProgramCard, registerIndex: number) => {
    if (!gameState || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    // Check if register is locked
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const isLocked = registerIndex >= (5 - lockedRegisters);
    if (isLocked) return;

    // Create new selected cards array
    const newSelectedCards = [...currentPlayer.selectedCards];

    // Remove card from its current position if it exists
    const existingIndex = newSelectedCards.findIndex(c => c?.id === card.id);
    if (existingIndex !== -1) {
      newSelectedCards[existingIndex] = null;
    }

    // Place card in new position
    newSelectedCards[registerIndex] = card;

    // Update server
    socketClient.selectCards(newSelectedCards);
  };

  const handleCardRemove = (registerIndex: number) => {
    if (!gameState || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const newSelectedCards = [...currentPlayer.selectedCards];
    newSelectedCards[registerIndex] = null;

    socketClient.selectCards(newSelectedCards);
  };

  const handleCardClick = (cardIndex: number) => {
    if (!gameState || isSubmitted || selectedSlot === -1) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    const card = currentPlayer.dealtCards[cardIndex];
    if (!card) return;

    // Check if this card is already placed
    const isAlreadyPlaced = currentPlayer.selectedCards.some(c => c?.id === card.id);
    if (isAlreadyPlaced) return;

    // Place the card in the selected slot
    handleCardDrop(card, selectedSlot);

    // Auto-advance to next empty slot
    let nextSlot = -1;
    for (let i = 0; i < 5; i++) {
      const lockedRegisters = Math.min(currentPlayer.damage, 5);
      const isLocked = i >= (5 - lockedRegisters);
      if (!isLocked && !currentPlayer.selectedCards[i]) {
        nextSlot = i;
        break;
      }
    }
    setSelectedSlot(nextSlot);
  };

  const handleRegisterClick = (index: number) => {
    if (!gameState || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    // Check if register is locked
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const isLocked = index >= (5 - lockedRegisters);
    if (isLocked) return;

    setSelectedSlot(index);
  };

  const handleSubmitProgram = () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    // Check if all non-locked registers are filled
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const requiredRegisters = 5 - lockedRegisters;
    const filledRegisters = currentPlayer.selectedCards
      .slice(0, requiredRegisters)
      .filter(card => card !== null).length;

    if (filledRegisters < requiredRegisters) {
      alert(`Please fill all ${requiredRegisters} program registers before submitting!`);
      return;
    }

    socketClient.submitCards();
    setIsSubmitted(true);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Connecting to game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[playerIdRef.current];
  const isHost = gameState.hostId === playerIdRef.current;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Game Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{gameState.name}</h1>
              <span className="text-sm bg-gray-800 px-3 py-1 rounded">
                Room: {roomCode}
              </span>
              <span className="text-sm bg-gray-800 px-3 py-1 rounded">
                Phase: {gameState.phase}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {gameState.phase === GamePhase.WAITING && isHost && (
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold"
                >
                  Start Game
                </button>
              )}
              {gameState.phase === GamePhase.PROGRAMMING && (
                <Timer timeLeft={timeLeft} totalTime={30} />
              )}
              <button
                onClick={handleLeaveGame}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Leave Game
              </button>
            </div>
          </div>

          {/* Main Game Layout */}
          <div className="flex gap-5">
            {/* Left Side - Game Board */}
            <div className="flex-shrink-0">
              <Board
                board={gameState.board}
                players={gameState.players}
                currentPlayerId={playerIdRef.current}
              />
            </div>

            {/* Right Side - Player List */}
            <div className="w-64 space-y-2">
              {Object.values(gameState.players).map((player) => (
                <PlayerStatus
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === playerIdRef.current}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Bottom Section - Cards and Controls */}
          {gameState.phase === GamePhase.PROGRAMMING && currentPlayer && currentPlayer.dealtCards.length > 0 && (
            <div className="mt-6 space-y-4">
              {/* Player's Hand */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-9 gap-2">
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
                          ${isAlreadySelected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}
                        `}
                      >
                        <Card
                          card={card}
                          index={index}
                          isSelected={false}
                          isDraggable={!isAlreadySelected && !isSubmitted}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Program Registers */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <ProgramRegisters
                    selectedCards={currentPlayer.selectedCards}
                    lockedRegisters={Math.min(currentPlayer.damage, 5)}
                    onCardDrop={handleCardDrop}
                    onCardRemove={handleCardRemove}
                    isSubmitted={isSubmitted}
                    selectedSlot={selectedSlot}
                    onRegisterClick={handleRegisterClick}
                  />

                  {!isSubmitted && (
                    <button
                      onClick={handleSubmitProgram}
                      className="px-6 py-3 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold"
                    >
                      Submit Program
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Execution Phase Display */}
          {gameState.phase === GamePhase.EXECUTING && (
            <div className="mt-6 bg-gray-800 rounded-lg p-6">
              <div className="text-center">
                <p className="text-2xl mb-2">Executing Register {gameState.currentRegister + 1} of 5</p>
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold
                        ${i < gameState.currentRegister
                          ? 'bg-green-600 text-white'
                          : i === gameState.currentRegister
                            ? 'bg-yellow-500 text-black animate-pulse'
                            : 'bg-gray-700 text-gray-400'
                        }
                      `}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}