// components/BoardSelector.tsx

import React from 'react';
import { ALL_COURSES, CourseDefinition } from '@/lib/game/boards/factoryFloorBoards';

interface BoardSelectorProps {
    selectedBoardId: string;
    onSelectBoard: (boardId: string) => void;
}

export default function BoardSelector({ selectedBoardId, onSelectBoard }: BoardSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Select a Course</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Test Board Option */}
                <button
                    onClick={() => onSelectBoard('test')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedBoardId === 'test'
                        ? 'border-green-500 bg-gray-800'
                        : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                        }`}
                >
                    <h4 className="font-semibold text-white">Test Board</h4>
                    <p className="text-sm text-gray-400 mt-1">Simple board for testing</p>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>2-8 players</span>
                        <span className="mx-2">•</span>
                        <span>3 checkpoints</span>
                    </div>
                </button>

                {/* Course Options */}
                {ALL_COURSES.map((course) => {
                    // For now, we'll use the first board in each course
                    const board = course.boards[0];
                    return (
                        <button
                            key={course.id}
                            onClick={() => onSelectBoard(board)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${selectedBoardId === board
                                ? 'border-green-500 bg-gray-800'
                                : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                                }`}
                        >
                            <h4 className="font-semibold text-white">{course.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{course.description}</p>
                            <div className="mt-2 text-xs text-gray-500">
                                <span className={`inline-block px-2 py-1 rounded ${course.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                                    course.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                        'bg-red-900 text-red-300'
                                    }`}>
                                    {course.difficulty}
                                </span>
                                <span className="mx-2">•</span>
                                <span>{course.minPlayers}-{course.maxPlayers} players</span>
                                <span className="mx-2">•</span>
                                {/* <span>{board.checkpoints.length} checkpoints</span> */}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Selected Board Details</h4>
                {selectedBoardId && (() => {
                    const course = ALL_COURSES.find(c => c.boards.some(b => b === selectedBoardId));
                    const board = course?.boards.find(b => b === selectedBoardId);

                    if (!board && selectedBoardId !== 'test') return null;

                    return (
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Board: {selectedBoardId === 'test' ? 'Test Board' : course?.name}</p>
                            <p>Size: 12×12</p>
                            {/* <p>Checkpoints: {selectedBoardId === 'test' ? '3' : board?.checkpoints.length}</p>
                            <p>Starting Positions: {selectedBoardId === 'test' ? '8' : board?.startingPositions.length}</p> */}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}