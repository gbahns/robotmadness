'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { GameState, ProgramCard, Player, Course } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';
import CourseComponent from '@/components/game/Course';
import Hand from '@/components/game/Hand';
import ProgramRegisters from '@/components/game/ProgramRegisters';
import GameContent from '@/components/game/GameContent';
import ExecutionLog from '@/components/game/ExecutionLog';
import { RobotLaserShot } from '@/components/game/RobotLaserAnimation';
import GameControls from '@/components/game/GameControls';
import ProgrammingControls from '@/components/game/ProgrammingControls';
import PowerDownButton from '@/components/game/PowerDownButton';
import { getCourseById, buildCourse } from '@/lib/game/courses/courses';
import RespawnDecisionPanel from '@/components/game/RespawnDecisionPanel';
import PlayersList from '@/components/game/PlayersList';
import GameHeader from '@/components/game/GameHeader';
import { LoadingScreen, NameModal, ErrorScreen, GameOverModal } from '@/components/game/LoadingStates';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useCardManagement } from '@/hooks/useCardManagement';
import Timer from '@/components/game/Timer';
import DamagePreventionDialog from '@/components/game/DamagePreventionDialog';
import OptionCards from '@/components/game/OptionCards';
import { OptionCard } from '@/lib/game/optionCards';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [logEntries, setLogEntries] = useState<{id: number; message: string; type: 'info' | 'action' | 'damage' | 'checkpoint' | 'option'; timestamp: Date}[]>([]);
  const playerIdRef = useRef<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [executionMessage, setExecutionMessage] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [boardPhase, setBoardPhase] = useState<string | null>(null);
  const [activeLasers, setActiveLasers] = useState<RobotLaserShot[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previewBoard, setPreviewBoard] = useState<Course | null>(null);
  //const [showPowerDownModal, setShowPowerDownModal] = useState(false);
  const [showPowerDownPrompt, setShowPowerDownPrompt] = useState(false);
  const [showRespawnModal, setShowRespawnModal] = useState(false);
  const [isRespawnDecision, setIsRespawnDecision] = useState(false);
  const [timerTimeLeft, setTimerTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [damagePreventionDialog, setDamagePreventionDialog] = useState<{
    isOpen: boolean;
    damageAmount: number;
    source: string;
    optionCards: OptionCard[];
  } | null>(null);

  useEffect(() => {
    // Build preview board when course is selected
    if (!selectedCourse) return;
    const courseDef = getCourseById(selectedCourse);
    if (courseDef) {
      const course = buildCourse(courseDef);
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
    onLoading: setLoading,
    onTimerUpdate: (timeLeft) => {
      setTimerTimeLeft(timeLeft);
      setIsTimerActive(timeLeft > 0);
    },
    onTimerExpired: () => {
      setIsTimerActive(false);
      setTimerTimeLeft(0);
    },
    onDamagePreventionOpportunity: (data: {
      damageAmount: number;
      source: string;
      optionCards: OptionCard[];
    }) => {
      setDamagePreventionDialog({
        isOpen: true,
        ...data
      });
    },
    onOptionCardUsedForDamage: (data: { playerName: string; card: { name: string }; damagePreventedSoFar: number; damageRemaining: number }) => {
      setLogEntries(prev => [...prev, {
        id: Date.now(),
        message: `${data.playerName} used ${data.card.name} to prevent damage (${data.damagePreventedSoFar}/${data.damageRemaining + data.damagePreventedSoFar} prevented)`,
        type: 'option',
        timestamp: new Date(),
      }]);
    }
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
    return <LoadingScreen />;
  }

  if (showNameModal) {
    return (
      <NameModal
        roomCode={roomCode}
        playerName={playerName}
        onNameChange={setPlayerName}
        onJoinGame={handleJoinGame}
      />
    );
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <GameContent>
      <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        {winner && (
          <GameOverModal
            winner={winner}
            onBackToHome={() => router.push('/')}
          />
        )}

        {damagePreventionDialog && (
          <DamagePreventionDialog
            isOpen={damagePreventionDialog.isOpen}
            damageAmount={damagePreventionDialog.damageAmount}
            source={damagePreventionDialog.source}
            optionCards={damagePreventionDialog.optionCards}
            roomCode={roomCode}
            onClose={() => setDamagePreventionDialog(null)}
          />
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {/* Game Header */}
          <div className="px-4 pt-4">
            <GameHeader roomCode={roomCode} onLeaveGame={handleLeaveGame} isHost={isHost} />
          </div>

          {/* Game Area - Main horizontal layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left Column - Game Board - no padding */}
            <div className="flex-1 flex flex-col">
              {/* Game Board - takes most space */}
              <div className="flex-1 flex">
                <CourseComponent
                  courseId={selectedCourse || ""}
                  players={gameState?.players || {}}
                  currentPlayerId={playerIdRef.current}
                  isHost={isHost}
                  gameState={gameState || undefined}
                  activeLasers={activeLasers}
                />
              </div>
            </div>

            {/* Right Column - Players, Cards and Controls */}
            <div className="w-96 flex flex-col min-h-0 pr-4 pb-4">
                {/* Top content container - auto-sized based on content */}
                <div className="space-y-4 flex-shrink-0">
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

                  {/* Timer - show during programming phase */}
                  {gameState?.phase === 'programming' && (
                    <Timer timeLeft={timerTimeLeft} isActive={isTimerActive} />
                  )}

                  {/* Hand - moved under players list (or show powered down status) */}
                  {gameState?.phase === 'programming' && currentPlayer && (
                  currentPlayer.powerState === 'OFF' ? (
                    <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-400 font-semibold">Robot Powered Down</span>
                      </div>
                      <p className="text-sm text-yellow-200 mt-2">
                        Your robot is powered down this turn. No programming needed.
                      </p>
                    </div>
                  ) : (
                    <Hand
                      cards={currentPlayer.dealtCards || []}
                      selectedCards={currentPlayer.selectedCards}
                      onCardClick={handleCardClick}
                      isSubmitted={isSubmitted}
                    />
                  )
                )}

                {/* Program Registers - moved under hand */}
                {(gameState?.phase === 'programming' || gameState?.phase === 'executing') && currentPlayer && (
                  <div>
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
                    
                    {/* Option Cards Display - moved below registers */}
                    {currentPlayer.optionCards && currentPlayer.optionCards.length > 0 && (
                      <div className="mt-4">
                        <OptionCards 
                          optionCards={currentPlayer.optionCards}
                        />
                      </div>
                    )}
                    
                    {/* All control buttons together */}
                    {gameState?.phase === 'programming' && (
                      <div className="flex gap-2 mt-4">
                        {currentPlayer.powerState !== 'OFF' && currentPlayer.lives > 0 && (
                          <PowerDownButton
                            roomCode={roomCode}
                            playerId={currentPlayer.id}
                            powerState={currentPlayer.powerState}
                            damage={currentPlayer.damage}
                            isProgrammingPhase={gameState.phase === 'programming'}
                            selectedCards={currentPlayer.selectedCards || []}
                          />
                        )}
                        <button
                          onClick={handleSubmitCards}
                          disabled={isSubmitted || currentPlayer.selectedCards.filter(c => c !== null).length < 5}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold text-sm"
                        >
                          {isSubmitted ? 'Submitted' : 'Submit'}
                        </button>
                        <button
                          onClick={handleResetCards}
                          disabled={currentPlayer.selectedCards.filter(c => c !== null).length === 0}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold text-sm"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
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
                      isSubmitted={isSubmitted}
                    />
                  )}
                </div>

                {/* ExecutionLog - fills remaining space */}
                <div className="flex-1 min-h-0 mt-4 overflow-hidden">
                  <ExecutionLog entries={logEntries} />
                </div>
            </div>
          </div>
        </div>
      </div>
    </GameContent>
  );
}
