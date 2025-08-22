'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { GameState, ProgramCard, Player, PowerState } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';
import Course from '@/components/game/Course';
import Hand from '@/components/game/Hand';
import ProgramRegisters from '@/components/game/ProgramRegisters';
import GameContent from '@/components/game/GameContent';
import ExecutionLog from '@/components/game/ExecutionLog';
import { RobotLaserShot } from '@/components/game/RobotLaserAnimation';
import GameControls from '@/components/game/GameControls';
import ProgrammingControls from '@/components/game/ProgrammingControls';
import { getCourseById } from '@/lib/game/courses/courses';
import RespawnDecisionPanel from '@/components/game/RespawnDecisionPanel';
import PlayersList from '@/components/game/PlayersList';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useCardManagement } from '@/hooks/useCardManagement';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const playerIdRef = useRef<string>('');
  const [executionMessage, setExecutionMessage] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [boardPhase, setBoardPhase] = useState<string | null>(null);
  const [activeLasers, setActiveLasers] = useState<RobotLaserShot[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>();
  const [previewBoard, setPreviewBoard] = useState<any>(null);
  //const [showPowerDownModal, setShowPowerDownModal] = useState(false);
  const [showPowerDownPrompt, setShowPowerDownPrompt] = useState(false);
  const [showRespawnModal, setShowRespawnModal] = useState(false);
  const [isRespawnDecision, setIsRespawnDecision] = useState(false);

  useEffect(() => {
    // Build preview board when course is selected
    if (!selectedCourse) return;
    const course = getCourseById(selectedCourse);
    if (course) {
      setPreviewBoard(course);
    }
  }, [selectedCourse]);

  useEffect(() => {
    console.log('GamePage component mounted');
    return () => {
      console.log('GamePage component unmounted');
    };
  }, []);

  // Use the card management hook
  const {
    isSubmitted,
    currentPlayer,
    handleCardClick: cardClick,
    handleCardDrop: cardDrop,
    handleCardRemove: cardRemove,
    handleSubmitCards,
    handleResetCards: resetCards,
    setIsSubmitted
  } = useCardManagement({
    gameState,
    playerIdRef,
    roomCode,
    onLogEntry: (entry) => setLogEntries(prev => [...prev, entry])
  });

  // Use the socket hook
  const { connectToGame } = useGameSocket({
    roomCode,
    playerIdRef,
    gameState,
    isSubmitted,
    onGameStateUpdate: setGameState,
    onLogEntry: (entry) => setLogEntries(prev => [...prev, entry]),
    onExecutionMessage: setExecutionMessage,
    onWinner: setWinner,
    onBoardPhase: setBoardPhase,
    onActiveLasers: setActiveLasers,
    onSelectedCourse: setSelectedCourse,
    onPreviewBoard: setPreviewBoard,
    onShowPowerDownPrompt: setShowPowerDownPrompt,
    onShowRespawnModal: setShowRespawnModal,
    onIsRespawnDecision: setIsRespawnDecision,
    onIsSubmitted: setIsSubmitted,
    onError: setError,
    onLoading: setLoading
  });

  const hasConnectedRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple connections
    if (hasConnectedRef.current) return;
    
    // Check if we have a player name in localStorage
    const storedName = localStorage.getItem('playerName');
    const storedPlayerId = localStorage.getItem('playerId');

    if (storedName) {
      hasConnectedRef.current = true;
      setPlayerName(storedName);
      playerIdRef.current = storedPlayerId || '';
      connectToGame(storedName, storedPlayerId);
    } else {
      setShowNameModal(true);
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      hasConnectedRef.current = false;
      socketClient.leaveGame();
      socketClient.disconnect();
    };
    // Remove connectToGame from dependencies - it's stable within the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleJoinGame = () => {
    if (playerName.trim()) {
      localStorage.setItem('playerName', playerName);
      setShowNameModal(false);
      hasConnectedRef.current = true;
      connectToGame(playerName);
    }
  };

  const handleLeaveGame = () => {
    //if (confirm('Are you sure you want to leave the game?')) {
    socketClient.leaveGame();
    router.push('/');
    //}
  };

  const isHost = Object.keys(gameState?.players || {}).indexOf(playerIdRef.current) === 0;

  // Card management wrapper functions that update state
  const handleCardClick = (index: number) => {
    const newState = cardClick(index);
    if (newState) setGameState(newState);
  };

  const handleCardDrop = (card: ProgramCard, registerIndex: number) => {
    const newState = cardDrop(card, registerIndex);
    if (newState) setGameState(newState);
  };

  const handleCardRemove = (registerIndex: number) => {
    const newState = cardRemove(registerIndex);
    if (newState) setGameState(newState);
  };

  const handleResetCards = () => {
    const newState = resetCards();
    if (newState) setGameState(newState);
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
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
        {winner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">Game Over!</h2>
              <p className="text-2xl mb-6">Winner: <span className="font-bold text-white">{winner}</span></p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-lg font-semibold"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-7xl flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">RobotMadness</h1>
              <a href="/" className="text-blue-400 hover:underline text-sm">
                &larr; Back to Home
              </a>
            </div>
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
          <div className="flex-1 flex flex-col gap-6">
            {/* Top Section - Board and Players/Controls */}
            <div className="flex-1 flex gap-6 min-h-0">
              {/* Game Board - takes most space - removed gray container - responsive container*/}
              <div className="flex-1 flex items-center justify-center">
                <Course
                  courseId={selectedCourse || ""}
                  players={gameState?.players || {}}
                  currentPlayerId={playerIdRef.current}
                  isHost={isHost}
                  gameState={gameState}
                  roomCode={roomCode}
                  activeLasers={activeLasers}
                />
              </div>

              {/* Right side - Players and Controls stacked */}
              <div className="w-80 space-y-6">
                {/* Players List Component */}
                {gameState && (
                  <PlayersList
                    players={gameState.players}
                    currentPlayerId={playerIdRef.current}
                    isSubmitted={isSubmitted}
                    isProgrammingPhase={gameState.phase === 'programming'}
                    isExecutingPhase={gameState.phase === 'executing'}
                  />
                )}

                {(gameState?.phase === 'waiting' || (showPowerDownPrompt && currentPlayer?.lives || 0 > 0)) && (
                  <GameControls
                    isHost={isHost}
                    roomCode={roomCode}
                    playerCount={Object.keys(gameState?.players || {}).length}
                    currentPlayer={currentPlayer}
                    gameState={gameState}
                    selectedCourse={selectedCourse}
                    onCourseChange={setSelectedCourse}
                    showPowerDownPrompt={showPowerDownPrompt}
                    onPowerDownDecision={(continueDown: boolean) => {
                      // Check if this is a respawn scenario (not currently powered down)
                      const isRespawnScenario = currentPlayer?.powerState !== 'OFF';

                      if (isRespawnScenario) {
                        // For respawn, ALWAYS send a decision to the server
                        if (continueDown) {
                          socketClient.emit('toggle-power-down', {
                            roomCode,
                            playerId: playerIdRef.current,
                            selectedCards: null // No cards selected during respawn
                          });
                        } else {
                          // Send a "no power down" decision for respawn
                          socketClient.emit('toggle-power-down', {
                            roomCode,
                            playerId: playerIdRef.current,
                            selectedCards: [] // Empty array indicates "don't power down" for respawn
                          });
                        }
                      } else {
                        // For regular power down decision, use continue-power-down
                        socketClient.emit('continue-power-down', {
                          roomCode,
                          playerId: playerIdRef.current,
                          continueDown
                        });
                      }
                      setShowPowerDownPrompt(false);
                    }}
                  />
                )}

                {/* Show respawn decision panel when needed */}
                {showRespawnModal && currentPlayer && (
                  <RespawnDecisionPanel
                    roomCode={roomCode}
                    playerId={currentPlayer.id}
                    playerName={currentPlayer.name}
                    isRespawn={isRespawnDecision}
                    onComplete={() => {
                      setShowRespawnModal(false);
                      setShowPowerDownPrompt(false);
                    }}
                  />
                )}

                {/* Show programming controls when not making respawn decision */}
                {gameState?.phase === 'programming' && !showRespawnModal && (
                  <ProgrammingControls
                    gameState={gameState}
                    currentPlayer={currentPlayer || {} as Player}
                    selectedCards={currentPlayer?.selectedCards || []}
                    onSubmitCards={handleSubmitCards}
                  />
                )}

                <ExecutionLog entries={logEntries} />
              </div>
            </div>

            {/* Bottom Section - Cards */}
            <div className="space-y-6">
              {/*gameState?.phase === 'programming' &&*/ currentPlayer && (
                <>
                  {/* Hand */}
                  {gameState?.phase === 'programming' && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <Hand
                        cards={currentPlayer.dealtCards || []}
                        selectedCards={currentPlayer.selectedCards}
                        onCardClick={handleCardClick}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  )}

                  {/* Program Registers */}
                  {(gameState?.phase === 'programming' || gameState?.phase === 'executing') && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <ProgramRegisters
                            selectedCards={currentPlayer.selectedCards}
                            lockedRegisters={currentPlayer.lockedRegisters}
                            onCardDrop={handleCardDrop}
                            onCardRemove={handleCardRemove}
                            isSubmitted={isSubmitted}
                            currentRegister={gameState?.currentRegister}
                            phase={gameState?.phase}
                            boardPhase={boardPhase}
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
                        {(/*gameState?.phase === 'programming' || isSubmitted ||*/ currentPlayer.selectedCards.filter(c => c !== null).length > 0) && (
                          <button
                            onClick={handleResetCards}
                            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-semibold"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </>
              )}

              {isHost && gameState?.phase === 'waiting' && (
                <div className="flex flex-col gap-4">
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameContent>
  );
}
