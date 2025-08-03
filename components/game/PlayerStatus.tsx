import React from 'react';
import { Player } from '@/lib/game/types';

interface PlayerStatusProps {
    player: Player;
    isCurrentPlayer: boolean;
}

export default function PlayerStatus({ player, isCurrentPlayer }: PlayerStatusProps) {
    const hearts = Array.from({ length: 3 }, (_, i) => i < player.lives);

    return (
        <div className={`
      p-4 rounded-lg transition-all
      ${isCurrentPlayer
                ? 'bg-gray-800 border-2 border-green-500 shadow-lg shadow-green-500/20'
                : 'bg-gray-800 border border-gray-700'
            }
    `}>
            <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-lg">{player.name}</span>
                {isCurrentPlayer && <span className="text-xs text-green-400 font-bold">YOU</span>}
            </div>

            <div className="space-y-2 text-sm">
                {/* Lives */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-400">Lives:</span>
                    <div className="flex gap-1">
                        {hearts.map((filled, i) => (
                            <span key={i} className="text-lg">
                                {filled ? '❤️' : '🤍'}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Health Bar */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-400">Health:</span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-sm ${i < (10 - player.damage) ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Checkpoints */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-400">Checkpoints:</span>
                    <span className="font-mono">{player.checkpointsVisited}/4</span>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <div className="flex gap-2">
                        {player.isPoweredDown && <span title="Powered Down">💤</span>}
                        {player.submitted && <span className="text-green-400" title="Ready">✓</span>}
                        {player.damage >= 5 && <span className="text-red-400" title="Critical Damage">⚠️</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}