'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BoardDefinition, TileElement, LaserElement, WallElement, StartingPosition, TileType, Direction } from '@/lib/game/types';
import {
    validateBoardDefinition,
    createEmptyBoard,
    cloneBoardDefinition,
    rotateBoardClockwise,
    mirrorBoardHorizontally,
    getBoardStats,
    exportToTypeScript
} from '@/lib/game/board-editor-utils';
import { BOARD_TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById } from '@/lib/game/board-templates';
import LaserBeamRenderer from '@/components/game/LaserBeamRenderer';

// Complete tool palette for all board elements
type ToolType = 'tile' | 'laser' | 'wall' | 'start';

interface PaletteItem {
    tool: ToolType;
    type?: TileType;
    name: string;
    color: string;
    icon: string;
    needsDirection?: boolean;
}

const TOOL_PALETTE: PaletteItem[] = [
    // Tiles
    { tool: 'tile', type: TileType.EMPTY, name: 'Empty', color: 'bg-gray-500', icon: '□' },
    { tool: 'tile', type: TileType.PIT, name: 'Pit', color: 'bg-black', icon: '⚫' },
    { tool: 'tile', type: TileType.REPAIR, name: 'Repair', color: 'bg-green-600', icon: '🔧' },
    { tool: 'tile', type: TileType.OPTION, name: 'Option', color: 'bg-blue-600', icon: '?' },
    { tool: 'tile', type: TileType.CONVEYOR, name: 'Conveyor', color: 'bg-yellow-600', icon: '→', needsDirection: true },
    { tool: 'tile', type: TileType.EXPRESS_CONVEYOR, name: 'Express', color: 'bg-blue-400', icon: '⇒', needsDirection: true },
    { tool: 'tile', type: TileType.GEAR_CW, name: 'Gear CW', color: 'bg-purple-600', icon: '↻' },
    { tool: 'tile', type: TileType.GEAR_CCW, name: 'Gear CCW', color: 'bg-purple-400', icon: '↺' },
    { tool: 'tile', type: TileType.PUSHER, name: 'Pusher', color: 'bg-red-600', icon: '⤴', needsDirection: true },
    // Other tools
    { tool: 'wall', name: 'Wall', color: 'bg-yellow-400', icon: '🧱' },
    { tool: 'laser', name: 'Laser', color: 'bg-red-500', icon: '🔴', needsDirection: true },
    { tool: 'start', name: 'Start Position', color: 'bg-green-500', icon: '🚀', needsDirection: true },
];

const DIRECTION_OPTIONS = [
    { value: Direction.UP, name: 'Up', arrow: '↑' },
    { value: Direction.RIGHT, name: 'Right', arrow: '→' },
    { value: Direction.DOWN, name: 'Down', arrow: '↓' },
    { value: Direction.LEFT, name: 'Left', arrow: '←' },
];

