// components/game/ProgrammingControls.tsx
// This component displays programming phase status messages

import React from 'react';
import { GameState, Player } from '@/lib/game/types';

interface ProgrammingControlsProps {
    gameState: GameState;
    currentPlayer: Player | null;
    selectedCards: (any | null)[];
    onSubmitCards: () => void;
    isSubmitted?: boolean;
}

export default function ProgrammingControls({
    gameState,
    currentPlayer,
    selectedCards,
    onSubmitCards,
    isSubmitted = false
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
            {/* Program Submitted Message - only show if not powered down */}
            {isSubmitted && currentPlayer.powerState !== 'OFF' && (
                <div className="text-center text-green-400 text-sm">
                    ✓ Program submitted! Waiting for other players...
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