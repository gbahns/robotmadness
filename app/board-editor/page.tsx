'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { BoardDefinition, TileElement, LaserElement, WallElement, StartingPosition as StartingPosType, TileType, Direction, Board, Checkpoint } from '@/lib/game/types';
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
import { ALL_BOARD_DEFINITIONS, getBoardDefinitionById } from '@/lib/game/board-utils';
import { RepairSite, ConveyorBelt, Gear, Pit, Pusher, LaserEmitter, StartingPosition, Wall } from '@/components/game/board-elements';
import BoardRenderer from '@/components/game/BoardRenderer';

// Tile palette for placing elements
// Unified tool and tile palette
type ToolType = 'tile' | 'laser' | 'wall' | 'start';

interface PaletteItem {
    tool: ToolType;
    type?: TileType;
    name: string;
    icon: string;
    needsDirection?: boolean;
}

const TOOL_PALETTE: PaletteItem[] = [
    // Tiles
    { tool: 'tile', type: TileType.EMPTY, name: 'Empty', icon: '□' },
    { tool: 'tile', type: TileType.PIT, name: 'Pit', icon: '⚫' },
    { tool: 'tile', type: TileType.REPAIR, name: 'Repair', icon: '🔧' },
    { tool: 'tile', type: TileType.OPTION, name: 'Option', icon: '?' },
    { tool: 'tile', type: TileType.CONVEYOR, name: 'Conveyor', icon: '→', needsDirection: true },
    { tool: 'tile', type: TileType.EXPRESS_CONVEYOR, name: 'Express', icon: '⇒', needsDirection: true },
    { tool: 'tile', type: TileType.GEAR_CW, name: 'Gear', icon: '⚙️' },
    { tool: 'tile', type: TileType.PUSHER, name: 'Pusher', icon: '⤴', needsDirection: true },
    // Other tools
    { tool: 'wall', name: 'Wall', icon: '🧱' },
    { tool: 'laser', name: 'Laser', icon: '🔴' },
    { tool: 'start', name: 'Start Position', icon: '🚀', needsDirection: true },
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
    const [selectedItem, setSelectedItem] = useState<PaletteItem>(TOOL_PALETTE[0]);
    const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UP);
    const [selectedRotation, setSelectedRotation] = useState<'none' | 'clockwise' | 'counterclockwise'>('none');
    const [selectedLaserStrength, setSelectedLaserStrength] = useState<number>(1);
    const [showGrid, setShowGrid] = useState(true);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showGameBoards, setShowGameBoards] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<BoardDefinition[]>([createEmptyBoard()]);
    const [historyIndex, setHistoryIndex] = useState(0);
    // Tile size will be calculated by BoardRenderer
    const [calculatedTileSize, setCalculatedTileSize] = useState(50);
    const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number; side?: Direction } | null>(null);

    // Convert BoardDefinition to Board type for BoardRenderer
    const convertToBoard = (def: BoardDefinition): Board => {
        // Create a 2D array for tiles
        const tiles: any[][] = [];
        
        // Initialize empty 2D array
        for (let y = 0; y < def.height; y++) {
            tiles[y] = [];
            for (let x = 0; x < def.width; x++) {
                tiles[y][x] = undefined;
            }
        }
        
        // Place tiles from BoardDefinition into 2D array
        if (def.tiles) {
            def.tiles.forEach(tile => {
                const x = tile.position.x;
                const y = tile.position.y;
                if (y >= 0 && y < def.height && x >= 0 && x < def.width) {
                    tiles[y][x] = {
                        type: tile.type,
                        direction: (tile as any).direction,
                        rotate: (tile as any).rotate,
                        registers: (tile as any).registers,
                        walls: (tile as any).walls || []
                    };
                }
            });
        }
        
        // console.log(`Converting board with ${def.tiles?.length || 0} tile definitions into ${def.width}x${def.height} grid`);

        // Add walls to tiles
        if (def.walls && def.walls.length > 0) {
            // console.log('Processing walls:', def.walls);
            def.walls.forEach(wallElement => {
                const x = wallElement.position.x;
                const y = wallElement.position.y;
                // console.log(`Adding walls at (${x},${y}): sides`, wallElement.sides);
                if (y >= 0 && y < def.height && x >= 0 && x < def.width) {
                    if (!tiles[y][x]) {
                        tiles[y][x] = { type: 0 }; // Empty tile
                    }
                    tiles[y][x].walls = wallElement.sides;
                    // console.log(`Tile at (${x},${y}) now has walls:`, tiles[y][x].walls);
                }
            });
        } else {
            // console.log('No walls in board definition');
        }

        return {
            width: def.width,
            height: def.height,
            tiles,
            lasers: def.lasers || [],
            startingPositions: def.startingPositions || [],
            walls: def.walls || []
        };
    };

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

    const getStartingPositionAt = (x: number, y: number): StartingPosType | undefined => {
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
        console.log(`placeTile called at (${x}, ${y}) with type: ${selectedItem.type}`);
        updateBoard(prev => {
            const newTiles = prev.tiles?.filter(tile => !(tile.position.x === x && tile.position.y === y)) || [];

            if (selectedItem.tool === 'tile' && selectedItem.type && selectedItem.type !== TileType.EMPTY) {
                const newTile: TileElement = {
                    position: { x, y },
                    type: selectedItem.type,
                };

                // Add direction for tiles that need it
                if (selectedItem.type === TileType.CONVEYOR || selectedItem.type === TileType.EXPRESS_CONVEYOR || selectedItem.type === TileType.PUSHER) {
                    newTile.direction = selectedDirection;
                }

                // Add rotation for conveyors if selected
                if ((selectedItem.type === TileType.CONVEYOR || selectedItem.type === TileType.EXPRESS_CONVEYOR) && selectedRotation !== 'none') {
                    newTile.rotate = selectedRotation as 'clockwise' | 'counterclockwise';
                }

                // Handle gears - they always need rotation, use selectedRotation or default to clockwise
                if (selectedItem.type === TileType.GEAR_CW) {
                    newTile.rotate = selectedRotation === 'counterclockwise' ? 'counterclockwise' : 'clockwise';
                    // For gears, we need to set the correct type based on rotation
                    if (selectedRotation === 'counterclockwise') {
                        newTile.type = TileType.GEAR_CCW;
                    }
                }

                // Add registers for pushers based on rotation selection
                if (selectedItem.type === TileType.PUSHER) {
                    // Use rotation to determine odd/even registers
                    (newTile as any).registers = selectedRotation === 'counterclockwise' ? [2, 4] : [1, 3, 5];
                    console.log('Placing pusher with registers:', (newTile as any).registers);
                }

                newTiles.push(newTile);
            }

            return { ...prev, tiles: newTiles };
        });
    }, [selectedItem.type, selectedDirection, selectedRotation, updateBoard]);

    const placeLaser = useCallback((x: number, y: number, direction: Direction) => {
        updateBoard(prev => {
            const existingLasers = prev.lasers || [];
            
            // Check if there's already a laser at this position
            const existingLaserIndex = existingLasers.findIndex(
                laser => laser.position.x === x && laser.position.y === y
            );
            
            let newLasers: LaserElement[];
            
            if (existingLaserIndex !== -1) {
                // If there's a laser at this position with the same direction, remove it (toggle off)
                const existingLaser = existingLasers[existingLaserIndex];
                if (existingLaser.direction === direction) {
                    // Remove the laser
                    newLasers = existingLasers.filter((_, index) => index !== existingLaserIndex);
                } else {
                    // Replace with new direction
                    newLasers = existingLasers.map((laser, index) => 
                        index === existingLaserIndex 
                            ? { ...laser, direction, damage: selectedLaserStrength || 1 }
                            : laser
                    );
                }
            } else {
                // Add new laser
                const newLaser: LaserElement = {
                    position: { x, y },
                    direction,
                    damage: selectedLaserStrength || 1
                };
                newLasers = [...existingLasers, newLaser];
            }
            
            return { ...prev, lasers: newLasers };
        });
    }, [selectedLaserStrength, updateBoard]);

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

            console.log(`Wall toggle at (${x},${y}) side ${Direction[side]} (value: ${side}):`);
            console.log('All walls in board:', newWalls);
            console.log('Walls at this position:', newWalls.filter(w => w.position.x === x && w.position.y === y));

            return { ...prev, walls: newWalls };
        });
    }, [updateBoard]);

    const placeStartingPosition = useCallback((x: number, y: number) => {
        updateBoard(prev => {
            const newStartingPositions = prev.startingPositions.filter(pos => !(pos.position.x === x && pos.position.y === y));

            const nextNumber = Math.max(0, ...prev.startingPositions.map(p => p.number)) + 1;

            const newStartingPosition: StartingPosType = {
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
                if (event) {
                    const rect = (event.target as HTMLElement).getBoundingClientRect();
                    const relativeX = event.clientX - rect.left;
                    const relativeY = event.clientY - rect.top;
                    
                    // Determine laser direction based on which edge the mouse is closest to
                    const centerX = calculatedTileSize / 2;
                    const centerY = calculatedTileSize / 2;
                    const dx = relativeX - centerX;
                    const dy = relativeY - centerY;
                    
                    let direction: Direction;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal - closer to left or right edge
                        direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                    } else {
                        // Vertical - closer to top or bottom edge
                        direction = dy > 0 ? Direction.DOWN : Direction.UP;
                    }
                    
                    placeLaser(x, y, direction);
                }
                break;
            case 'wall':
                if (event) {
                    const rect = (event.target as HTMLElement).getBoundingClientRect();
                    const relativeX = event.clientX - rect.left;
                    const relativeY = event.clientY - rect.top;

                    let side: Direction;
                    // More precise edge detection
                    const edgeThreshold = calculatedTileSize * 0.3; // 30% from edges

                    if (relativeY < edgeThreshold) {
                        side = Direction.UP;
                    } else if (relativeY > calculatedTileSize - edgeThreshold) {
                        side = Direction.DOWN;
                    } else if (relativeX < edgeThreshold) {
                        side = Direction.LEFT;
                    } else if (relativeX > calculatedTileSize - edgeThreshold) {
                        side = Direction.RIGHT;
                    } else {
                        // Default to top if clicking in center
                        side = Direction.UP;
                    }

                    console.log(`Wall click at (${x},${y}) - relative pos: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}) - side: ${Direction[side]} (value: ${side}) - tile size: ${calculatedTileSize}`);
                    toggleWall(x, y, side);
                }
                break;
            case 'start':
                placeStartingPosition(x, y);
                break;
        }
    }, [selectedItem.tool, placeTile, placeLaser, toggleWall, placeStartingPosition, calculatedTileSize]);

    const handleMouseDown = (x: number, y: number, event: React.MouseEvent) => {
        setIsDrawing(true);
        // Only handle tile placement on mouse down for drawing tiles
        // Walls are handled by click only to avoid double-toggling
        if (selectedItem.tool === 'tile') {
            handleTileClick(x, y, event);
        }
    };

    const handleMouseMove = (x: number, y: number, event: React.MouseEvent) => {
        if (isDrawing && selectedItem.tool === 'tile') {
            handleTileClick(x, y, event);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseEnter = (x: number, y: number, event: React.MouseEvent) => {
        if ((selectedItem.tool === 'wall' || selectedItem.tool === 'laser') && event) {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;
            
            let side: Direction;
            const edgeThreshold = calculatedTileSize * 0.3;
            
            if (relativeY < edgeThreshold) {
                side = Direction.UP;
            } else if (relativeY > calculatedTileSize - edgeThreshold) {
                side = Direction.DOWN;
            } else if (relativeX < edgeThreshold) {
                side = Direction.LEFT;
            } else if (relativeX > calculatedTileSize - edgeThreshold) {
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
        
        switch (selectedItem.tool) {
            case 'tile':
                if (selectedItem.type === TileType.EMPTY) {
                    // Show empty tile preview
                    return <div className="absolute inset-0 bg-gray-500 opacity-50" />;
                }
                
                // Use actual components for preview with opacity
                return (
                    <div className="absolute inset-0 opacity-60 pointer-events-none">
                        {selectedItem.type === TileType.PIT && (
                            <Pit tileSize={calculatedTileSize} />
                        )}
                        {(selectedItem.type === TileType.REPAIR || selectedItem.type === TileType.OPTION) && (
                            <RepairSite type={selectedItem.type} tileSize={calculatedTileSize} />
                        )}
                        {(selectedItem.type === TileType.CONVEYOR || selectedItem.type === TileType.EXPRESS_CONVEYOR) && (
                            <ConveyorBelt 
                                type={selectedItem.type === TileType.EXPRESS_CONVEYOR ? 'express' : 'conveyor'}
                                direction={selectedDirection}
                                rotate={selectedRotation === 'clockwise' ? 'clockwise' : selectedRotation === 'counterclockwise' ? 'counter-clockwise' : undefined}
                                tileSize={calculatedTileSize}
                            />
                        )}
                        {(selectedItem.type === TileType.GEAR_CW || selectedItem.type === TileType.GEAR_CCW) && (
                            <Gear 
                                type={selectedRotation === 'counterclockwise' ? TileType.GEAR_CCW : TileType.GEAR_CW} 
                                tileSize={calculatedTileSize} 
                            />
                        )}
                        {selectedItem.type === TileType.PUSHER && (
                            <Pusher 
                                direction={selectedDirection}
                                registers={[1, 3, 5]} // Default to odd registers for preview
                                tileSize={calculatedTileSize}
                            />
                        )}
                    </div>
                );
                break;
                
            case 'wall':
                if (hoveredTile.side !== undefined) {
                    const walls = getWallsAt(x, y);
                    const hasWall = walls.includes(hoveredTile.side);
                    
                    // Show preview of wall toggle using the Wall component
                    if (hasWall) {
                        // Show red indicator for removal
                        const wallStyles: Record<Direction, React.CSSProperties> = {
                            [Direction.UP]: { top: 0, left: 0, right: 0, height: '4px' },
                            [Direction.DOWN]: { bottom: 0, left: 0, right: 0, height: '4px' },
                            [Direction.LEFT]: { top: 0, left: 0, bottom: 0, width: '4px' },
                            [Direction.RIGHT]: { top: 0, right: 0, bottom: 0, width: '4px' }
                        };
                        return (
                            <div 
                                className="absolute bg-red-500 opacity-70"
                                style={wallStyles[hoveredTile.side]}
                            />
                        );
                    } else {
                        // Show wall preview using actual Wall component
                        return (
                            <div className="absolute inset-0 opacity-60 pointer-events-none">
                                <Wall directions={[hoveredTile.side]} tileSize={calculatedTileSize} />
                            </div>
                        );
                    }
                }
                break;
                
            case 'laser':
                if (hoveredTile?.side !== undefined) {
                    // Check if there's already a laser at this position
                    const existingLaser = boardDef.lasers?.find(
                        laser => laser.position.x === x && laser.position.y === y
                    );
                    
                    if (existingLaser && existingLaser.direction === hoveredTile.side) {
                        // Show red indicator for removal
                        return (
                            <div className="absolute inset-0 opacity-60 pointer-events-none">
                                <div className="absolute inset-0 bg-red-500 opacity-30" />
                                <LaserEmitter 
                                    direction={hoveredTile.side}
                                    damage={existingLaser.damage || 1}
                                    tileSize={calculatedTileSize}
                                />
                            </div>
                        );
                    } else {
                        // Show laser preview
                        return (
                            <div className="absolute inset-0 opacity-60 pointer-events-none">
                                <LaserEmitter 
                                    direction={hoveredTile.side}
                                    damage={selectedLaserStrength || 1}
                                    tileSize={calculatedTileSize}
                                />
                            </div>
                        );
                    }
                }
                return null;
                
            case 'start':
                // Find next available starting position number
                const existingNumbers = boardDef.startingPositions.map(sp => sp.number);
                const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
                return (
                    <div className="absolute inset-0 opacity-60 pointer-events-none">
                        <StartingPosition 
                            number={nextNumber}
                            tileSize={calculatedTileSize}
                        />
                    </div>
                );
        }
        
        return null;
    };

    // getTileContent and renderTile removed - now handled by BoardRenderer

    // Memoize the board conversion to prevent re-running on every render
    const board = useMemo(() => convertToBoard(boardDef), [boardDef]);
    
    const renderBoard = () => {
        // Create checkpoints array - BoardDefinition doesn't have checkpoints
        const checkpoints: Checkpoint[] = [];
        
        return (
            <BoardRenderer
                board={board}
                checkpoints={checkpoints}
                startingPositions={boardDef.startingPositions || []}
                editMode={true}
                showGrid={showGrid}
                showCoordinates={showCoordinates}
                hoveredTile={hoveredTile ? { x: hoveredTile.x, y: hoveredTile.y } : undefined}
                selectedTool={selectedItem.tool}
                previewElement={getPreviewContent(hoveredTile?.x || 0, hoveredTile?.y || 0)}
                onTileClick={handleTileClick}
                onTileMouseDown={selectedItem.tool === 'tile' ? handleMouseDown : undefined}
                onTileMouseEnter={handleMouseEnter}
                onTileMouseMove={(x, y, e) => {
                    handleMouseMove(x, y, e);
                    if (selectedItem.tool === 'wall' || selectedItem.tool === 'laser') {
                        // Determine direction based on mouse position
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const relativeY = e.clientY - rect.top;
                        const tileWidth = rect.width;
                        const tileHeight = rect.height;
                        
                        let side: Direction | undefined;
                        
                        if (selectedItem.tool === 'wall') {
                            // For walls, use edge detection
                            const edgeThreshold = 0.3;
                            if (relativeY < tileHeight * edgeThreshold) side = Direction.UP;
                            else if (relativeY > tileHeight * (1 - edgeThreshold)) side = Direction.DOWN;
                            else if (relativeX < tileWidth * edgeThreshold) side = Direction.LEFT;
                            else if (relativeX > tileWidth * (1 - edgeThreshold)) side = Direction.RIGHT;
                        } else {
                            // For lasers, determine direction from center
                            const centerX = tileWidth / 2;
                            const centerY = tileHeight / 2;
                            const dx = relativeX - centerX;
                            const dy = relativeY - centerY;
                            
                            if (Math.abs(dx) > Math.abs(dy)) {
                                side = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                            } else {
                                side = dy > 0 ? Direction.DOWN : Direction.UP;
                            }
                        }
                        
                        setHoveredTile({ x, y, side });
                    }
                }}
                onTileMouseUp={handleMouseUp}
                onTileMouseLeave={handleMouseLeave}
                onTileSizeChange={setCalculatedTileSize}
            />
        );
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
        const boardDefinition = getBoardDefinitionById(boardId);
        if (boardDefinition) {
            const newBoard = cloneBoardDefinition(boardDefinition);
            setBoardDef(newBoard);
            addToHistory(newBoard);
        }
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
                {showGameBoards && (
                    <div className="bg-gray-800 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-3">Load Game Boards</h3>
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
                )} <button
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
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`px-2 py-1 rounded text-sm ${showGrid ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setShowCoordinates(!showCoordinates)}
                                        className={`px-2 py-1 rounded text-sm ${showCoordinates ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        Coords
                                    </button>
                                    <button
                                        onClick={clearBoard}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="relative border border-gray-600 bg-gray-700 overflow-hidden" style={{ height: 'calc(70vh - 100px)' }} onMouseLeave={handleMouseUp}>
                                {renderBoard()}
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

                        {/* Tool & Tile Palette */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Tools & Tiles</h3>
                            <div className="space-y-1 mb-3">
                                {TOOL_PALETTE.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${selectedItem === item ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        <span className="text-base">{item.icon}</span>
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

                            {/* Rotation Selection */}
                            {(selectedItem.tool === 'tile' && (selectedItem.type === TileType.CONVEYOR || selectedItem.type === TileType.EXPRESS_CONVEYOR || selectedItem.type === TileType.GEAR_CW || selectedItem.type === TileType.PUSHER)) && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">
                                        {selectedItem.type === TileType.GEAR_CW ? 'Rotation' : 
                                         selectedItem.type === TileType.PUSHER ? 'Registers' : 'Curve'}
                                    </label>
                                    <div className="grid grid-cols-1 gap-1">
                                        {(selectedItem.type === TileType.PUSHER ? 
                                            [
                                                { value: 'none', name: 'Odd (1,3,5)', icon: '1️⃣' },
                                                { value: 'counterclockwise', name: 'Even (2,4)', icon: '2️⃣' }
                                            ] : ROTATION_OPTIONS
                                        ).map(({ value, name, icon }) => {
                                            // For gears, don't show 'none' option
                                            if (selectedItem.type === TileType.GEAR_CW && value === 'none') return null;

                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedRotation(value as 'none' | 'clockwise' | 'counterclockwise')}
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
                            
                            {/* Laser Damage Selection */}
                            {selectedItem.tool === 'laser' && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">Laser Damage</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[1, 2, 3].map((damage) => (
                                            <button
                                                key={damage}
                                                onClick={() => setSelectedLaserStrength(damage)}
                                                className={`px-2 py-1 rounded text-sm ${selectedLaserStrength === damage ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                            >
                                                {damage === 1 ? 'Single' : damage === 2 ? 'Double' : 'Triple'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        {selectedLaserStrength === 1 && "Single laser - 1 damage"}
                                        {selectedLaserStrength === 2 && "Double laser - 2 damage"}
                                        {selectedLaserStrength === 3 && "Triple laser - 3 damage (rare)"}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Operations */}
                        <div className="bg-gray-800 p-3 rounded-lg">
                                <h3 className="text-sm font-semibold mb-2">File Operations</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={exportBoard}
                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                        title="Export JSON File"
                                    >
                                        📁 Export
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                        title="Copy JSON to Clipboard"
                                    >
                                        📋 Copy
                                    </button>
                                    <button
                                        onClick={pasteFromClipboard}
                                        className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
                                        title="Paste from Clipboard"
                                    >
                                        📥 Paste
                                    </button>
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={importBoard}
                                            className="hidden"
                                        />
                                        <div className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs text-center cursor-pointer"
                                            title="Import from File">
                                            📤 Import
                                        </div>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={exportTypeScript}
                                        className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                                        title="Export TypeScript File"
                                    >
                                        📄 Export TS
                                    </button>
                                    <button
                                        onClick={copyTypeScriptToClipboard}
                                        className="px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs"
                                        title="Copy TypeScript to Clipboard"
                                    >
                                        📋 Copy TS
                                    </button>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}