export default function EnhancedBoardEditor() {
    const [boardDef, setBoardDef] = useState<BoardDefinition>(createEmptyBoard());
    const [selectedItem, setSelectedItem] = useState<PaletteItem>(TOOL_PALETTE[0]);
    const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UP);
    const [selectedLaserStrength, setSelectedLaserStrength] = useState<number>(1);
    const [showGrid, setShowGrid] = useState(true);
    const [showValidation, setShowValidation] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<BoardDefinition[]>([createEmptyBoard()]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [tileSize, setTileSize] = useState(32);

    // Add to history when board changes
    const addToHistory = useCallback((newBoard: BoardDefinition) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(cloneBoardDefinition(newBoard));
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setBoardDef(cloneBoardDefinition(history[historyIndex - 1]));
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setBoardDef(cloneBoardDefinition(history[historyIndex + 1]));
        }
    }, [history, historyIndex]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        redo();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

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

    const updateBoard = useCallback((updater: (prev: BoardDefinition) => BoardDefinition) => {
        setBoardDef(prev => {
            const newBoard = updater(prev);
            addToHistory(newBoard);
            return newBoard;
        });
    }, [addToHistory]);

    const placeTile = useCallback((x: number, y: number) => {
        updateBoard(prev => {
            const newTiles = prev.tiles?.filter(tile => !(tile.position.x === x && tile.position.y === y)) || [];

            if (selectedItem.tool === 'tile' && selectedItem.type && selectedItem.type !== TileType.EMPTY) {
                const newTile: TileElement = {
                    position: { x, y },
                    type: selectedItem.type,
                    ...(selectedItem.type === TileType.CONVEYOR || selectedItem.type === TileType.EXPRESS_CONVEYOR || selectedItem.type === TileType.PUSHER ? { direction: selectedDirection } : {}),
                    ...(selectedItem.type === TileType.GEAR_CW ? { rotate: 'clockwise' as const } : {}),
                    ...(selectedItem.type === TileType.GEAR_CCW ? { rotate: 'counterclockwise' as const } : {}),
                };
                newTiles.push(newTile);
            }

            return { ...prev, tiles: newTiles };
        });
    }, [selectedItem, selectedDirection, updateBoard]);

    const placeLaser = useCallback((x: number, y: number) => {
        console.log('Placing laser at', x, y, 'with direction', selectedDirection, 'and damage', selectedLaserStrength);
        updateBoard(prev => {
            const newLasers = prev.lasers?.filter(laser => !(laser.position.x === x && laser.position.y === y)) || [];

            const newLaser: LaserElement = {
                position: { x, y },
                direction: selectedDirection,
                damage: selectedLaserStrength
            };
            newLasers.push(newLaser);
            
            console.log('Board now has', newLasers.length, 'lasers');
            return { ...prev, lasers: newLasers };
        });
    }, [selectedDirection, selectedLaserStrength, updateBoard]);

    const toggleWall = useCallback((x: number, y: number, side: Direction) => {
        updateBoard(prev => {
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
    }, [updateBoard]);

    const placeStartingPosition = useCallback((x: number, y: number) => {
        updateBoard(prev => {
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
    }, [selectedDirection, updateBoard]);

    const handleTileClick = useCallback((x: number, y: number, event?: React.MouseEvent) => {
        switch (selectedItem.tool) {
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
    }, [selectedItem, placeTile, placeLaser, toggleWall, placeStartingPosition, tileSize]);

    const handleMouseDown = (x: number, y: number, event: React.MouseEvent) => {
        setIsDrawing(true);
        handleTileClick(x, y, event);
    };

    const handleMouseMove = (x: number, y: number, event: React.MouseEvent) => {
        if (isDrawing && selectedItem.tool === 'tile') {
            handleTileClick(x, y, event);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const clearBoard = () => {
        updateBoard(() => ({
            ...boardDef,
            tiles: [],
            lasers: [],
            walls: [],
            startingPositions: []
        }));
    };

    const loadTemplate = (templateId: string) => {
        const template = getTemplateById(templateId);
        if (template) {
            const newBoard = cloneBoardDefinition(template);
            setBoardDef(newBoard);
            addToHistory(newBoard);
        }
    };

    const rotateBoard = () => {
        updateBoard(rotateBoardClockwise);
    };

    const mirrorBoard = () => {
        updateBoard(mirrorBoardHorizontally);
    };

    const resizeBoard = (newWidth: number, newHeight: number) => {
        updateBoard(prev => ({
            ...prev,
            width: newWidth,
            height: newHeight,
            tiles: prev.tiles?.filter(tile => tile.position.x < newWidth && tile.position.y < newHeight) || [],
            lasers: prev.lasers?.filter(laser => laser.position.x < newWidth && laser.position.y < newHeight) || [],
            walls: prev.walls?.filter(wall => wall.position.x < newWidth && wall.position.y < newHeight) || [],
            startingPositions: prev.startingPositions.filter(pos => pos.position.x < newWidth && pos.position.y < newHeight)
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

    const exportTypeScript = () => {
        const tsCode = exportToTypeScript(boardDef);
        const dataBlob = new Blob([tsCode], { type: 'text/typescript' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${boardDef.id}.ts`;
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
                    addToHistory(imported);
                } catch (error) {
                    alert('Invalid board file format');
                }
            };
            reader.readAsText(file);
        }
    };

    const validation = validateBoardDefinition(boardDef);
    const stats = getBoardStats(boardDef);

    const renderTile = (x: number, y: number) => {
        const tile = getTileAt(x, y);
        const startPos = getStartingPositionAt(x, y);
        const laser = getLaserAt(x, y);
        const walls = getWallsAt(x, y);

        const tileClass = tile ? TOOL_PALETTE.find(p => p.tool === 'tile' && p.type === tile.type)?.color || 'bg-gray-300' : 'bg-gray-300';

        return (
            <div
                key={`${x}-${y}`}
                className={`relative border border-gray-400 cursor-pointer ${tileClass} hover:opacity-80`}
                style={{ width: tileSize, height: tileSize }}
                onMouseDown={(e) => handleMouseDown(x, y, e)}
                onMouseMove={(e) => handleMouseMove(x, y, e)}
                onMouseUp={handleMouseUp}
            >
                {/* Starting position number */}
                {startPos && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold bg-blue-500 bg-opacity-75 rounded text-xs">
                        {startPos.number}
                        <span className="ml-0.5">
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

                {/* Tile icon */}
                {tile && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                        {TOOL_PALETTE.find(p => p.tool === 'tile' && p.type === tile.type)?.icon}
                    </div>
                )}

                {/* Laser indicator */}
                {laser && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Laser emitter */}
                        <div className="absolute w-4 h-4 bg-red-600 rounded-full border border-red-800"></div>
                        {/* Direction indicator */}
                        <div className={`absolute ${
                            laser.direction === Direction.UP ? 'bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-gradient-to-t' :
                            laser.direction === Direction.DOWN ? 'top-1/2 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-gradient-to-b' :
                            laser.direction === Direction.LEFT ? 'right-1/2 top-1/2 -translate-y-1/2 h-1 w-1/2 bg-gradient-to-l' :
                            'left-1/2 top-1/2 -translate-y-1/2 h-1 w-1/2 bg-gradient-to-r'
                        } from-red-500 to-transparent`}></div>
                        {/* Damage indicator */}
                        <div className="absolute -top-1 -right-1 bg-red-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {laser.damage}
                        </div>
                    </div>
                )}

                {/* Wall indicators */}
                {walls.includes(Direction.UP) && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600"></div>}
                {walls.includes(Direction.DOWN) && <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-600"></div>}
                {walls.includes(Direction.LEFT) && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-600"></div>}
                {walls.includes(Direction.RIGHT) && <div className="absolute top-0 right-0 w-1 h-full bg-yellow-600"></div>}

                {/* Grid coordinates */}
                {showGrid && tileSize >= 24 && (
                    <div className="absolute top-0 left-0 text-xs text-gray-600 leading-none">
                        {x},{y}
                    </div>
                )}
            </div>
        );
    };

    // Helper function for LaserBeamRenderer to get walls at a position
    const getWallsAtForRenderer = (x: number, y: number): Direction[] => {
        return getWallsAt(x, y);
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">RoboRally Board Editor</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
                        >
                            Undo (Ctrl+Z)
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
                        >
                            Redo (Ctrl+Y)
                        </button>
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                            Templates
                        </button>
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className={`px-3 py-1 rounded text-sm ${validation.isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            Validate
                        </button>
                    </div>
                </div>

                {/* Templates Panel */}
                {showTemplates && (
                    <div className="bg-gray-800 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-3">Board Templates</h3>
                        {TEMPLATE_CATEGORIES.map(category => (
                            <div key={category.name} className="mb-4">
                                <h4 className="text-md font-medium mb-2">{category.name}</h4>
                                <p className="text-sm text-gray-400 mb-2">{category.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {category.templates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => loadTemplate(template.id)}
                                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-left"
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Validation Panel */}
                {showValidation && (
                    <div className="bg-gray-800 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-3">Board Validation</h3>
                        <div className="space-y-2">
                            <div className={`text-sm ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                                Status: {validation.isValid ? 'Valid' : 'Invalid'}
                            </div>
                            {validation.errors.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-400">Errors:</h4>
                                    <ul className="text-sm text-red-300 ml-4">
                                        {validation.errors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {validation.warnings.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-yellow-400">Warnings:</h4>
                                    <ul className="text-sm text-yellow-300 ml-4">
                                        {validation.warnings.map((warning, index) => (
                                            <li key={index}>• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Board Display */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Board: {boardDef.name}</h2>
                                <div className="flex gap-2 items-center">
                                    <label className="text-sm">Size:</label>
                                    <input
                                        type="range"
                                        min="16"
                                        max="64"
                                        value={tileSize}
                                        onChange={(e) => setTileSize(parseInt(e.target.value))}
                                        className="w-16"
                                    />
                                    <span className="text-xs">{tileSize}px</span>
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`px-2 py-1 rounded text-sm ${showGrid ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={rotateBoard}
                                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                                    >
                                        Rotate
                                    </button>
                                    <button
                                        onClick={mirrorBoard}
                                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                                    >
                                        Mirror
                                    </button>
                                    <button
                                        onClick={clearBoard}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-auto border border-gray-600 p-2" style={{ maxHeight: '70vh' }}>
                                <div className="inline-block relative" onMouseLeave={handleMouseUp}>
                                    {renderBoard()}
                                    {/* Render laser beams on top of the board */}
                                    {boardDef.lasers && boardDef.lasers.length > 0 && (
                                        <LaserBeamRenderer 
                                            lasers={boardDef.lasers.map(laser => ({
                                                position: laser.position,
                                                direction: laser.direction as Direction,
                                                damage: laser.damage || 1
                                            }))}
                                            boardWidth={boardDef.width}
                                            boardHeight={boardDef.height}
                                            tileSize={tileSize}
                                            getWallsAt={getWallsAtForRenderer}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Board Stats */}
                            <div className="mt-4 text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>Size: {stats.boardSize}</div>
                                <div>Tiles: {stats.totalTiles}</div>
                                <div>Start Pos: {stats.totalStartingPositions}</div>
                                <div>Lasers: {stats.totalLasers}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tool Panel */}
                    <div className="space-y-4">
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
                                            onChange={(e) => resizeBoard(parseInt(e.target.value) || 12, boardDef.height)}
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
                                            onChange={(e) => resizeBoard(boardDef.width, parseInt(e.target.value) || 12)}
                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tool Palette */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Tools & Tiles</h3>
                            <div className="space-y-1 mb-3">
                                {TOOL_PALETTE.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${selectedItem === item ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        <div className={`w-4 h-4 ${item.color} rounded flex items-center justify-center text-xs`}>
                                            {item.icon}
                                        </div>
                                        {item.name}
                                    </button>
                                ))}
                            </div>

                            {/* Direction Selection */}
                            {selectedItem.needsDirection && (
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

                            {/* Laser Damage Selection */}
                            {selectedItem.tool === 'laser' && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">Laser Damage</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(damage => (
                                            <button
                                                key={damage}
                                                onClick={() => setSelectedLaserStrength(damage)}
                                                className={`px-3 py-1 rounded text-sm ${selectedLaserStrength === damage ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                            >
                                                {damage}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Export/Import */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">File Operations</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={exportBoard}
                                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                                >
                                    Export JSON
                                </button>
                                <button
                                    onClick={exportTypeScript}
                                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                                >
                                    Export TypeScript
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