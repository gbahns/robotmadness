'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BoardDefinition, TileElement, LaserElement, WallElement, StartingPosition, TileType, Direction, Course } from '@/lib/game/types';
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
import { buildCourse, ALL_COURSES, getCourseById } from '@/lib/game/boards/courses';
import { ALL_BOARD_DEFINITIONS, getBoardDefinitionById } from '@/lib/game/boards/factoryFloorBoards';

// Tile palette for placing elements
const TILE_PALETTE = [
    { type: TileType.EMPTY, name: 'Empty', icon: '□' },
    { type: TileType.PIT, name: 'Pit', icon: '⚫' },
    { type: TileType.REPAIR, name: 'Repair', icon: '🔧' },
    { type: TileType.OPTION, name: 'Option', icon: '?' },
    { type: TileType.CONVEYOR, name: 'Conveyor', icon: '→' },
    { type: TileType.EXPRESS_CONVEYOR, name: 'Express', icon: '⇒' },
    { type: TileType.GEAR_CW, name: 'Gear', icon: '⚙️' }, // Use GEAR_CW as the base gear type
    { type: TileType.PUSHER, name: 'Pusher', icon: '⤴' },
];

const DIRECTION_OPTIONS = [
    { value: Direction.UP, name: 'Up', arrow: '↑' },
    { value: Direction.RIGHT, name: 'Right', arrow: '→' },
    { value: Direction.DOWN, name: 'Down', arrow: '↓' },
    { value: Direction.LEFT, name: 'Left', arrow: '←' },
];

const ROTATION_OPTIONS = [
    { value: 'none' as const, name: 'Straight', icon: '→' },
    { value: 'clockwise' as const, name: 'Clockwise', icon: '↻' },
    { value: 'counterclockwise' as const, name: 'Counter-CW', icon: '↺' },
];

