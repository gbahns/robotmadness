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
        if (!isProgrammingPhase || powerState === PowerState.OFF) return;
        socketClient.emit('toggle-power-down', { roomCode, playerId, selectedCards });
    };

    const getButtonText = () => {
        switch (powerState) {
            case PowerState.ON:
                return 'Power Down';
            case PowerState.ANNOUNCING:
                return 'Cancel PD';
            case PowerState.OFF:
                return 'Stay Down';
        }
    };

    const getButtonStyle = () => {
        const baseClasses = "flex-1 px-4 py-2 rounded font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap";

        if (disabled || !isProgrammingPhase || powerState === PowerState.OFF) {
            return `${baseClasses} bg-gray-400 cursor-not-allowed opacity-50`;
        }

        switch (powerState) {
            case PowerState.ON:
                return `${baseClasses} bg-yellow-600 hover:bg-yellow-700`;
            case PowerState.ANNOUNCING:
                return `${baseClasses} bg-orange-600 hover:bg-orange-700 animate-pulse`;
            //case PowerState.OFF:
            //   return `${baseClasses} bg-green-600 hover:bg-green-700`;
        }
    };

    const getTooltip = () => {
        if (!isProgrammingPhase) {
            return 'Can only announce power down during programming phase';
        }

        switch (powerState) {
            case PowerState.ON:
                if (damage === 0) {
                    return 'Announce power down for strategic positioning or anticipating damage';
                }
                return `Announce power down to repair ${damage} damage next turn`;
            case PowerState.ANNOUNCING:
                return 'Cancel power down announcement';
            case PowerState.OFF:
                return 'Choose to stay powered down for another turn';
        }
    };

    const PowerIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    );

    // Power down is now always available for strategic reasons

    return (
        <button
            onClick={handleToggle}
            disabled={disabled || !isProgrammingPhase || powerState === PowerState.OFF}
            className={getButtonStyle()}
            title={getTooltip()}
        >
            <PowerIcon />
            <span>{getButtonText()}</span>
        </button>
    );
}