'use client';

import React from 'react';
import { GameState } from '@/lib/game/types';

interface WaitingStatusProps {
    gameState: GameState | null;
    currentPlayerId: string;
}

export default function WaitingStatus({ gameState, currentPlayerId }: WaitingStatusProps) {
    if (!gameState?.waitingOn || gameState.waitingOn.playerIds.length === 0) {
        return null;
    }

    // Don't show if we're one of the players being waited on
    const isWaitingPlayer = gameState.waitingOn.playerIds.includes(currentPlayerId);
    
    const { type, playerNames, completedPlayerNames = [] } = gameState.waitingOn;
    
    // For damage prevention, build list of all players and their status
    let allDamagePlayers: { name: string; completed: boolean }[] = [];
    if (type === 'damagePrevention') {
        // Build list from waiting and completed players
        const waitingPlayers = playerNames.map(name => ({ name, completed: false }));
        const completedPlayers = completedPlayerNames.map(name => ({ name, completed: true }));
        allDamagePlayers = [...completedPlayers, ...waitingPlayers];
    }
    
    let message = '';
    let icon = '⏳';
    
    switch (type) {
        case 'cards':
            message = `Waiting for ${playerNames.join(', ')} to submit cards`;
            icon = '🎯';
            break;
        case 'powerDown':
            message = `Waiting for ${playerNames.join(', ')} to decide on power down`;
            icon = '🔌';
            break;
        case 'respawn':
            message = `Waiting for ${playerNames.join(', ')} to choose respawn options`;
            icon = '🔄';
            break;
        case 'damagePrevention':
            message = `Waiting for ${playerNames.join(', ')} to prevent damage`;
            icon = '🛡️';
            break;
    }
    
    // If current player is being waited on, show a different message
    if (isWaitingPlayer) {
        switch (type) {
            case 'cards':
                message = 'Please submit your cards';
                break;
            case 'powerDown':
                message = 'Please decide on power down';
                break;
            case 'respawn':
                message = 'Please choose respawn options';
                break;
            case 'damagePrevention':
                message = 'Choose cards to prevent damage';
                break;
        }
    }
    
    return (
        <div className={`bg-gray-800 rounded-lg p-3 mb-4 border ${isWaitingPlayer ? 'border-yellow-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">{icon}</span>
                <p className={`text-sm ${isWaitingPlayer ? 'text-yellow-400 font-semibold' : 'text-gray-300'}`}>
                    {message}
                </p>
            </div>
            
            {/* Show detailed list for damage prevention */}
            {type === 'damagePrevention' && allDamagePlayers.length > 0 && !isWaitingPlayer && (
                <div className="mt-2 space-y-1">
                    {allDamagePlayers.map((player, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <span className={player.completed ? 'text-green-400' : 'text-gray-400'}>
                                {player.completed ? '✓' : '○'}
                            </span>
                            <span className={player.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                                {player.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Default count display for other types */}
            {!isWaitingPlayer && type !== 'damagePrevention' && playerNames.length > 1 && (
                <div className="mt-2 text-xs text-gray-500">
                    {playerNames.length} player{playerNames.length > 1 ? 's' : ''} need{playerNames.length > 1 ? '' : 's'} to decide
                </div>
            )}
        </div>
    );
}