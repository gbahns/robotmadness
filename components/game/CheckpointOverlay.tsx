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
            className="absolute top-0 left-0 pointer-events-none z-10"
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
                        {/* Main checkpoint circle */}
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-green-300 shadow-lg">
                            {checkpoint.number}
                        </div>

                        {/* Pulsing indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full animate-pulse" />

                        {/* Optional: Add a subtle glow effect */}
                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping" />
                    </div>
                </div>
            ))}
        </div>
    );
}