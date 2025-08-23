// components/game/ProgrammingControls.tsx
// This component displays programming phase status messages

import React from 'react';
import { GameState, Player } from '@/lib/game/types';

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
        <div className="space-y-3">
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

        </div>
    );
}