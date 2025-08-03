import React from 'react';
import { Player } from '@/lib/game/types';

interface PlayerStatusProps {
    player: Player;
    isCurrentPlayer: boolean;
    compact?: boolean;
}

export default function PlayerStatus({ player, isCurrentPlayer, compact = false }: PlayerStatusProps) {
    const maxHealth = 10;
    const currentHealth = maxHealth - player.damage;
    const healthPercentage = (currentHealth / maxHealth) * 100;

    if (compact) {
        return (
            <div className={`
        bg-gray-800 rounded-lg p-2 
        ${isCurrentPlayer ? 'ring-2 ring-blue-500' : ''}
        ${player.lives === 0 ? 'opacity-50' : ''}
      `}>
                {/* Name and lives */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className={`font-semibold truncate text-sm ${isCurrentPlayer ? 'text-blue-400' : 'text-white'}`}>
                            {player.name}
                        </span>
                        <div className="flex">
                            {Array.from({ length: 3 }, (_, i) => (
                                <span key={i} className={`text-xs ${i < player.lives ? 'text-red-500' : 'text-gray-600'}`}>
                                    ♥
                                </span>
                            ))}
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">CP:{player.checkpointsVisited}</span>
                </div>

                {/* Health bar */}
                <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${healthPercentage > 60 ? 'bg-green-500' :
                                healthPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${healthPercentage}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-400">{currentHealth}/10</span>
                </div>

                {player.isPoweredDown && (
                    <span className="text-xs bg-yellow-600 px-1 rounded mt-1 inline-block">PWR↓</span>
                )}
            </div>
        );
    }

    // Original non-compact layout
    return (
        <div className={`
      bg-gray-800 rounded-lg p-4
      ${isCurrentPlayer ? 'ring-2 ring-blue-500' : ''}
      ${player.lives === 0 ? 'opacity-50' : ''}
    `}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className={`font-semibold ${isCurrentPlayer ? 'text-blue-400' : 'text-white'}`}>
                        {player.name}
                        {isCurrentPlayer && ' (You)'}
                    </h3>
                    {player.isPoweredDown && (
                        <span className="text-xs bg-yellow-600 px-2 py-1 rounded">Powered Down</span>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-400">Checkpoint</div>
                    <div className="text-2xl font-bold">{player.checkpointsVisited}</div>
                </div>
            </div>

            {/* Lives */}
            <div className="mb-3">
                <div className="flex gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                        <span
                            key={i}
                            className={`text-2xl ${i < player.lives ? 'text-red-500' : 'text-gray-600'}`}
                        >
                            ♥
                        </span>
                    ))}
                </div>
            </div>

            {/* Health Bar */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Health</span>
                    <span>{currentHealth}/{maxHealth}</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${healthPercentage > 60 ? 'bg-green-500' :
                            healthPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${healthPercentage}%` }}
                    />
                </div>
            </div>

            {/* Status */}
            {player.isVirtual && (
                <div className="mt-2 text-xs text-gray-500">AI Player</div>
            )}
            {player.isDisconnected && (
                <div className="mt-2 text-xs text-red-400">Disconnected</div>
            )}
        </div>
    );
}