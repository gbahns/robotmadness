import { useRef, useCallback, MutableRefObject } from 'react';
import { GameState, Player, PowerState, ProgramCard, Position } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';
import { RobotLaserShot } from '@/components/game/RobotLaserAnimation';

interface UseGameSocketProps {
    roomCode: string;
    playerIdRef: MutableRefObject<string>;
    gameState: GameState | null;
    isSubmitted: boolean;
    onGameStateUpdate: (updater: (prev: GameState | null) => GameState | null) => void;
    onLogEntry: (entry: any) => void;
    onExecutionMessage: (message: string) => void;
    onWinner: (winner: string) => void;
    onBoardPhase: (phase: string | null) => void;
    onActiveLasers: (lasers: RobotLaserShot[]) => void;
    onSelectedCourse: (courseId: string) => void;
    onPreviewBoard: (board: any) => void;
    onShowPowerDownPrompt: (show: boolean) => void;
    onShowRespawnModal: (show: boolean) => void;
    onIsRespawnDecision: (isRespawn: boolean) => void;
    onRespawnAlternatePositions: (positions: Position[] | undefined) => void;
    onIsSubmitted: (submitted: boolean) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
    onTimerUpdate?: (timeLeft: number) => void;
    onTimerExpired?: () => void;
    onDamagePreventionOpportunity?: (data: any) => void;
    onOptionCardUsedForDamage?: (data: any) => void;
}

