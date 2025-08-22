// components/game/ProgrammingControls.tsx
// This component handles the programming phase controls including power down

import React from 'react';
import { GameState, Player } from '@/lib/game/types';
import PowerDownButton from './PowerDownButton';

interface ProgrammingControlsProps {
    gameState: GameState;
    currentPlayer: Player | null;
    selectedCards: (any | null)[];
    onSubmitCards: () => void;
}

export default function ProgrammingControls({
    gameState,
    currentPlayer,
    selectedCards,
    onSubmitCards
}: ProgrammingControlsProps) {

    const canSubmit = () => {
        if (!currentPlayer) return false;

        // If powered down, auto-ready
        if (currentPlayer.powerState === 'OFF') return true;

        // Check if all non-locked registers have cards
        const requiredCards = 5 - currentPlayer.lockedRegisters;
        const selectedCount = selectedCards.filter(c => c !== null).length;
        return selectedCount === requiredCards;
    };

    if (gameState.phase !== 'programming' || !currentPlayer) {
        return null;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Programming Phase</h2>

            {/* Power Down Button - only show if not already powered down and has lives */}
            {currentPlayer.powerState !== 'OFF' && currentPlayer.lives > 0 && (
                <PowerDownButton
                    roomCode={gameState.roomCode || ''}
                    playerId={currentPlayer.id}
                    powerState={currentPlayer.powerState}
                    damage={currentPlayer.damage}
                    isProgrammingPhase={gameState.phase === 'programming'}
                    selectedCards={selectedCards}
                />
            )}

            {/* Power Down Status Message */}
            {currentPlayer.powerState === 'OFF' && (
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
            )}

            {/* Announcing Power Down Status */}
            {currentPlayer.powerState === 'ANNOUNCING' && (
                <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400 font-semibold">Power Down Announced</span>
                    </div>
                    <p className="text-sm text-red-200 mt-2">
                        Your robot will power down next turn and repair all damage.
                    </p>
                </div>
            )}

            {/* Out of Lives Message */}
            {currentPlayer.lives <= 0 && (
                <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                        <span className="text-red-400 font-bold text-lg">You are out of lives!</span>
                    </div>
                </div>
            )}

            {/* Auto-submit for powered down robots */}
            {//not clear what the purpose of this was supposed to be.  "Confirm Powered Down" button
                // it seems redundant since powered down robots don't need to submit cards
                // and the concept of "Confirm Powered Down" is supposed to happen at the end of the turn
                // so it's implemented in a different way
            /* {currentPlayer.powerState === 'OFF' && (
                <div className="border-t border-gray-700 pt-4">
                    <button
                        onClick={() => {
                            // Submit empty cards for powered down robot
                            socketClient.emit('submit-cards', {
                                roomCode: gameState.roomCode,
                                cards: [null, null, null, null, null]
                            });
                        }}
                        disabled={currentPlayer.submitted}
                        className={`w-full px-6 py-3 font-bold rounded-lg ${currentPlayer.submitted
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                    >
                        {currentPlayer.submitted ? 'Ready' : 'Confirm Powered Down'}
                    </button>
                </div>
            )} */}

            {/* Player Status Summary */}
            <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Damage:</span>
                    <span className={`font-bold ${currentPlayer.damage >= 8 ? 'text-red-400' :
                        currentPlayer.damage >= 5 ? 'text-orange-400' :
                            'text-white'
                        }`}>
                        {currentPlayer.damage}/10
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Lives:</span>
                    <span className="text-white font-bold">{currentPlayer.lives}/3</span>
                </div>
                {currentPlayer.lockedRegisters > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Locked Registers:</span>
                        <span className="text-orange-400 font-bold">{currentPlayer.lockedRegisters}</span>
                    </div>
                )}
            </div>
        </div>
    );
}