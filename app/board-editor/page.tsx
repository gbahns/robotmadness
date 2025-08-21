'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BoardDefinition, TileElement, LaserElement, WallElement, StartingPosition, TileType, Direction } from '@/lib/game/types';

// Tile palette for placing elements
const TILE_PALETTE = [
    { type: TileType.EMPTY, name: 'Empty', color: 'bg-gray-500' },
    { type: TileType.PIT, name: 'Pit', color: 'bg-black' },
    { type: TileType.REPAIR, name: 'Repair', color: 'bg-green-600' },
    { type: TileType.OPTION, name: 'Option', color: 'bg-blue-600' },
    { type: TileType.CONVEYOR, name: 'Conveyor', color: 'bg-yellow-600' },
    { type: TileType.EXPRESS_CONVEYOR, name: 'Express', color: 'bg-blue-400' },
    { type: TileType.GEAR_CW, name: 'Gear CW', color: 'bg-purple-600' },
    { type: TileType.GEAR_CCW, name: 'Gear CCW', color: 'bg-purple-400' },
    { type: TileType.PUSHER, name: 'Pusher', color: 'bg-red-600' },
];

const DIRECTION_OPTIONS = [
    { value: Direction.UP, name: 'Up', arrow: '↑' },
    { value: Direction.RIGHT, name: 'Right', arrow: '→' },
    { value: Direction.DOWN, name: 'Down', arrow: '↓' },
    { value: Direction.LEFT, name: 'Left', arrow: '←' },
];

