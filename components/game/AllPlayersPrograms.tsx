import React, { useEffect, useState } from 'react';
import { Player, GamePhase } from '@/lib/game/types';
import Card from './Card';

interface AllPlayersProgramsProps {
    players: Record<string, Player>;
    currentRegister: number;
    phase: GamePhase;
    currentExecutingPlayerId?: string;
    currentPlayerId: string;
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

export default function AllPlayersPrograms({
    players,
    currentRegister,
    phase,
    currentExecutingPlayerId,
    currentPlayerId
}: AllPlayersProgramsProps) {
    const [revealedRegisters, setRevealedRegisters] = useState<Set<number>>(new Set());
    
    // When the current register changes, reveal those cards (and keep them revealed)
    useEffect(() => {
        if (phase === 'executing') {
            // Small delay before revealing cards for dramatic effect
            const timer = setTimeout(() => {
                setRevealedRegisters(prev => new Set(prev).add(currentRegister));
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setRevealedRegisters(new Set());
        }
    }, [currentRegister, phase]);

    // Only show during execution phase
    if (phase !== 'executing') return null;

    // Filter out dead players and the current player
    const playerArray = Object.values(players).filter(p => p.lives > 0 && p.id !== currentPlayerId);
    
    // If only one player in game (current player), no need to show this component
    if (playerArray.length === 0) return null;
    
    // Hide if all players have cleared registers (no cards selected)
    const anyPlayerHasCards = playerArray.some(p => 
        p.selectedCards && p.selectedCards.some(card => card !== null)
    );
    if (!anyPlayerHasCards) return null;

    return (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">
                Other Players - Register {currentRegister + 1} Executing
            </h3>
            
            {/* Show all players' programs */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {playerArray.map((player, playerIndex) => {
                    const isCurrentlyExecuting = currentExecutingPlayerId === player.id;
                    const isPoweredDown = player.powerState === 'OFF';
                    
                    return (
                        <div 
                            key={player.id}
                            className={`border border-gray-700 rounded p-2 ${isPoweredDown ? 'opacity-50' : ''}`}
                        >
                            {/* Player header */}
                            <div className="flex items-center gap-2 mb-2">
                                <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: getPlayerColor(playerIndex) }}
                                >
                                    {playerIndex + 1}
                                </div>
                                <span className="text-sm font-medium text-gray-200">
                                    {player.name}
                                </span>
                                {isPoweredDown && (
                                    <span className="text-xs text-yellow-500 ml-auto">Powered Down</span>
                                )}
                                {isCurrentlyExecuting && (
                                    <span className="text-yellow-400 animate-pulse ml-auto">▶ Executing</span>
                                )}
                            </div>
                            
                            {/* Player's 5 registers */}
                            <div className="flex gap-1">
                                {[0, 1, 2, 3, 4].map((registerIndex) => {
                                    const card = player.selectedCards?.[registerIndex];
                                    const isCurrentReg = registerIndex === currentRegister;
                                    const shouldReveal = revealedRegisters.has(registerIndex);
                                    const isLocked = registerIndex >= 5 - player.lockedRegisters;
                                    
                                    return (
                                        <div 
                                            key={registerIndex}
                                            className={`relative ${isCurrentReg && isCurrentlyExecuting ? 'ring-2 ring-yellow-400 bg-yellow-900 bg-opacity-20 rounded' : ''}`}
                                        >
                                            {card ? (
                                                <div className={`scale-[0.6] origin-top-left w-10 h-12 ${
                                                    shouldReveal ? '' : 'opacity-90'
                                                }`}>
                                                    {shouldReveal || isLocked ? (
                                                        // Show the actual card if it's revealed or locked
                                                        <Card 
                                                            card={card}
                                                            index={0}
                                                            isSelected={false}
                                                            isDraggable={false}
                                                            isLocked={isLocked}
                                                            onClick={() => {}}
                                                        />
                                                    ) : (
                                                        // Show card back for unrevealed cards
                                                        <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center">
                                                            <div className="text-gray-500 text-2xl font-bold">?</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                // Empty slot
                                                <div className="w-10 h-12 border border-gray-700 rounded bg-gray-900 opacity-30" />
                                            )}
                                            
                                            {/* Register number */}
                                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-500">
                                                {registerIndex + 1}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}