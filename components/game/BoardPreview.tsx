import React from 'react';
import { BoardDefinition } from '@/lib/game/boards/boardDefinitions';
import { Board } from '@/lib/game/types';

interface BoardPreviewProps {
    board: Board;
    size?: number; // Size of the preview in pixels
}

const DIRECTION_ARROWS = ['↑', '→', '↓', '←'];

export default function BoardPreview({ board, size = 300 }: BoardPreviewProps) {
    const tileSize = Math.floor(size / Math.max(board.width, board.height));
    const boardWidth = board.width * tileSize;
    const boardHeight = board.height * tileSize;

    // Create a map of special tiles for quick lookup
    const tileMap = new Map<string, any>();
    board.tiles?.flat().forEach(tile => {
        const key = `${tile.position.x},${tile.position.y}`;
        tileMap.set(key, tile);
    });

    // Create a map of checkpoints
    const checkpointMap = new Map<string, number>();
    board.checkpoints.forEach(cp => {
        const key = `${cp.position.x},${cp.position.y}`;
        checkpointMap.set(key, cp.number);
    });

    // Create a map of starting positions
    const startingPosMap = new Map<string, any>();
    board.startingPositions.forEach((sp, index) => {
        const key = `${sp.position.x},${sp.position.y}`;
        startingPosMap.set(key, { ...sp, index });
    });

    // Create a map of lasers
    const laserMap = new Map<string, any>();
    board.lasers?.forEach(laser => {
        const key = `${laser.position.x},${laser.position.y}`;
        laserMap.set(key, laser);
    });

    return (
        <div className="bg-gray-900 p-2 rounded">
            <div
                className="relative mx-auto"
                style={{
                    width: boardWidth,
                    height: boardHeight
                }}
            >
                {/* Render tiles */}
                {Array.from({ length: board.height }, (_, y) =>
                    Array.from({ length: board.width }, (_, x) => {
                        const key = `${x},${y}`;
                        const tile = tileMap.get(key);
                        const checkpoint = checkpointMap.get(key);
                        const startingPos = startingPosMap.get(key);
                        const laser = laserMap.get(key);

                        return (
                            <div
                                key={key}
                                className="absolute border border-gray-700"
                                style={{
                                    left: x * tileSize,
                                    top: y * tileSize,
                                    width: tileSize,
                                    height: tileSize,
                                    backgroundColor: tile?.type === 'pit' ? '#000' : '#374151'
                                }}
                            >
                                {/* Tile content */}
                                {tile && (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs">
                                        {tile.type === 'conveyor' && (
                                            <span className="text-yellow-600" style={{ fontSize: tileSize * 0.5 }}>
                                                {DIRECTION_ARROWS[tile.direction || 0]}
                                            </span>
                                        )}
                                        {tile.type === 'express' && (
                                            <span className="text-yellow-400 font-bold" style={{ fontSize: tileSize * 0.5 }}>
                                                {DIRECTION_ARROWS[tile.direction || 0]}
                                            </span>
                                        )}
                                        {tile.type === 'gear_cw' && (
                                            <span className="text-gray-400" style={{ fontSize: tileSize * 0.6 }}>↻</span>
                                        )}
                                        {tile.type === 'gear_ccw' && (
                                            <span className="text-gray-400" style={{ fontSize: tileSize * 0.6 }}>↺</span>
                                        )}
                                        {tile.type === 'repair' && (
                                            <span className="text-green-500" style={{ fontSize: tileSize * 0.4 }}>🔧</span>
                                        )}
                                        {tile.type === 'pit' && (
                                            <span className="text-gray-600" style={{ fontSize: tileSize * 0.6 }}>⚫</span>
                                        )}
                                    </div>
                                )}

                                {/* Checkpoint */}
                                {checkpoint && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center z-10"
                                        style={{ padding: tileSize * 0.2 }}
                                    >
                                        <div
                                            className="bg-white rounded-full flex items-center justify-center text-black font-bold"
                                            style={{
                                                width: tileSize * 0.6,
                                                height: tileSize * 0.6,
                                                fontSize: tileSize * 0.3
                                            }}
                                        >
                                            {checkpoint}
                                        </div>
                                    </div>
                                )}

                                {/* Starting position */}
                                {startingPos && !checkpoint && (
                                    <div className="absolute inset-0 bg-green-600 opacity-50" />
                                )}

                                {/* Laser indicator */}
                                {laser && (
                                    <div
                                        className="absolute bg-red-600"
                                        style={{
                                            width: tileSize * 0.2,
                                            height: tileSize * 0.2,
                                            top: '2px',
                                            right: '2px'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-2">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-green-600 opacity-50"></span> Start
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-white rounded-full"></span> Checkpoint
                </span>
                {board.tiles?.flat().some(t => t.type === 'pit') && (
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-black"></span> Pit
                    </span>
                )}
                {board.tiles?.flat().some(t => t.type === 'repair') && (
                    <span className="flex items-center gap-1">
                        <span className="text-green-500">🔧</span> Repair
                    </span>
                )}
                {board.lasers && board.lasers.length > 0 && (
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-red-600"></span> Laser
                    </span>
                )}
            </div>
        </div>
    );
}