export default function BoardEditor() {
    const [boardDef, setBoardDef] = useState<BoardDefinition>({
        id: 'custom-board',
        name: 'Custom Board',
        width: 12,
        height: 12,
        tiles: [],
        lasers: [],
        walls: [],
        startingPositions: []
    });

    const [selectedTool, setSelectedTool] = useState<'tile' | 'laser' | 'wall' | 'start'>('tile');
    const [selectedTileType, setSelectedTileType] = useState<TileType>(TileType.EMPTY);
    const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UP);
    const [showGrid, setShowGrid] = useState(true);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

    const getTileAt = (x: number, y: number): TileElement | undefined => {
        return boardDef.tiles?.find(tile => tile.position.x === x && tile.position.y === y);
    };

    const getStartingPositionAt = (x: number, y: number): StartingPosition | undefined => {
        return boardDef.startingPositions.find(pos => pos.position.x === x && pos.position.y === y);
    };

    const getLaserAt = (x: number, y: number): LaserElement | undefined => {
        return boardDef.lasers?.find(laser => laser.position.x === x && laser.position.y === y);
    };

    const getWallsAt = (x: number, y: number): Direction[] => {
        const wallElement = boardDef.walls?.find(wall => wall.position.x === x && wall.position.y === y);
        return wallElement?.sides || [];
    };

    const placeTile = useCallback((x: number, y: number) => {
        setBoardDef(prev => {
            const newTiles = prev.tiles?.filter(tile => !(tile.position.x === x && tile.position.y === y)) || [];

            if (selectedTileType !== TileType.EMPTY) {
                const newTile: TileElement = {
                    position: { x, y },
                    type: selectedTileType,
                    ...(selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR || selectedTileType === TileType.PUSHER ? { direction: selectedDirection } : {}),
                    ...(selectedTileType === TileType.GEAR_CW ? { rotate: 'clockwise' as const } : {}),
                    ...(selectedTileType === TileType.GEAR_CCW ? { rotate: 'counterclockwise' as const } : {}),
                };
                newTiles.push(newTile);
            }

            return { ...prev, tiles: newTiles };
        });
    }, [selectedTileType, selectedDirection]);

    const placeLaser = useCallback((x: number, y: number) => {
        setBoardDef(prev => {
            const newLasers = prev.lasers?.filter(laser => !(laser.position.x === x && laser.position.y === y)) || [];

            const newLaser: LaserElement = {
                position: { x, y },
                direction: selectedDirection,
                damage: 1
            };
            newLasers.push(newLaser);

            return { ...prev, lasers: newLasers };
        });
    }, [selectedDirection]);

    const toggleWall = useCallback((x: number, y: number, side: Direction) => {
        setBoardDef(prev => {
            const newWalls = [...(prev.walls || [])];
            const existingWallIndex = newWalls.findIndex(wall => wall.position.x === x && wall.position.y === y);

            if (existingWallIndex >= 0) {
                const existingWall = newWalls[existingWallIndex];
                const sideIndex = existingWall.sides.indexOf(side);

                if (sideIndex >= 0) {
                    existingWall.sides.splice(sideIndex, 1);
                    if (existingWall.sides.length === 0) {
                        newWalls.splice(existingWallIndex, 1);
                    }
                } else {
                    existingWall.sides.push(side);
                }
            } else {
                newWalls.push({
                    position: { x, y },
                    sides: [side]
                });
            }

            return { ...prev, walls: newWalls };
        });
    }, []);

    const placeStartingPosition = useCallback((x: number, y: number) => {
        setBoardDef(prev => {
            const newStartingPositions = prev.startingPositions.filter(pos => !(pos.position.x === x && pos.position.y === y));

            const nextNumber = Math.max(0, ...prev.startingPositions.map(p => p.number)) + 1;

            const newStartingPosition: StartingPosition = {
                number: nextNumber,
                position: { x, y },
                direction: selectedDirection
            };
            newStartingPositions.push(newStartingPosition);

            return { ...prev, startingPositions: newStartingPositions };
        });
    }, [selectedDirection]);

    const handleTileClick = useCallback((x: number, y: number, event?: React.MouseEvent) => {
        switch (selectedTool) {
            case 'tile':
                placeTile(x, y);
                break;
            case 'laser':
                placeLaser(x, y);
                break;
            case 'wall':
                if (event) {
                    const rect = (event.target as HTMLElement).getBoundingClientRect();
                    const relativeX = event.clientX - rect.left;
                    const relativeY = event.clientY - rect.top;
                    const tileSize = 40;

                    let side: Direction;
                    if (relativeY < tileSize * 0.25) side = Direction.UP;
                    else if (relativeY > tileSize * 0.75) side = Direction.DOWN;
                    else if (relativeX < tileSize * 0.5) side = Direction.LEFT;
                    else side = Direction.RIGHT;

                    toggleWall(x, y, side);
                }
                break;
            case 'start':
                placeStartingPosition(x, y);
                break;
        }
    }, [selectedTool, placeTile, placeLaser, toggleWall, placeStartingPosition]);

    const handleMouseDown = (x: number, y: number, event: React.MouseEvent) => {
        setIsDrawing(true);
        setDragStart({ x, y });
        handleTileClick(x, y, event);
    };

    const handleMouseMove = (x: number, y: number, event: React.MouseEvent) => {
        if (isDrawing && selectedTool === 'tile') {
            handleTileClick(x, y, event);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setDragStart(null);
    };

    const clearBoard = () => {
        setBoardDef(prev => ({
            ...prev,
            tiles: [],
            lasers: [],
            walls: [],
            startingPositions: []
        }));
    };

    const exportBoard = () => {
        const dataStr = JSON.stringify(boardDef, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${boardDef.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importBoard = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result as string);
                    setBoardDef(imported);
                } catch (error) {
                    alert('Invalid board file format');
                }
            };
            reader.readAsText(file);
        }
    };

    const renderTile = (x: number, y: number) => {
        const tile = getTileAt(x, y);
        const startPos = getStartingPositionAt(x, y);
        const laser = getLaserAt(x, y);
        const walls = getWallsAt(x, y);

        const tileClass = tile ? TILE_PALETTE.find(p => p.type === tile.type)?.color || 'bg-gray-300' : 'bg-gray-300';

        return (
            <div
                key={`${x}-${y}`}
                className={`relative w-10 h-10 border border-gray-400 cursor-pointer ${tileClass} hover:opacity-80`}
                onMouseDown={(e) => handleMouseDown(x, y, e)}
                onMouseMove={(e) => handleMouseMove(x, y, e)}
                onMouseUp={handleMouseUp}
            >
                {/* Starting position number */}
                {startPos && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs bg-blue-500 bg-opacity-75 rounded">
                        {startPos.number}
                        <span className="text-xs ml-0.5">
                            {DIRECTION_OPTIONS.find(d => d.value === startPos.direction)?.arrow}
                        </span>
                    </div>
                )}

                {/* Tile direction indicator */}
                {tile && (tile.type === TileType.CONVEYOR || tile.type === TileType.EXPRESS_CONVEYOR || tile.type === TileType.PUSHER) && tile.direction !== undefined && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                        {DIRECTION_OPTIONS.find(d => d.value === tile.direction)?.arrow}
                    </div>
                )}

                {/* Gear rotation indicator */}
                {tile && (tile.type === TileType.GEAR_CW || tile.type === TileType.GEAR_CCW) && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                        {tile.type === TileType.GEAR_CW ? '↻' : '↺'}
                    </div>
                )}

                {/* Laser indicator */}
                {laser && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                )}

                {/* Wall indicators */}
                {walls.includes(Direction.UP) && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600"></div>}
                {walls.includes(Direction.DOWN) && <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-600"></div>}
                {walls.includes(Direction.LEFT) && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-600"></div>}
                {walls.includes(Direction.RIGHT) && <div className="absolute top-0 right-0 w-1 h-full bg-yellow-600"></div>}

                {/* Grid coordinates */}
                {showGrid && (
                    <div className="absolute top-0 left-0 text-xs text-gray-600 leading-none">
                        {x},{y}
                    </div>
                )}
            </div>
        );
    };

    const renderBoard = () => {
        const rows = [];
        for (let y = 0; y < boardDef.height; y++) {
            const cols = [];
            for (let x = 0; x < boardDef.width; x++) {
                cols.push(renderTile(x, y));
            }
            rows.push(
                <div key={y} className="flex">
                    {cols}
                </div>
            );
        }
        return rows;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">RoboRally Board Editor</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Board Display */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Board: {boardDef.name}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`px-3 py-1 rounded text-sm ${showGrid ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={clearBoard}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-auto max-h-96 border border-gray-600 p-2">
                                <div className="inline-block" onMouseLeave={handleMouseUp}>
                                    {renderBoard()}
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-400">
                                <p>Size: {boardDef.width} × {boardDef.height}</p>
                                <p>Tiles: {boardDef.tiles?.length || 0}</p>
                                <p>Starting Positions: {boardDef.startingPositions.length}</p>
                                <p>Lasers: {boardDef.lasers?.length || 0}</p>
                                <p>Walls: {boardDef.walls?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tool Panel */}
                    <div className="space-y-6">
                        {/* Board Settings */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Board Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={boardDef.name}
                                        onChange={(e) => setBoardDef(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">ID</label>
                                    <input
                                        type="text"
                                        value={boardDef.id}
                                        onChange={(e) => setBoardDef(prev => ({ ...prev, id: e.target.value }))}
                                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Width</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={boardDef.width}
                                            onChange={(e) => setBoardDef(prev => ({ ...prev, width: parseInt(e.target.value) || 12 }))}
                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Height</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={boardDef.height}
                                            onChange={(e) => setBoardDef(prev => ({ ...prev, height: parseInt(e.target.value) || 12 }))}
                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tool Selection */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Tools</h3>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { tool: 'tile' as const, name: 'Tiles' },
                                    { tool: 'laser' as const, name: 'Lasers' },
                                    { tool: 'wall' as const, name: 'Walls' },
                                    { tool: 'start' as const, name: 'Start Pos' },
                                ].map(({ tool, name }) => (
                                    <button
                                        key={tool}
                                        onClick={() => setSelectedTool(tool)}
                                        className={`px-3 py-2 rounded text-sm ${selectedTool === tool ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>

                            {/* Direction Selection */}
                            {(selectedTool === 'laser' || selectedTool === 'start' ||
                                (selectedTool === 'tile' && (selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR || selectedTileType === TileType.PUSHER))) && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium mb-2">Direction</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {DIRECTION_OPTIONS.map(({ value, name, arrow }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedDirection(value)}
                                                    className={`px-2 py-1 rounded text-sm ${selectedDirection === value ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                                >
                                                    {arrow} {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Tile Palette */}
                        {selectedTool === 'tile' && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">Tile Types</h3>
                                <div className="space-y-1">
                                    {TILE_PALETTE.map(({ type, name, color }) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedTileType(type)}
                                            className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${selectedTileType === type ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                        >
                                            <div className={`w-4 h-4 ${color} rounded`}></div>
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Export/Import */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">File Operations</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={exportBoard}
                                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                                >
                                    Export Board
                                </button>
                                <label className="block">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={importBoard}
                                        className="hidden"
                                    />
                                    <div className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-center cursor-pointer">
                                        Import Board
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}