import React from 'react';
import { Checkpoint } from '@/lib/game/types';

interface CheckpointOverlayProps {
    checkpoints: Checkpoint[];
    boardWidth: number;
    boardHeight: number;
    tileSize: number;
    checkpointsCompleted: number;
    hideFlagsOnly?: boolean;
}

// CSS for the waving animation - only affects skew and scale, not position
const waveAnimationStyle = `
@keyframes wave {
    0% { transform: skewY(0deg) scaleX(1); }
    25% { transform: skewY(-2deg) scaleX(0.98) translateX(1px); }
    50% { transform: skewY(0deg) scaleX(1); }
    75% { transform: skewY(2deg) scaleX(0.98) translateX(-1px); }
    100% { transform: skewY(0deg) scaleX(1); }
}
`;

export default function CheckpointOverlay({
    checkpoints,
    boardWidth,
    boardHeight,
    tileSize,
    checkpointsCompleted,
    hideFlagsOnly = false
}: CheckpointOverlayProps) {
    return (
        <>
            {/* Inject the animation styles */}
            <style>{waveAnimationStyle}</style>
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
                        {/* Wrench icon - black version (always visible) */}
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

                        {/* Flag and pole (hidden when Control is pressed) */}
                        {!hideFlagsOnly && (
                            <>
                                {/* Flag pole */}
                                <div
                                    className="absolute bg-gray-700"
                                    style={{
                                        width: '4px',
                                        height: tileSize * 0.8,
                                        left: '50%',
                                        top: '50%',
                                        transform: `translate(-${tileSize * 0.15}px, -${tileSize * 0.4}px)`,
                                        borderRadius: '2px'
                                    }}
                                />

                                {/* Flag container for positioning */}
                                <div
                                    className="absolute"
                                    style={{
                                        width: tileSize * 0.55,
                                        height: tileSize * 0.4,
                                        left: '50%',
                                        top: '50%',
                                        transform: `translate(-${tileSize * 0.13}px, -${tileSize * 0.4}px)`,
                                    }}
                                >
                                    {/* Animated flag */}
                                    <div
                                        className={`absolute w-full h-full bg-${checkpointsCompleted >= checkpoint.number ? 'green' : 'red'}-600 flex items-center justify-center text-white font-bold shadow-lg`}
                                        style={{
                                            transformOrigin: 'left center',
                                            fontSize: tileSize * 0.25,
                                            clipPath: 'polygon(0 0, 100% 15%, 85% 50%, 100% 85%, 0 100%)',
                                            animation: `wave ${2 + (checkpoint.number * 0.3)}s ease-in-out infinite`,
                                            animationDelay: `${checkpoint.number * 0.5}s`
                                        }}
                                    >
                                        {checkpoint.number}
                                    </div>
                                </div>
                            </>
                        )}

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
        </>
    );
}