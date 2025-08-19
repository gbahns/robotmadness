import React from 'react';
import { Checkpoint } from '@/lib/game/types';

interface CheckpointOverlayProps {
    checkpoints: Checkpoint[];
    boardWidth: number;
    boardHeight: number;
    tileSize: number;
    checkpointsCompleted: number;
}

export default function CheckpointOverlay({
    checkpoints,
    boardWidth,
    boardHeight,
    tileSize,
    checkpointsCompleted
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
                        {/* Wrench icon - black version */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={{
                                transform: 'translate(-30%, -30%)',
                                width: tileSize * 0.45,
                                height: tileSize * 0.45
                            }}
                        >
                            <div
                                className="bg-yellow-600 rounded-full p-1 flex items-center justify-center"
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                <div className="bg-yellow-500 rounded-full w-full h-full flex items-center justify-center">
                                    <span style={{
                                        fontSize: tileSize * 0.3,
                                        filter: 'grayscale(100%) brightness(0%)'  // Makes the emoji black
                                    }}>🔧</span>
                                </div>
                            </div>
                        </div>

                        {/* Flag pole */}
                        <div
                            className="absolute bg-gray-600"
                            style={{
                                width: '3px',
                                height: tileSize * 0.6,
                                left: '50%',
                                top: '50%',
                                //transform: 'translate(-60%, -50%)'  // Center both X and Y
                                transform: `translate(-${tileSize * 0.2}px, -${tileSize * 0.3}px)`,
                            }}
                        />

                        {/* Flag */}
                        <div
                            className={`absolute bg-${checkpointsCompleted >= checkpoint.number ? 'green' : 'red'}-600 flex items-center justify-center text-white font-bold shadow-lg`}
                            style={{
                                width: tileSize * 0.4,
                                height: tileSize * 0.3,
                                left: '50%',
                                top: '50%',
                                //transform: `translate(0, -${tileSize * 0.25}px)`,  // Center X, move up Y
                                transform: `translate(-${tileSize * 0.2}px, -${tileSize * 0.3}px)`,
                                fontSize: tileSize * 0.2,
                                clipPath: 'polygon(0 0, 100% 15%, 85% 50%, 100% 85%, 0 100%)'
                            }}
                        >
                            {checkpoint.number}
                        </div>

                        {/* Base circle (optional, for visibility) */}
                        {/* <div
                            className="absolute bg-yellow-400 rounded-full opacity-50"
                            style={{
                                width: tileSize * 0.3,
                                height: tileSize * 0.3,
                                left: '50%',
                                bottom: '15%',
                                transform: 'translateX(-50%)'
                            }}
                        /> */}
                    </div>
                </div>
            ))}
        </div>
    );
}