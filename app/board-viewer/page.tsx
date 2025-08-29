'use client';

import React, { useState, useEffect } from 'react';
import { ALL_BOARD_DEFINITIONS, getBoardDefinitionById, buildBoard, DOCKING_BAY_BOARDS } from '@/lib/game/board-utils';
import { BoardDefinition, Board as BoardType } from '@/lib/game/types';
import Board from '@/components/game/Board';

export default function BoardViewerPage() {
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [board, setBoard] = useState<BoardType | null>(null);
    const [boardDefinition, setBoardDefinition] = useState<BoardDefinition | null>(null);
    const [boardCategory, setBoardCategory] = useState<'factory' | 'docking'>('factory');

    // Get all board IDs based on category
    const boardIds = boardCategory === 'factory'
        ? ALL_BOARD_DEFINITIONS.map(b => b.id)
        : DOCKING_BAY_BOARDS.map(b => b.id);

    // Load saved board selection from localStorage on mount
    useEffect(() => {
        const savedBoardId = localStorage.getItem('boardViewer.selectedBoardId');
        const savedCategory = localStorage.getItem('boardViewer.boardCategory') as 'factory' | 'docking' | null;
        
        if (savedCategory) {
            setBoardCategory(savedCategory);
        }
        
        if (savedBoardId) {
            // Check if the saved board exists in the current category
            const validIds = savedCategory === 'docking' 
                ? DOCKING_BAY_BOARDS.map(b => b.id)
                : ALL_BOARD_DEFINITIONS.map(b => b.id);
            
            if (validIds.includes(savedBoardId)) {
                setSelectedBoardId(savedBoardId);
            } else {
                // Saved board not in category, select first
                setSelectedBoardId(validIds[0] || '');
            }
        } else if (boardIds.length > 0) {
            // No saved board, select first
            setSelectedBoardId(boardIds[0]);
        }
    }, []); // Only run once on mount

    // Save board selection to localStorage when it changes
    useEffect(() => {
        if (selectedBoardId) {
            localStorage.setItem('boardViewer.selectedBoardId', selectedBoardId);
        }
        localStorage.setItem('boardViewer.boardCategory', boardCategory);
    }, [selectedBoardId, boardCategory]);

    useEffect(() => {
        if (selectedBoardId) {
            try {
                let boardDef: BoardDefinition | undefined;

                if (boardCategory === 'factory') {
                    boardDef = getBoardDefinitionById(selectedBoardId);
                } else {
                    boardDef = DOCKING_BAY_BOARDS.find(b => b.id === selectedBoardId);
                }

                if (boardDef) {
                    setBoardDefinition(boardDef);
                    const builtBoard = buildBoard(boardDef);
                    setBoard(builtBoard);
                }
            } catch (error) {
                console.error('Error loading board:', error);
                setBoard(null);
                setBoardDefinition(null);
            }
        }
    }, [selectedBoardId, boardCategory]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-2">
            <div className="max-w-full">
                <h1 className="text-2xl font-bold mb-2">Board Viewer</h1>

                {/* Controls bar */}
                <div className="bg-gray-800 rounded-lg p-2 mb-2">
                    <div className="flex gap-2 items-center">
                        {/* Board Category */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Category:</label>
                            <select
                                value={boardCategory}
                                onChange={(e) => {
                                    setBoardCategory(e.target.value as 'factory' | 'docking');
                                    setSelectedBoardId(''); // Reset selection
                                }}
                                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            >
                                <option value="factory">Factory Floor</option>
                                <option value="docking">Docking Bay</option>
                            </select>
                        </div>

                        {/* Board Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Board:</label>
                            <select
                                value={selectedBoardId}
                                onChange={(e) => setSelectedBoardId(e.target.value)}
                                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            >
                                <option value="">Select a board...</option>
                                {boardIds.map(id => {
                                    const boardDef = boardCategory === 'factory'
                                        ? ALL_BOARD_DEFINITIONS.find(b => b.id === id)
                                        : DOCKING_BAY_BOARDS.find(b => b.id === id);
                                    return (
                                        <option key={id} value={id}>
                                            {boardDef?.name || id}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Board Info */}
                        {boardDefinition && (
                            <>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Size:</span>{' '}
                                    <span className="font-semibold">
                                        {boardDefinition.width}×{boardDefinition.height}
                                    </span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Starting Positions:</span>{' '}
                                    <span className="font-semibold">
                                        {boardDefinition.startingPositions.length}
                                    </span>
                                </div>
                                {boardDefinition.tiles && (
                                    <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                        <span className="text-gray-400">Special Tiles:</span>{' '}
                                        <span className="font-semibold">
                                            {boardDefinition.tiles.length}
                                        </span>
                                    </div>
                                )}
                                {boardDefinition.lasers && (
                                    <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                        <span className="text-gray-400">Lasers:</span>{' '}
                                        <span className="font-semibold">
                                            {boardDefinition.lasers.length}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Board Display */}
                {board ? (
                    <div className="flex justify-center overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                        <Board
                            board={board}
                            players={{}}
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        {selectedBoardId ? 'Loading board...' : 'Select a board to view'}
                    </div>
                )}
            </div>
        </div>
    );
}