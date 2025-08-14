import React from 'react';
import { PowerState, ProgramCard } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';

interface PowerDownButtonProps {
    roomCode: string;
    playerId: string;
    powerState: PowerState;
    damage: number;
    disabled?: boolean;
    isProgrammingPhase: boolean;
    selectedCards: (ProgramCard | null)[];
}

export default function PowerDownButton({
    roomCode,
    playerId,
    powerState,
    damage,
    disabled = false,
    isProgrammingPhase,
    selectedCards
}: PowerDownButtonProps) {

    const handleToggle = () => {
        console.log(`Toggling power down for player ${playerId} in game ${roomCode} isProgrammingPhase: ${isProgrammingPhase}`);
        if (!isProgrammingPhase) return;
        socketClient.emit('toggle-power-down', { roomCode, playerId, selectedCards });
    };

    const getButtonText = () => {
        switch (powerState) {
            case PowerState.ON:
                return 'Announce Power Down';
            case PowerState.ANNOUNCING:
                return 'Cancel Power Down';
            case PowerState.OFF:
                return 'Stay Powered Down';
        }
    };

    const getButtonStyle = () => {
        const baseClasses = "px-6 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center gap-2";

        if (disabled || !isProgrammingPhase) {
            return `${baseClasses} bg-gray-400 cursor-not-allowed opacity-50`;
        }

        switch (powerState) {
            case PowerState.ON:
                return `${baseClasses} bg-yellow-500 hover:bg-yellow-600 shadow-lg hover:shadow-xl`;
            case PowerState.ANNOUNCING:
                return `${baseClasses} bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl animate-pulse`;
            case PowerState.OFF:
                return `${baseClasses} bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl`;
        }
    };

    const getTooltip = () => {
        if (!isProgrammingPhase) {
            return 'Can only announce power down during programming phase';
        }

        if (damage === 0 && powerState === PowerState.ON) {
            return 'No damage to repair';
        }

        switch (powerState) {
            case PowerState.ON:
                return `Announce power down to repair ${damage} damage next turn`;
            case PowerState.ANNOUNCING:
                return 'Cancel power down announcement';
            case PowerState.OFF:
                return 'Choose to stay powered down for another turn';
        }
    };

    const PowerIcon = () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    );

    // Don't show button if no damage and not already in power down process
    if (damage === 0 && powerState === PowerState.ON) {
        //return null;
    }

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                disabled={disabled || !isProgrammingPhase}
                className={getButtonStyle()}
                title={getTooltip()}
            >
                <PowerIcon />
                <span>{getButtonText()}</span>
            </button>

            {powerState === PowerState.ANNOUNCING && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    Next Turn
                </div>
            )}

            {powerState === PowerState.OFF && (
                <div className="mt-2 text-sm text-gray-300 text-center">
                    All damage repaired • No cards this turn
                </div>
            )}
        </div>
    );
}