export default function BoardEditorWithGameRendering() {
    const [boardDef, setBoardDef] = useState<BoardDefinition>(createEmptyBoard());
    const [selectedTool, setSelectedTool] = useState<'tile' | 'laser' | 'wall' | 'start'>('tile');
    const [selectedTileType, setSelectedTileType] = useState<TileType>(TileType.EMPTY);
    const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UP);
    const [selectedRotation, setSelectedRotation] = useState<'none' | 'clockwise' | 'counterclockwise'>('none');
    const [showGrid, setShowGrid] = useState(true);
    const [showValidation, setShowValidation] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showGameBoards, setShowGameBoards] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<BoardDefinition[]>([createEmptyBoard()]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [tileSize, setTileSize] = useState(50);
    const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number; side?: Direction } | null>(null);

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

    // Helper functions to get elements at position
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

    // Board modification functions
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

            if (selectedTileType !== TileType.EMPTY) {
                const newTile: TileElement = {
                    position: { x, y },
                    type: selectedTileType,
                };

                // Add direction for tiles that need it
                if (selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR || selectedTileType === TileType.PUSHER) {
                    newTile.direction = selectedDirection;
                }

                // Add rotation for conveyors if selected
                if ((selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR) && selectedRotation !== 'none') {
                    newTile.rotate = selectedRotation as 'clockwise' | 'counterclockwise';
                }

                // Handle gears - they always need rotation, use selectedRotation or default to clockwise
                if (selectedTileType === TileType.GEAR_CW) {
                    newTile.rotate = selectedRotation === 'counterclockwise' ? 'counterclockwise' : 'clockwise';
                    // For gears, we need to set the correct type based on rotation
                    if (selectedRotation === 'counterclockwise') {
                        newTile.type = TileType.GEAR_CCW;
                    }
                }

                newTiles.push(newTile);
            }

            return { ...prev, tiles: newTiles };
        });
    }, [selectedTileType, selectedDirection, selectedRotation, updateBoard]);

    const placeLaser = useCallback((x: number, y: number) => {
        updateBoard(prev => {
            const newLasers = prev.lasers?.filter(laser => !(laser.position.x === x && laser.position.y === y)) || [];

            const newLaser: LaserElement = {
                position: { x, y },
                direction: selectedDirection,
                damage: 1
            };
            newLasers.push(newLaser);

            return { ...prev, lasers: newLasers };
        });
    }, [selectedDirection, updateBoard]);

    const toggleWall = useCallback((x: number, y: number, side: Direction) => {
        updateBoard(prev => {
            // Create a completely new walls array
            const existingWalls = prev.walls || [];
            
            // Find the index of the wall element at this position
            const wallIndex = existingWalls.findIndex(wall => wall.position.x === x && wall.position.y === y);
            
            let newWalls: WallElement[];
            
            if (wallIndex !== -1) {
                // There's already a wall element at this position
                const existingWall = existingWalls[wallIndex];
                const hasSide = existingWall.sides.includes(side);
                
                if (hasSide) {
                    // Remove this side
                    const newSides = existingWall.sides.filter(s => s !== side);
                    
                    if (newSides.length === 0) {
                        // If no sides left, remove the entire wall element
                        newWalls = existingWalls.filter((_, index) => index !== wallIndex);
                    } else {
                        // Update the wall with the new sides array
                        newWalls = existingWalls.map((wall, index) => 
                            index === wallIndex 
                                ? { ...wall, sides: newSides }
                                : wall
                        );
                    }
                } else {
                    // Add this side to the existing wall
                    newWalls = existingWalls.map((wall, index) => 
                        index === wallIndex 
                            ? { ...wall, sides: [...wall.sides, side] }
                            : wall
                    );
                }
            } else {
                // No wall element at this position yet, create a new one
                newWalls = [...existingWalls, {
                    position: { x, y },
                    sides: [side]
                }];
            }

            console.log(`Wall toggle at (${x},${y}) side ${Direction[side]}:`);
            console.log('Current walls:', newWalls.filter(w => w.position.x === x && w.position.y === y));

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

                    let side: Direction;
                    // More precise edge detection
                    const edgeThreshold = tileSize * 0.3; // 30% from edges

                    if (relativeY < edgeThreshold) {
                        side = Direction.UP;
                    } else if (relativeY > tileSize - edgeThreshold) {
                        side = Direction.DOWN;
                    } else if (relativeX < edgeThreshold) {
                        side = Direction.LEFT;
                    } else if (relativeX > tileSize - edgeThreshold) {
                        side = Direction.RIGHT;
                    } else {
                        // Default to top if clicking in center
                        side = Direction.UP;
                    }

                    console.log(`Wall click at (${x},${y}) - relative pos: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}) - side: ${Direction[side]} - tile size: ${tileSize}`);
                    toggleWall(x, y, side);
                }
                break;
            case 'start':
                placeStartingPosition(x, y);
                break;
        }
    }, [selectedTool, placeTile, placeLaser, toggleWall, placeStartingPosition, tileSize]);

    const handleMouseDown = (x: number, y: number, event: React.MouseEvent) => {
        setIsDrawing(true);
        handleTileClick(x, y, event);
    };

    const handleMouseMove = (x: number, y: number, event: React.MouseEvent) => {
        if (isDrawing && selectedTool === 'tile') {
            handleTileClick(x, y, event);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseEnter = (x: number, y: number, event: React.MouseEvent) => {
        if (selectedTool === 'wall' && event) {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;
            
            let side: Direction;
            const edgeThreshold = tileSize * 0.3;
            
            if (relativeY < edgeThreshold) {
                side = Direction.UP;
            } else if (relativeY > tileSize - edgeThreshold) {
                side = Direction.DOWN;
            } else if (relativeX < edgeThreshold) {
                side = Direction.LEFT;
            } else if (relativeX > tileSize - edgeThreshold) {
                side = Direction.RIGHT;
            } else {
                side = Direction.UP;
            }
            
            setHoveredTile({ x, y, side });
        } else {
            setHoveredTile({ x, y });
        }
    };

    const handleMouseLeave = () => {
        setHoveredTile(null);
    };

    // Get preview content for what will happen on click
    const getPreviewContent = (x: number, y: number): React.ReactElement | null => {
        if (!hoveredTile || hoveredTile.x !== x || hoveredTile.y !== y) return null;
        
        switch (selectedTool) {
            case 'tile':
                if (selectedTileType === TileType.EMPTY) {
                    // Show empty tile preview
                    return <div className="absolute inset-0 bg-gray-500 opacity-50" />;
                }
                // Show tile preview
                const previewStyle: React.CSSProperties = {};
                
                if (selectedTileType === TileType.PIT) {
                    return <div className="absolute inset-0 bg-black opacity-50 rounded-lg" />;
                } else if (selectedTileType === TileType.REPAIR) {
                    return <div className="absolute inset-0 bg-green-500 opacity-50" />;
                } else if (selectedTileType === TileType.OPTION) {
                    return <div className="absolute inset-0 bg-yellow-500 opacity-50" />;
                } else if (selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR) {
                    const arrows = ['↑', '→', '↓', '←'];
                    return (
                        <div className={`absolute inset-0 ${selectedTileType === TileType.EXPRESS_CONVEYOR ? 'bg-orange-500' : 'bg-blue-500'} opacity-50 flex items-center justify-center`}>
                            <span className="text-white text-2xl font-bold">{arrows[selectedDirection]}</span>
                        </div>
                    );
                } else if (selectedTileType === TileType.GEAR_CW) {
                    return (
                        <div className="absolute inset-0 bg-purple-500 opacity-50 flex items-center justify-center">
                            <span className="text-white text-xl">⚙️</span>
                        </div>
                    );
                } else if (selectedTileType === TileType.PUSHER) {
                    const arrows = ['↑', '→', '↓', '←'];
                    return (
                        <div className="absolute inset-0 bg-red-500 opacity-50 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">{arrows[selectedDirection]}</span>
                        </div>
                    );
                }
                break;
                
            case 'wall':
                if (hoveredTile.side !== undefined) {
                    const walls = getWallsAt(x, y);
                    const hasWall = walls.includes(hoveredTile.side);
                    
                    // Show preview of wall toggle
                    const wallStyles: Record<Direction, React.CSSProperties> = {
                        [Direction.UP]: { top: 0, left: 0, right: 0, height: '4px' },
                        [Direction.DOWN]: { bottom: 0, left: 0, right: 0, height: '4px' },
                        [Direction.LEFT]: { top: 0, left: 0, bottom: 0, width: '4px' },
                        [Direction.RIGHT]: { top: 0, right: 0, bottom: 0, width: '4px' }
                    };
                    
                    return (
                        <div 
                            className={`absolute ${hasWall ? 'bg-red-500' : 'bg-green-500'} opacity-70`}
                            style={wallStyles[hoveredTile.side]}
                        />
                    );
                }
                break;
                
            case 'laser':
                const directionArrows = ['↑', '→', '↓', '←'];
                return (
                    <div className="absolute inset-0 bg-red-600 opacity-50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{directionArrows[selectedDirection]}</span>
                    </div>
                );
                
            case 'start':
                const startArrows = ['↑', '→', '↓', '←'];
                return (
                    <div className="absolute inset-0 bg-cyan-500 opacity-50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{startArrows[selectedDirection]}</span>
                    </div>
                );
        }
        
        return null;
    };

    // Using the same tile rendering logic as the game's Board component
    const getTileContent = (x: number, y: number): React.ReactElement[] => {
        const tile = getTileAt(x, y);
        const walls = getWallsAt(x, y);
        const elements: React.ReactElement[] = [];

        // Base tile (using the same style as the game)
        elements.push(
            <div key="base" className="absolute inset-0 border border-gray-600 bg-gray-400" />
        );

        // Add tile-specific elements (matching the game's implementation)
        if (tile) {
            // Conveyor belts (using the exact same logic as the game's Board component)
            if (tile.type === TileType.CONVEYOR || tile.type === TileType.EXPRESS_CONVEYOR) {
                const isExpress = tile.type === TileType.EXPRESS_CONVEYOR;
                const color = isExpress ? 'bg-blue-400' : 'bg-yellow-600';
                const arrowRotation = (tile.direction || 0) * 90;
                const arrowSize = Math.max(12, tileSize * 0.5);

                elements.push(
                    <div key="conveyor" className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
                        {isExpress && !tile.rotate ? (
                            // Express conveyor with double arrows back-to-back
                            <div
                                className="relative flex items-center justify-center"
                                style={{
                                    transform: `rotate(${arrowRotation}deg)`,
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                {/* First arrow */}
                                <svg
                                    className="text-gray-900 absolute"
                                    style={{
                                        width: `${arrowSize * 0.85}px`,
                                        height: `${arrowSize * 0.85}px`,
                                        transform: `translateY(${arrowSize * 0.35}px)`
                                    }}
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
                                </svg>
                                {/* Second arrow */}
                                <svg
                                    className="text-gray-900 absolute"
                                    style={{
                                        width: `${arrowSize * 0.85}px`,
                                        height: `${arrowSize * 0.85}px`,
                                        transform: `translateY(-${arrowSize * 0.35}px)`
                                    }}
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
                                </svg>
                            </div>
                        ) : isExpress && tile.rotate ? (
                            // Rotating EXPRESS conveyor - curved arrow plus straight entry arrow (matching game rendering)
                            <svg
                                className="text-gray-900"
                                style={{
                                    transform: `rotate(${arrowRotation - 90}deg)`,
                                    width: `${tileSize}px`,
                                    height: `${tileSize}px`,
                                }}
                                fill="currentColor"
                                viewBox="-8 -8 40 40"
                            >
                                {tile.rotate === 'clockwise' ? (
                                    // Clockwise rotation - enters from bottom, curves right
                                    <g>
                                        <path d="M12 24 Q12 12 24 12"
                                            fill="none" stroke="currentColor" strokeWidth="6" />
                                        <path d="M21 5 L31 12 L21 19 Z" />
                                        {/* Straight arrow entering from bottom - pointing up (narrower) */}
                                        <path d="M12 14 L6 24 L9 24 L9 32 L15 32 L15 24 L18 24 Z" />
                                    </g>
                                ) : (
                                    // Counter-clockwise rotation - enters from right, exits up (which becomes down after rotation)
                                    <g>
                                        <path d="M24 12 Q12 12 12 0"
                                            fill="none" stroke="currentColor" strokeWidth="6" />
                                        <path d="M19 5 L29 12 L19 19 Z" />
                                        {/* Arrow pointing up from top - after rotation will point left from right (narrower) */}
                                        <path d="M12 10 L6 0 L9 0 L9 -8 L15 -8 L15 0 L18 0 Z" />
                                    </g>
                                )}
                            </svg>
                        ) : tile.rotate ? (
                            // Rotating conveyor with curved arrow (matching game rendering)
                            <svg
                                className="text-gray-900"
                                style={{
                                    transform: `rotate(${arrowRotation - 90}deg)`,
                                    width: `${tileSize}px`,
                                    height: `${tileSize}px`,
                                }}
                                fill="currentColor"
                                viewBox="-8 -8 40 40"
                            >
                                {tile.rotate === 'clockwise' ? (
                                    // Clockwise rotation - enters from bottom, curves right
                                    <g>
                                        <path d="M12 24 Q12 12 24 12"
                                            fill="none" stroke="currentColor" strokeWidth="8" />
                                        <path d="M21 5 L31 12 L21 19 Z" />
                                    </g>
                                ) : (
                                    // Counter-clockwise rotation - enters from right, exits up
                                    <g>
                                        <path d="M24 12 Q12 12 12 0"
                                            fill="none" stroke="currentColor" strokeWidth="8" />
                                        <path d="M19 5 L29 12 L19 19 Z" />
                                    </g>
                                )}
                            </svg>
                        ) : (
                            // Regular straight conveyor arrow
                            <svg
                                className="text-gray-900"
                                style={{
                                    transform: `rotate(${arrowRotation}deg)`,
                                    width: `${arrowSize}px`,
                                    height: `${arrowSize}px`
                                }}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
                            </svg>
                        )}
                    </div>
                );
            }

            // Gears
            if (tile.type === TileType.GEAR_CW || tile.type === TileType.GEAR_CCW) {
                const isClockwise = tile.type === TileType.GEAR_CW;
                elements.push(
                    <div key="gear" className="absolute inset-1 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="text-white text-lg font-bold">
                            {isClockwise ? '↻' : '↺'}
                        </div>
                    </div>
                );
            }

            // Pits
            if (tile.type === TileType.PIT) {
                elements.push(
                    <div key="pit" className="absolute inset-0 bg-black flex items-center justify-center">
                        <div className="absolute inset-1 border-4 border-yellow-400 border-dashed bg-black"></div>
                    </div>
                );
            }

            // Repair sites
            if (tile.type === TileType.REPAIR) {
                elements.push(
                    <div key="repair" className="absolute inset-1 bg-green-600 rounded-sm flex items-center justify-center">
                        <div className="text-white text-lg font-bold">🔧</div>
                    </div>
                );
            }

            // Option sites
            if (tile.type === TileType.OPTION) {
                elements.push(
                    <div key="option" className="absolute inset-1 bg-blue-600 rounded-sm flex items-center justify-center">
                        <div className="text-white text-lg font-bold">?</div>
                    </div>
                );
            }

            // Pushers
            if (tile.type === TileType.PUSHER) {
                const arrowRotation = (tile.direction || 0) * 90;
                elements.push(
                    <div key="pusher" className="absolute inset-1 bg-red-600 rounded-sm flex items-center justify-center">
                        <div
                            className="text-white text-lg font-bold"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                        >
                            ⤴
                        </div>
                    </div>
                );
            }
        }

        // Walls (using the same wall rendering as the game)
        if (walls.length > 0) {
            const wallThickness = Math.max(3, Math.floor(tileSize * 0.08));

            walls.forEach(direction => {
                let wallStyle: React.CSSProperties = {
                    position: 'absolute',
                    backgroundColor: '#fbbf24', // yellow-400
                    zIndex: 10,
                };

                switch (direction) {
                    case Direction.UP:
                        wallStyle = {
                            ...wallStyle,
                            top: 0,
                            left: 0,
                            right: 0,
                            height: `${wallThickness}px`,
                        };
                        break;
                    case Direction.RIGHT:
                        wallStyle = {
                            ...wallStyle,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: `${wallThickness}px`,
                        };
                        break;
                    case Direction.DOWN:
                        wallStyle = {
                            ...wallStyle,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${wallThickness}px`,
                        };
                        break;
                    case Direction.LEFT:
                        wallStyle = {
                            ...wallStyle,
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${wallThickness}px`,
                        };
                        break;
                }

                elements.push(
                    <div
                        key={`wall-${direction}`}
                        style={wallStyle}
                    />
                );
            });
        }

        // Starting positions (using the same style as the game)
        const startingPosition = getStartingPositionAt(x, y);
        if (startingPosition) {
            elements.push(
                <div key="starting-pos" className="absolute inset-0">
                    <div className="absolute inset-0 bg-green-600 opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="bg-white text-black font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-green-600"
                            style={{
                                width: tileSize * 0.6,
                                height: tileSize * 0.6,
                                fontSize: tileSize * 0.3
                            }}
                        >
                            {startingPosition.number}
                        </div>
                    </div>
                </div>
            );
        }

        // Laser source indicator (small red dot)
        const laser = getLaserAt(x, y);
        if (laser) {
            elements.push(
                <div key="laser" className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            );
        }

        return elements;
    };

    const renderTile = (x: number, y: number) => {
        const tileContent = getTileContent(x, y);
        const previewContent = getPreviewContent(x, y);

        return (
            <div
                key={`${x}-${y}`}
                className="relative cursor-pointer"
                style={{ width: tileSize, height: tileSize }}
                onMouseDown={(e) => handleMouseDown(x, y, e)}
                onMouseMove={(e) => {
                    handleMouseMove(x, y, e);
                    if (selectedTool === 'wall') {
                        handleMouseEnter(x, y, e);
                    }
                }}
                onMouseEnter={(e) => handleMouseEnter(x, y, e)}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                title={`(${x}, ${y})`}
            >
                {tileContent}

                {/* Preview overlay - shows what will happen on click */}
                {previewContent}

                {/* Grid coordinates overlay */}
                {showGrid && tileSize >= 30 && (
                    <div className="absolute top-0 left-0 text-xs text-gray-800 bg-white bg-opacity-75 px-1 rounded-br leading-none pointer-events-none z-10">
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

    // Other utility functions (export, import, templates, etc.)
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

    const loadGameBoard = (boardId: string) => {
        // First try to get it as a board definition
        let boardDefinition = getBoardDefinitionById(boardId);

        // If not found as individual board, try to get it from a course
        if (!boardDefinition) {
            const course = ALL_COURSES.find(c => c.id === boardId);
            if (course) {
                try {
                    const builtCourse = buildCourse(course);
                    // Convert the built course board back to a board definition
                    boardDefinition = {
                        id: course.id,
                        name: course.name,
                        width: builtCourse.board.width,
                        height: builtCourse.board.height,
                        startingPositions: builtCourse.board.startingPositions,
                        tiles: extractTilesFromBoard(builtCourse.board),
                        lasers: builtCourse.board.lasers?.map(laser => ({
                            position: laser.position,
                            direction: laser.direction as Direction,
                            damage: laser.damage
                        })),
                        walls: builtCourse.board.walls
                    };
                } catch (error) {
                    console.error('Error loading course:', error);
                    return;
                }
            }
        }

        if (boardDefinition) {
            const newBoard = cloneBoardDefinition(boardDefinition);
            setBoardDef(newBoard);
            addToHistory(newBoard);
        }
    };

    // Helper function to extract tiles from a built board
    const extractTilesFromBoard = (board: Course['board']): TileElement[] => {
        const tiles: TileElement[] = [];

        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const tile = board.tiles[y]?.[x];
                if (tile && tile.type !== TileType.EMPTY) {
                    const tileElement: TileElement = {
                        position: { x, y },
                        type: tile.type,
                    };

                    if (tile.direction !== undefined) {
                        tileElement.direction = tile.direction;
                    }

                    if (tile.rotate) {
                        tileElement.rotate = tile.rotate;
                    }

                    if (tile.registers) {
                        tileElement.registers = tile.registers;
                    }

                    tiles.push(tileElement);
                }
            }
        }

        return tiles;
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

    const copyToClipboard = async () => {
        try {
            const dataStr = JSON.stringify(boardDef, null, 2);
            await navigator.clipboard.writeText(dataStr);
            alert('Board JSON copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = JSON.stringify(boardDef, null, 2);
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Board JSON copied to clipboard!');
        }
    };

    const copyTypeScriptToClipboard = async () => {
        try {
            const tsCode = exportToTypeScript(boardDef);
            await navigator.clipboard.writeText(tsCode);
            alert('Board TypeScript code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy TypeScript to clipboard:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = exportToTypeScript(boardDef);
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Board TypeScript code copied to clipboard!');
        }
    };

    const pasteFromClipboard = async () => {
        try {
            let clipboardText = '';

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.readText) {
                clipboardText = await navigator.clipboard.readText();
            } else {
                // Fallback: prompt user to paste manually
                clipboardText = prompt('Paste your board definition JSON here:') || '';
            }

            if (clipboardText.trim()) {
                const imported = JSON.parse(clipboardText);

                // Basic validation - check if it looks like a board definition
                if (imported && typeof imported === 'object' && imported.id && imported.name && typeof imported.width === 'number' && typeof imported.height === 'number') {
                    setBoardDef(imported);
                    addToHistory(imported);
                    alert('Board definition loaded from clipboard!');
                } else {
                    alert('Invalid board definition format in clipboard.');
                }
            }
        } catch (err) {
            console.error('Failed to paste from clipboard:', err);
            alert('Failed to parse board definition. Please check the JSON format.');
        }
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

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Board Editor</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
                        >
                            Undo
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
                        >
                            Redo
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

                {/* Game Boards Panel */}
                {
                    showGameBoards && (
                        <div className="bg-gray-800 p-4 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold mb-3">Load Game Boards</h3>

                            {/* Courses */}
                            <div className="mb-4">
                                <h4 className="text-md font-medium mb-2">Official Courses</h4>
                                <p className="text-sm text-gray-400 mb-2">Complete courses with checkpoints and multiple boards</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {ALL_COURSES.map(course => (
                                        <button
                                            key={course.id}
                                            onClick={() => loadGameBoard(course.id)}
                                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-left"
                                        >
                                            <div className="font-medium">{course.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{course.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span className={`inline-block px-2 py-1 rounded mr-2 ${course.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                                                    course.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                                        'bg-red-900 text-red-300'
                                                    }`}>
                                                    {course.difficulty}
                                                </span>
                                                {course.minPlayers}-{course.maxPlayers} players
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Individual Boards */}
                            <div>
                                <h4 className="text-md font-medium mb-2">Individual Board Definitions</h4>
                                <p className="text-sm text-gray-400 mb-2">Raw board layouts from the game files</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {ALL_BOARD_DEFINITIONS.map(board => (
                                        <button
                                            key={board.id}
                                            onClick={() => loadGameBoard(board.id)}
                                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-left"
                                        >
                                            <div className="font-medium text-xs">{board.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {board.width}×{board.height} • {board.startingPositions.length} starts
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                } <button
                    onClick={() => setShowGameBoards(!showGameBoards)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                    Game Boards
                </button>

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
                                    <label className="text-sm">Zoom:</label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="80"
                                        value={tileSize}
                                        onChange={(e) => setTileSize(parseInt(e.target.value))}
                                        className="w-20"
                                    />
                                    <span className="text-xs w-8">{tileSize}px</span>
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`px-2 py-1 rounded text-sm ${showGrid ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={clearBoard}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-auto border border-gray-600 p-2 bg-gray-700" style={{ maxHeight: '70vh' }}>
                                <div className="inline-block" onMouseLeave={handleMouseUp}>
                                    {renderBoard()}
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
                                    { tool: 'tile' as const, name: 'Tiles', icon: '🟦' },
                                    { tool: 'laser' as const, name: 'Lasers', icon: '🔴' },
                                    { tool: 'wall' as const, name: 'Walls', icon: '🧱' },
                                    { tool: 'start' as const, name: 'Start', icon: '🚀' },
                                ].map(({ tool, name, icon }) => (
                                    <button
                                        key={tool}
                                        onClick={() => setSelectedTool(tool)}
                                        className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedTool === tool ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        <span>{icon}</span>
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

                            {/* Rotation Selection */}
                            {(selectedTool === 'tile' && (selectedTileType === TileType.CONVEYOR || selectedTileType === TileType.EXPRESS_CONVEYOR || selectedTileType === TileType.GEAR_CW)) && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">
                                        {selectedTileType === TileType.GEAR_CW ? 'Rotation' : 'Curve'}
                                    </label>
                                    <div className="grid grid-cols-1 gap-1">
                                        {ROTATION_OPTIONS.map(({ value, name, icon }) => {
                                            // For gears, don't show 'none' option
                                            if (selectedTileType === TileType.GEAR_CW && value === 'none') return null;

                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedRotation(value)}
                                                    className={`px-2 py-1 rounded text-sm flex items-center gap-2 ${selectedRotation === value ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                                >
                                                    <span>{icon}</span>
                                                    {name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tile Palette */}
                        {selectedTool === 'tile' && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">Tile Types</h3>

                                <div className="space-y-1">
                                    {TILE_PALETTE.map(({ type, name, icon }) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedTileType(type)}
                                            className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${selectedTileType === type ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                        >
                                            <span className="text-lg">{icon}</span>
                                            {name}
                                        </button>
                                    ))}
                                </div>

                                {/* Help text */}
                                <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-300">
                                    <p><strong>Conveyors & Gears:</strong> Use the Curve/Rotation selector below to make corner conveyors or set gear direction.</p>
                                </div>
                            </div>
                        )}

                        {/* Export/Import */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">File Operations</h3>
                            <div className="space-y-2">
                                {/* JSON Operations */}
                                <div className="border-b border-gray-600 pb-2 mb-2">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">JSON Format</h4>
                                    <div className="space-y-1">
                                        <button
                                            onClick={exportBoard}
                                            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                                        >
                                            📁 Export JSON File
                                        </button>
                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                        >
                                            📋 Copy JSON to Clipboard
                                        </button>
                                    </div>
                                </div>

                                {/* TypeScript Operations */}
                                <div className="border-b border-gray-600 pb-2 mb-2">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">TypeScript Format</h4>
                                    <div className="space-y-1">
                                        <button
                                            onClick={exportTypeScript}
                                            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                                        >
                                            📁 Export TypeScript File
                                        </button>
                                        <button
                                            onClick={copyTypeScriptToClipboard}
                                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                        >
                                            📋 Copy TypeScript to Clipboard
                                        </button>
                                    </div>
                                </div>

                                {/* Import Operations */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Import</h4>
                                    <div className="space-y-1">
                                        <button
                                            onClick={pasteFromClipboard}
                                            className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm"
                                        >
                                            📥 Paste from Clipboard
                                        </button>
                                        <label className="block">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={importBoard}
                                                className="hidden"
                                            />
                                            <div className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm text-center cursor-pointer">
                                                📤 Import from File
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}