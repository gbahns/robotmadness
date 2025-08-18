import React from 'react';
import { Checkpoint } from '@/lib/game/types';

interface CheckpointOverlayProps {
    checkpoints: Checkpoint[];
    boardWidth: number;
    boardHeight: number;
    tileSize: number;
}

export default function CheckpointOverlay({
    checkpoints,
    boardWidth,
    boardHeight,
    tileSize
}: CheckpointOverlayProps) {
    return (
        <div
            className="absolute top-0 left-0 pointer-events-none z-20"
            style={{
                width: boardWidth * tileSize,
                height: boardHeight * tileSize
            }}
        >
            {checkpoints.map((checkpoint) => (
                <div
                    key={`checkpoint-${checkpoint.number}`}
                    className="absolute flex items-center justify-center"
                    style={{
                        left: checkpoint.position.x * tileSize,
                        top: checkpoint.position.y * tileSize,
                        width: tileSize,
                        height: tileSize
                    }}
                >
                    <div className="relative">
                        {/* Flag pole */}
                        <div
                            className="absolute bg-gray-600"
                            style={{
                                width: '3px',
                                height: tileSize * 0.7,
                                left: '50%',
                                top: '15%',
                                transform: 'translateX(-50%)'
                            }}
                        />

                        {/* Flag */}
                        <div
                            className="absolute bg-red-600 flex items-center justify-center text-white font-bold shadow-lg"
                            style={{
                                width: tileSize * 0.5,
                                height: tileSize * 0.35,
                                left: '50%',
                                top: '15%',
                                transform: 'translateX(-1px)',
                                fontSize: tileSize * 0.25,
                                clipPath: 'polygon(0 0, 100% 15%, 85% 50%, 100% 85%, 0 100%)'
                            }}
                        >
                            {checkpoint.number}
                        </div>

                        {/* Base circle (optional, for visibility) */}
                        <div
                            className="absolute bg-yellow-400 rounded-full opacity-50"
                            style={{
                                width: tileSize * 0.3,
                                height: tileSize * 0.3,
                                left: '50%',
                                bottom: '15%',
                                transform: 'translateX(-50%)'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}