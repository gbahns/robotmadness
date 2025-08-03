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

      // Check if player has submitted
      const player = state.players[playerId];
      if (player) {
        setIsSubmitted(player.submitted || false);
      }

      // Reset submission state when new programming phase starts
      if (state.phase === GamePhase.PROGRAMMING && state.cardsDealt) {
        setIsSubmitted(false);
        setSelectedSlot(0);
        setTimeLeft(30);
      }
    };

    const handleCardsDealt = () => {
      setTimeLeft(30);
      setIsSubmitted(false);
      setSelectedSlot(0);
    };

    const handleGameError = (data: { message: string }) => {
      console.error('Game error:', data.message);
      alert(data.message);
      router.push('/');
    };

    socketClient.onGameState(handleGameState);
    socketClient.onCardsDealt(handleCardsDealt);
    socketClient.onGameError(handleGameError);

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      socketClient.off('game-state', handleGameState);
      socketClient.off('cards-dealt', handleCardsDealt);
      socketClient.off('game-error', handleGameError);
      socketClient.leaveGame();
      socketClient.disconnect();
    };
  }, [roomCode, router]);

  const handleCardDrop = (card: ProgramCard, registerIndex: number) => {
    if (!gameState || isSubmitted) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    // Check if card is already placed
    const isAlreadyPlaced = currentPlayer.selectedCards.some(c => c?.id === card.id);
    if (isAlreadyPlaced) return;

    // Update selected cards
    const newSelectedCards = [...currentPlayer.selectedCards];
    newSelectedCards[registerIndex] = card;

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

    // Check if card is already placed
    const isAlreadyPlaced = currentPlayer.selectedCards.some(c => c?.id === card.id);
    if (isAlreadyPlaced) return;

    // Check if slot is locked
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const isSlotLocked = selectedSlot >= (5 - lockedRegisters);
    if (isSlotLocked) return;

    handleCardDrop(card, selectedSlot);

    // Move to next empty slot
    const nextSlot = currentPlayer.selectedCards.findIndex((c, i) => {
      const isLocked = i >= (5 - lockedRegisters);
      return i > selectedSlot && !c && !isLocked;
    });
    setSelectedSlot(nextSlot >= 0 ? nextSlot : -1);
  };

  const handleRegisterClick = (index: number) => {
    if (!isSubmitted) {
      const currentPlayer = gameState?.players[playerIdRef.current];
      if (currentPlayer) {
        const lockedRegisters = Math.min(currentPlayer.damage, 5);
        const isSlotLocked = index >= (5 - lockedRegisters);
        if (!isSlotLocked) {
          setSelectedSlot(index);
        }
      }
    }
  };

  const handleSubmitProgram = () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[playerIdRef.current];
    if (!currentPlayer) return;

    // Check if all non-locked registers are filled
    const lockedRegisters = Math.min(currentPlayer.damage, 5);
    const requiredCards = 5 - lockedRegisters;
    const filledCards = currentPlayer.selectedCards.slice(0, requiredCards).filter(c => c !== null).length;

    if (filledCards < requiredCards) {
      alert(`Please fill all ${requiredCards} program registers before submitting!`);
      return;
    }

    socketClient.submitCards();
    setIsSubmitted(true);
    setSelectedSlot(-1);
  };

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      socketClient.leaveGame();
      router.push('/');
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[playerIdRef.current];
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: Player not found in game</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{gameState.name}</h1>
              <span className="text-lg">
                Phase: <span className="text-green-400">{gameState.phase}</span>
              </span>
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

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Left Panel - Player Status */}
            <div className="xl:col-span-1 space-y-3">
              <h2 className="text-xl font-semibold mb-2">Players</h2>
              {Object.values(gameState.players).map((player) => (
                <PlayerStatus
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === playerIdRef.current}
                />
              ))}
            </div>

            {/* Center - Game Board */}
            <div className="xl:col-span-2">
              <Board
                board={gameState.board}
                players={gameState.players}
                currentPlayerId={playerIdRef.current}
              />
            </div>

            {/* Right Panel - Cards and Controls */}
            <div className="xl:col-span-1 space-y-4">
              {gameState.phase === GamePhase.PROGRAMMING && currentPlayer.dealtCards.length > 0 && (
                <>
                  {/* Program Registers */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-3">Program Registers</h2>
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
                        className="w-full mt-4 px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold"
                      >
                        Submit Program
                      </button>
                    )}
                  </div>

                  {/* Dealt Cards */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-3">Your Hand</h2>
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
                </>
              )}

              {gameState.phase === GamePhase.EXECUTING && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-3">Executing Programs</h2>
                  <div className="text-center">
                    <p className="text-2xl mb-2">Register {gameState.currentRegister + 1} of 5</p>
                    <div className="flex justify-center gap-2 mt-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold
                            ${i < gameState.currentRegister
                              ? 'bg-green-600'
                              : i === gameState.currentRegister
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-gray-600'
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

              {gameState.phase === GamePhase.WAITING && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-3">Waiting to Start</h2>
                  <p className="text-gray-400">
                    Waiting for the host to start the game...
                  </p>
                  {gameState.hostId === playerIdRef.current && (
                    <button
                      onClick={() => socketClient.startGame()}
                      className="w-full mt-4 px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              )}

              {gameState.phase === GamePhase.ENDED && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-3">Game Over</h2>
                  <p className="text-2xl text-center mb-4">
                    Winner: <span className="text-green-400 font-bold">
                      {Object.values(gameState.players).find(p => p.checkpointsVisited === 4)?.name || 'Unknown'}
                    </span>
                  </p>
                  <button
                    onClick={handleLeaveGame}
                    className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Return to Lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}