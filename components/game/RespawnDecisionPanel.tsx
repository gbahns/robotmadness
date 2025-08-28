import React, { useState } from 'react';
import { socketClient } from '@/lib/socket';
import { Direction, Position } from '@/lib/game/types';

interface RespawnDecisionPanelProps {
    roomCode: string;
    playerId: string;
    playerName: string;
    isRespawn?: boolean;
    alternatePositions?: Position[];
    selectedPosition?: Position;
    onComplete: () => void;
}

const DirectionIcon = ({ direction }: { direction: Direction }) => {
    const rotations = {
        [Direction.UP]: 'rotate-0',
        [Direction.RIGHT]: 'rotate-90',
        [Direction.DOWN]: 'rotate-180',
        [Direction.LEFT]: '-rotate-90'
    };

    return (
        <svg className={`w-5 h-5 ${rotations[direction]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
    );
};

export default function RespawnDecisionPanel({
    roomCode,
    playerId,
    playerName,
    isRespawn = false,
    alternatePositions,
    selectedPosition,
    onComplete
}: RespawnDecisionPanelProps) {
    const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UP);
    
    // Emit respawn preview when direction or position changes
    React.useEffect(() => {
        if (isRespawn) {
            socketClient.emit('respawn-preview', {
                roomCode,
                playerId,
                direction: selectedDirection,
                position: selectedPosition
            });
        }
    }, [selectedDirection, selectedPosition, isRespawn, roomCode, playerId]);

    const handleDecision = (powerDown: boolean) => {
        console.log(`${playerName} chooses to ${powerDown ? 'enter powered down' : 'stay powered on'} ${isRespawn ? `facing ${Direction[selectedDirection]}` : ''}`);
        
        if (isRespawn) {
            // For respawn decisions, send direction choice and optional position
            socketClient.emit('respawn-decision', { 
                roomCode, 
                playerId, 
                powerDown,
                direction: selectedDirection,
                position: selectedPosition
            });
        } else {
            // For regular power down decisions
            socketClient.emit('continue-power-down', { 
                roomCode, 
                playerId, 
                continueDown: powerDown 
            });
        }
        onComplete();
    };

    const directionNames = {
        [Direction.UP]: 'North',
        [Direction.RIGHT]: 'East',
        [Direction.DOWN]: 'South',
        [Direction.LEFT]: 'West'
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold text-white">
                    {isRespawn ? 'Respawn Decision' : 'Power Down Status'}
                </h3>
            </div>

            {isRespawn ? (
                <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                        {alternatePositions && alternatePositions.length > 0 
                            ? `Your archive position is occupied. ${selectedPosition 
                                ? `Selected tile: (${selectedPosition.x}, ${selectedPosition.y}). Choose facing:` 
                                : "Click a highlighted tile on the board to select respawn position."}`
                            : "You will respawn with 2 damage. Choose your facing direction:"}
                    </p>

                    {/* Direction Selection - Compact Grid */}
                    <div className="grid grid-cols-4 gap-1">
                        {[Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT].map((dir) => (
                            <button
                                key={dir}
                                onClick={() => setSelectedDirection(dir)}
                                className={`p-2 rounded flex flex-col items-center justify-center gap-1 transition-all text-xs ${
                                    selectedDirection === dir
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                            >
                                <DirectionIcon direction={dir} />
                                <span>{directionNames[dir]}</span>
                            </button>
                        ))}
                    </div>

                    {/* Power Decision Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleDecision(true)}
                            disabled={alternatePositions && alternatePositions.length > 0 && !selectedPosition}
                            className={`px-3 py-2 font-semibold rounded transition-all text-sm flex items-center justify-center gap-1
                                ${alternatePositions && alternatePositions.length > 0 && !selectedPosition
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Powered Down
                        </button>

                        <button
                            onClick={() => handleDecision(false)}
                            disabled={alternatePositions && alternatePositions.length > 0 && !selectedPosition}
                            className={`px-3 py-2 font-semibold rounded transition-all text-sm flex items-center justify-center gap-1
                                ${alternatePositions && alternatePositions.length > 0 && !selectedPosition
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Powered On
                        </button>
                    </div>

                    <div className="text-xs text-gray-400 text-center">
                        <p>Powered down: Skip turn, repair damage</p>
                        <p>Powered on: Full control, keep damage</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                        You are powered down. Stay powered down for another turn?
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleDecision(true)}
                            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded 
                                     transition-all text-sm"
                        >
                            Stay Down
                        </button>

                        <button
                            onClick={() => handleDecision(false)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded 
                                     transition-all text-sm"
                        >
                            Power On
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}