export function useGameSocket({
    roomCode,
    playerIdRef,
    gameState,
    isSubmitted,
    onGameStateUpdate,
    onLogEntry,
    onExecutionMessage,
    onWinner,
    onBoardPhase,
    onActiveLasers,
    onSelectedCourse,
    onPreviewBoard,
    onShowPowerDownPrompt,
    onShowRespawnModal,
    onIsRespawnDecision,
    onRespawnAlternatePositions,
    onIsSubmitted,
    onError,
    onLoading,
    onTimerUpdate,
    onTimerExpired,
    onDamagePreventionOpportunity,
    onOptionCardUsedForDamage
}: UseGameSocketProps) {
    const logIdCounter = useRef(0);

    const connectToGame = useCallback((name: string, playerId?: string | null, isPractice?: boolean) => {
        // Connect to socket server
        socketClient.connect();

        // ===== Complex handlers (extracted as named functions) =====
        
        const handleRegisterStarted = (data: any) => {
            const message = `=== Register ${data.registerNumber} ===`;
            onExecutionMessage(message);
            onLogEntry({
                id: logIdCounter.current++,
                message,
                type: 'info',
                timestamp: new Date()
            });
        };

        const handleRobotDamaged = (data: any) => {
            const { playerName, damage, reason } = data;
            onLogEntry({
                id: logIdCounter.current++,
                message: `${playerName} takes ${damage} damage from ${reason}`,
                type: 'damage',
                timestamp: new Date()
            });
        };

        const handleRobotFellOffBoard = (data: any) => {
            const { playerName } = data;
            onLogEntry({
                id: logIdCounter.current++,
                message: `${playerName} fell off the board!`,
                type: 'damage',
                timestamp: new Date()
            });
        };

        const handleRobotDestroyed = (data: any) => {
            const { playerName, reason } = data;
            onLogEntry({
                id: logIdCounter.current++,
                message: `${playerName} was destroyed (${reason})!`,
                type: 'damage',
                timestamp: new Date()
            });
        };

        const handleCheckpointReached = (data: any) => {
            const { playerName, checkpointNumber } = data;
            onLogEntry({
                id: logIdCounter.current++,
                message: `${playerName} reached checkpoint ${checkpointNumber}!`,
                type: 'checkpoint',
                timestamp: new Date()
            });
        };

        const handleGameState = (state: GameState) => {
            console.log('Received game state:', state);
            console.log('Current player:', state.players[playerIdRef.current]);

            // Add a separator to the execution log when starting a new round
            if (gameState && state.roundNumber > gameState.roundNumber) {
                onLogEntry({
                    id: logIdCounter.current++,
                    message: `━━━━━ Round ${state.roundNumber} ━━━━━`,
                    type: 'info',
                    timestamp: new Date()
                });
            }

            // Preserve current player's local programming during programming phase
            onGameStateUpdate(prevState => {
                if (prevState &&
                    state.phase === 'programming' &&
                    prevState.phase === 'programming' &&
                    state.roundNumber === prevState.roundNumber &&
                    !isSubmitted &&
                    playerIdRef.current &&
                    state.players[playerIdRef.current] &&
                    prevState.players[playerIdRef.current]) {

                    // Preserve local selected cards for current player
                    // But don't preserve submitted state - use the server's value
                    const preservedCurrentPlayer = {
                        ...state.players[playerIdRef.current],
                        selectedCards: prevState.players[playerIdRef.current].selectedCards
                    };

                    return {
                        ...state,
                        players: {
                            ...state.players,
                            [playerIdRef.current]: preservedCurrentPlayer
                        }
                    };
                }

                // Normal game state update (including round transitions and phase changes)
                return state;
            });

            onSelectedCourse(state.course.definition.id);
            onLoading(false);

            if (state.phase === 'programming' && state.players[playerIdRef.current]?.dealtCards?.length > 0) {
                // Sync submitted state with server state
                const currentPlayerState = state.players[playerIdRef.current];
                onIsSubmitted(currentPlayerState?.submitted || false);
            }
        };

        const handlePlayerJoined = (data: { player: Player }) => {
            console.log('Player joined:', data.player.name);
            onGameStateUpdate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    players: {
                        ...prev.players,
                        [data.player.id]: data.player
                    }
                };
            });
        };

        const handlePlayerLeft = (data: { playerId: string }) => {
            console.log('Player left:', data.playerId);
            onGameStateUpdate(prev => {
                if (!prev) return prev;
                const newPlayers = { ...prev.players };
                delete newPlayers[data.playerId];
                return {
                    ...prev,
                    players: newPlayers
                };
            });
        };

        const handlePlayerDisconnected = (data: { playerId: string }) => {
            console.log('Player disconnected:', data.playerId);
            onGameStateUpdate(prev => {
                if (!prev || !prev.players[data.playerId]) return prev;
                return {
                    ...prev,
                    players: {
                        ...prev.players,
                        [data.playerId]: {
                            ...prev.players[playerIdRef.current],
                            isDisconnected: true
                        }
                    }
                };
            });
        };

        const handlePlayerReconnected = (data: { playerId: string }) => {
            console.log('Player reconnected:', data.playerId);
            onGameStateUpdate(prev => {
                if (!prev || !prev.players[data.playerId]) return prev;
                return {
                    ...prev,
                    players: {
                        ...prev.players,
                        [data.playerId]: {
                            ...prev.players[playerIdRef.current],
                            isDisconnected: false
                        }
                    }
                };
            });
        };

        const handlePlayerSubmitted = (data: { playerId: string, playerName: string }) => {
            console.log('Player submitted:', data.playerId);
            if (data.playerId != playerIdRef.current) {
                onLogEntry({
                    id: logIdCounter.current++,
                    message: `${data.playerName} submitted their program`,
                    type: 'info',
                    timestamp: new Date()
                });
            }
        };

        const handleCardExecuted = (data: { playerId: string; playerName: string; card: unknown; register: number }) => {
            console.log('Card executed:', data);
            const card = data.card as { type: string; priority: number };
            const message = `${data.playerName} ${card.type.replace(/_/g, ' ')} (Priority: ${card.priority})`;
            onLogEntry({
                id: logIdCounter.current++,
                message,
                type: 'action',
                timestamp: new Date()
            });
        };

        const handlePlayerPowerStateChanged = (data: {
            playerId: string;
            playerName: string;
            powerState: PowerState;
            announcedPowerDown: boolean;
        }) => {
            console.log(`${data.playerName} power state changed to ${data.powerState}`);
            onGameStateUpdate(prev => {
                if (!prev) return prev;

                const updatedPlayers = { ...prev.players };
                if (updatedPlayers[data.playerId]) {
                    updatedPlayers[data.playerId] = {
                        ...updatedPlayers[data.playerId],
                        powerState: data.powerState,
                        announcedPowerDown: data.announcedPowerDown
                    };
                }

                return {
                    ...prev,
                    players: updatedPlayers
                };
            });
        };

        const handlePlayerPoweredDown = (data: { playerId: string; playerName: string }) => {
            console.log(`${data.playerName} is now powered down`);
            onExecutionMessage(`${data.playerName} is powered down - all damage repaired!`);
            onLogEntry({
                id: logIdCounter.current++,
                type: 'power-down-active',
                message: `${data.playerName} powered down and repaired all damage`,
                timestamp: Date.now()
            });
        };

        const handleRegisterExecuted = (data: unknown) => {
            const typedData = data as { isPoweredDown?: boolean; playerName?: string };
            if (typedData.isPoweredDown) {
                onExecutionMessage(`${typedData.playerName} is powered down - skipping turn`);
                onLogEntry({
                    id: logIdCounter.current++,
                    type: 'execution',
                    message: `${typedData.playerName} is powered down`,
                    timestamp: Date.now()
                });
            }
        };

        const handleCourseSelected = (data: { courseId: string; previewBoard: unknown }) => {
            console.log('Course selected by host:', data.courseId);
            onSelectedCourse(data.courseId);
            if (data.previewBoard) {
                onPreviewBoard(data.previewBoard);
            }
        };

        const handleExecutionLog = (data: { message: string, type: string }) => {
            console.log('Execution log:', data.message, data.type);
            onLogEntry({
                id: logIdCounter.current++,
                message: `${data.message}`,
                type: data.type,
                timestamp: new Date()
            });
        };

        const handleRobotLasersFired = (laserShots: RobotLaserShot[]) => {
            console.log('Received robot-lasers-fired:', laserShots);
            onActiveLasers(laserShots);
        };

        const handlePowerDownOption = (data: { message: string }) => {
            console.log('Power down option:', data.message);
            onShowPowerDownPrompt(true);
            onIsRespawnDecision(false);
        };

        const handleRespawnPowerDownOption = (data: { 
            message: string; 
            isRespawn?: boolean;
            needsAlternatePosition?: boolean;
            availablePositions?: Position[];
        }) => {
            console.log('Respawn power down option:', data.message);
            if (data.needsAlternatePosition && data.availablePositions) {
                console.log('Alternate positions available:', data.availablePositions);
                onRespawnAlternatePositions(data.availablePositions);
            } else {
                onRespawnAlternatePositions(undefined);
            }
            onShowRespawnModal(true);
            onIsRespawnDecision(true);
        };

        // ===== Register all event handlers =====
        
        // Simple inline handlers
        socketClient.on('game-over', (data) => onWinner((data as { winner: string }).winner));
        socketClient.on('board-phase', (data) => onBoardPhase((data as { phase: string | null }).phase));
        socketClient.on('register-start', (data) => console.log('Executing register:', (data as { register: number }).register));
        socketClient.onGameError((data: { message: string }) => onError(data.message));
        
        // Timer events
        if (onTimerUpdate) {
            socketClient.on('timer-update', (data) => onTimerUpdate((data as { timeLeft: number }).timeLeft));
        }
        if (onTimerExpired) {
            socketClient.on('timer-expired', onTimerExpired);
        }

        // Complex handlers
        socketClient.on('register-started', (data) => handleRegisterStarted(data as { register: number }));
        socketClient.on('robot-damaged', (data) => handleRobotDamaged(data as { playerId: string; damage: number }));
        socketClient.on('robot-fell-off-board', (data) => handleRobotFellOffBoard(data as { playerId: string }));
        socketClient.on('robot-destroyed', (data) => handleRobotDestroyed(data as { playerId: string; reason: string }));
        socketClient.on('checkpoint-reached', (data) => handleCheckpointReached(data as { playerId: string; checkpointNumber: number }));
        socketClient.on('robot-lasers-fired', (data) => handleRobotLasersFired(data as RobotLaserShot[]));
        socketClient.on('course-selected', (data) => handleCourseSelected(data as { courseId: string; previewBoard: unknown }));
        socketClient.onGameState(handleGameState);
        socketClient.onPlayerJoined(handlePlayerJoined);
        socketClient.onPlayerLeft(handlePlayerLeft);
        socketClient.on('player-disconnected', (data) => handlePlayerDisconnected(data as { playerId: string }));
        socketClient.on('player-reconnected', (data) => handlePlayerReconnected(data as { playerId: string }));
        socketClient.on('player-submitted', (data) => handlePlayerSubmitted(data as { playerId: string; playerName: string }));
        socketClient.on('execution-log', (data) => handleExecutionLog(data as { message: string; type: string }));
        socketClient.on('card-executed', (data) => handleCardExecuted(data as { playerId: string; playerName: string; card: unknown; register: number }));
        socketClient.on('player-power-state-changed', (data) => handlePlayerPowerStateChanged(data as { playerId: string; playerName: string; powerState: PowerState; announcedPowerDown: boolean }));
        socketClient.on('player-powered-down', (data) => handlePlayerPoweredDown(data as { playerId: string; playerName: string }));
        socketClient.on('power-down-option', (data) => handlePowerDownOption(data as { message: string }));
        socketClient.on('respawn-power-down-option', (data) => handleRespawnPowerDownOption(data as { message: string; isRespawn?: boolean }));
        socketClient.on('register-executed', (data) => handleRegisterExecuted(data as unknown));
        
        // Damage prevention events
        if (onDamagePreventionOpportunity) {
            socketClient.on('damage-prevention-opportunity', (data) => onDamagePreventionOpportunity(data));
        }
        if (onOptionCardUsedForDamage) {
            socketClient.on('option-card-used-for-damage', (data) => onOptionCardUsedForDamage(data));
        }
        
        // Handle register updates from other players
        socketClient.on('register-update', (data) => {
            // Update the game state with the new register programming
            onGameStateUpdate(prevState => {
                const typedData = data as { playerId: string; selectedCards: (ProgramCard | null)[] };
                if (!prevState || typedData.playerId === playerIdRef.current) return prevState;
                
                return {
                    ...prevState,
                    players: {
                        ...prevState.players,
                        [typedData.playerId]: {
                            ...prevState.players[typedData.playerId],
                            selectedCards: typedData.selectedCards
                        }
                    }
                };
            });
        });

        // Join the game
        const id = playerId || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        playerIdRef.current = id;
        localStorage.setItem('playerId', id);
        socketClient.joinGame(roomCode, name, id, isPractice);
    }, [
        roomCode,
        // Only include stable callbacks that won't change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]);

    return { connectToGame };
}