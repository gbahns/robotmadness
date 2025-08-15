// components/game/Course.tsx
import React, { useEffect, useState } from 'react';
import { getCourseById } from '@/lib/game/boards/courses';
import { getBoardDefinitionById } from '@/lib/game/boards/factoryFloorBoards';
import { combineBoardsVertically } from '@/lib/game/boards/courses';
import { buildBoard } from '@/lib/game/boards/boardBuilder';
import { Board as BoardType, Player } from '@/lib/game/types';
import Board from './Board';
import { RobotLaserShot } from './RobotLaserAnimation';

interface CourseProps {
    courseId: string;
    players: Record<string, Player>;
    currentPlayerId?: string;
    isHost?: boolean;
    gameState?: any;
    roomCode?: string;
    activeLasers?: RobotLaserShot[];
}

export default function Course({
    courseId,
    players,
    currentPlayerId,
    isHost,
    gameState,
    roomCode,
    activeLasers = []
}: CourseProps) {
    const [board, setBoard] = useState<BoardType | null>(null);
    const [courseName, setCourseName] = useState<string>('');

    useEffect(() => {
        // Handle special test board case
        if (courseId === 'test') {
            const testBoard = getBoardDefinitionById('test');
            if (testBoard) {
                setBoard(buildBoard(testBoard));
                setCourseName('Test Board');
            }
            return;
        }

        // Get course and its boards
        const courseData = getCourseById(courseId);
        if (courseData) {
            setCourseName(courseData.name);

            // Get all board definitions for this course
            const boardDefs = courseData.boards
                .map(boardId => getBoardDefinitionById(boardId))
                .filter(board => board !== undefined);

            if (boardDefs.length === 0) {
                console.error('No boards found for course:', courseId);
                return;
            }

            if (boardDefs.length === 1) {
                // Single board course - just build it
                setBoard(buildBoard(boardDefs[0]!));
            } else {
                // Multi-board course - combine them
                // For now, assume it's docking bay + factory floor
                // The course should specify board order, but we'll use a convention:
                // If board ID contains 'docking', it goes on bottom
                const sortedBoards = [...boardDefs].sort((a, b) => {
                    if (a!.id.includes('docking')) return 1;
                    if (b!.id.includes('docking')) return -1;
                    return 0;
                });

                // Combine the boards vertically
                const combinedBoardDef = sortedBoards.reduce((combined, boardDef) => {
                    if (!combined) return boardDef!;
                    return combineBoardsVertically(combined, boardDef!);
                });

                if (combinedBoardDef) {
                    setBoard(buildBoard(combinedBoardDef));
                }
            }
        }
    }, [courseId]);

    if (!board) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <p className="text-xl text-gray-300">
                        Loading course: {courseName || courseId}...
                    </p>
                </div>
            </div>
        );
    }

    // Render the board (either single or combined)
    return (
        <Board
            board={board}
            players={players}
            currentPlayerId={currentPlayerId}
            isHost={isHost}
            gameState={gameState}
            roomCode={roomCode}
            activeLasers={activeLasers}
        />
    );
}