import React from 'react';
import { Player, ProgramCard, GamePhase } from '@/lib/game/types';
import Card from './Card';

interface ExecutionCardDisplayProps {
    players: Record<string, Player>;
    currentRegister: number;
    phase: GamePhase;
    currentExecutingPlayerId?: string;
}

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

export default function ExecutionCardDisplay({
    players,
    currentRegister,
    phase,
    currentExecutingPlayerId
}: ExecutionCardDisplayProps) {
    // Only show during execution phase
    if (phase !== 'executing') return null;

    const playerArray = Object.values(players);
    
    // Get all cards for the current register, sorted by priority
    const registerCards: Array<{
        player: Player;
        card: ProgramCard | null;
        playerIndex: number;
    }> = [];

    playerArray.forEach((player, index) => {
        if (player.lives > 0 && player.selectedCards && player.selectedCards[currentRegister]) {
            registerCards.push({
                player,
                card: player.selectedCards[currentRegister],
                playerIndex: index
            });
        }
    });

    // Sort by priority (highest first)
    registerCards.sort((a, b) => {
        if (!a.card || !b.card) return 0;
        return b.card.priority - a.card.priority;
    });

    return (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-300">
                Register {currentRegister + 1} - All Players
            </h3>
            <div className="space-y-2">
                {registerCards.map(({ player, card, playerIndex }) => {
                    const isCurrentlyExecuting = currentExecutingPlayerId === player.id;
                    const isSkipped = player.powerState === 'OFF';
                    
                    return (
                        <div 
                            key={player.id}
                            className={`flex items-center gap-2 p-1 rounded transition-all ${
                                isCurrentlyExecuting 
                                    ? 'bg-yellow-500 bg-opacity-20 ring-2 ring-yellow-400' 
                                    : ''
                            } ${isSkipped ? 'opacity-50' : ''}`}
                        >
                            {/* Player indicator */}
                            <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: getPlayerColor(playerIndex) }}
                            >
                                {playerIndex + 1}
                            </div>
                            
                            {/* Player name */}
                            <div className="text-xs text-gray-300 w-20 truncate">
                                {player.name}
                            </div>
                            
                            {/* Card display */}
                            {card ? (
                                <div className="scale-75 origin-left">
                                    <Card 
                                        card={card}
                                        index={0}
                                        isSelected={false}
                                        isDraggable={false}
                                        onClick={() => {}}
                                    />
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">
                                    {isSkipped ? 'Powered Down' : 'No Card'}
                                </div>
                            )}
                            
                            {/* Priority indicator */}
                            {card && (
                                <div className="text-xs text-gray-400 ml-auto">
                                    Priority: {card.priority}
                                </div>
                            )}
                            
                            {/* Currently executing indicator */}
                            {isCurrentlyExecuting && (
                                <div className="text-yellow-400 animate-pulse ml-2">
                                    ▶
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {registerCards.length === 0 && (
                    <div className="text-xs text-gray-500 italic text-center py-2">
                        No cards programmed for this register
                    </div>
                )}
            </div>
        </div>
    );
}