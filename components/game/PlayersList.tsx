import React from 'react';
import { Player } from '@/lib/game/types';

interface PlayersListProps {
    players: Record<string, Player>;
    currentPlayerId: string;
    isSubmitted?: boolean;
    isProgrammingPhase?: boolean;
    isExecutingPhase?: boolean;
}

const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function PlayersList({
    players,
    currentPlayerId,
    isSubmitted = false,
    isProgrammingPhase = false,
    isExecutingPhase = false
}: PlayersListProps) {
    const playerArray = Object.values(players);
    
    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">
                Players ({playerArray.length}/8)
                {isProgrammingPhase && isSubmitted && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                        - Waiting for others...
                    </span>
                )}
            </h2>
            <div className="space-y-1">
                {playerArray.map((player, index) => (
                    <div
                        key={`${player.id}-info`}
                        className={`flex items-center justify-between py-1 px-2 rounded ${
                            player.id === currentPlayerId ? 'bg-gray-700' : ''
                        } ${player.isDisconnected ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Player Number Badge */}
                            <div 
                                className={`w-6 h-6 rounded-full bg-${PLAYER_COLORS[index % 8]}-500 flex items-center justify-center text-xs font-bold flex-shrink-0`}
                                style={{
                                    backgroundColor: getPlayerColor(index)
                                }}
                            >
                                {index + 1}
                            </div>
                            
                            {/* Player Name */}
                            <span className={`truncate ${
                                player.isDisconnected ? 'line-through' : ''
                            } ${
                                player.lives <= 0 ? 'text-red-500 line-through' : ''
                            }`}>
                                {player.name}
                            </span>
                            
                            {/* Host Badge */}
                            {index === 0 && (
                                <span className="text-xs text-yellow-400 flex-shrink-0">(Host)</span>
                            )}
                            
                            {/* Disconnected Badge */}
                            {player.isDisconnected && (
                                <span className="text-xs text-red-400 flex-shrink-0">(Disconnected)</span>
                            )}
                        </div>
                        
                        {/* Player Stats */}
                        <div className="flex items-center gap-1 text-sm flex-shrink-0">
                            <span className="whitespace-nowrap">❤️{player.lives}</span>
                            <span className="whitespace-nowrap">⚡{player.damage}</span>
                            {player.checkpointsVisited >= 0 && (
                                <span className="whitespace-nowrap">🚩{player.checkpointsVisited}</span>
                            )}
                            
                            {/* Power State Indicator */}
                            {player.powerState === 'ANNOUNCING' && isExecutingPhase ? (
                                <span 
                                    className="text-red-400 animate-pulse flex-shrink-0" 
                                    title="Announced power down for next turn"
                                >
                                    🛑
                                </span>
                            ) : player.powerState === 'OFF' ? (
                                <span 
                                    className="text-red-500 flex-shrink-0" 
                                    title="Powered down"
                                >
                                    🛑
                                </span>
                            ) : (
                                <span 
                                    className="text-green-500 flex-shrink-0" 
                                    title="Powered on"
                                >
                                    🟢
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                {!players || playerArray.length === 0 && (
                    <p className="text-gray-400">Connecting...</p>
                )}
            </div>
        </div>
    );
}

// Helper function to get player color
function getPlayerColor(index: number): string {
    const colors = [
        '#ef4444', // red-500
        '#3b82f6', // blue-500
        '#10b981', // green-500
        '#eab308', // yellow-500
        '#a855f7', // purple-500
        '#f97316', // orange-500
        '#ec4899', // pink-500
        '#06b6d4', // cyan-500
    ];
    return colors[index % 8];
}