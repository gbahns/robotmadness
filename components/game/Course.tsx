// components/game/Course.tsx
import React, { useEffect, useState } from 'react';
import { getCourseById } from '@/lib/game/boards/courses';
import { getBoardDefinitionById } from '@/lib/game/boards/factoryFloorBoards';
import { combineBoardsVertically } from '@/lib/game/boards/courses';
import { buildBoard } from '@/lib/game/boards/boardBuilder';
import { Board as BoardType, Player, Checkpoint } from '@/lib/game/types';
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
            const testCourse = getCourseById('test');
            const testBoard = getBoardDefinitionById('test');
            if (testBoard && testCourse) {
                const builtBoard = buildBoard(testBoard);
                // Override board checkpoints with course checkpoints
                builtBoard.checkpoints = testCourse.checkpoints;
                setBoard(builtBoard);
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
                // Single board course - build it and apply course checkpoints
                const builtBoard = buildBoard(boardDefs[0]!);
                builtBoard.checkpoints = courseData.checkpoints;
                setBoard(builtBoard);
            } else {
                // Multi-board course - combine them
                // Separate factory floors and docking bays
                const factoryFloors = boardDefs.filter(b => !b!.id.includes('docking'));
                const dockingBays = boardDefs.filter(b => b!.id.includes('docking'));

                // For Risky Exchange: combine factory floor (top) with docking bay (bottom)
                if (factoryFloors.length > 0 && dockingBays.length > 0) {
                    // combineBoardsVertically expects (topBoard, bottomBoard)
                    const combinedBoardDef = combineBoardsVertically(factoryFloors[0]!, dockingBays[0]!);
                    const builtBoard = buildBoard(combinedBoardDef);
                    // Apply course checkpoints to the combined board
                    builtBoard.checkpoints = courseData.checkpoints;
                    setBoard(builtBoard);
                } else {
                    // Fallback: just use the first board if we can't identify the types
                    console.warn('Could not identify factory floor and docking bay boards');
                    const builtBoard = buildBoard(boardDefs[0]!);
                    builtBoard.checkpoints = courseData.checkpoints;
                    setBoard(builtBoard);
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

    // Render the board with course-defined checkpoints
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