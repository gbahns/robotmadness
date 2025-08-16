import React, { useEffect, useState } from 'react';
import { getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { getBoardDefinitionById } from '@/lib/game/boards/factoryFloorBoards';
import { combineBoardsVertically } from '@/lib/game/boards/courses';
// import { buildBoard } from '@/lib/game/boards/boardBuilder';
import { Course as CourseType, CourseDefinition, BoardDefinition, Player, Checkpoint } from '@/lib/game/types';
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
    const [course, setBoard] = useState<CourseType | null>(null);
    const [courseName, setCourseName] = useState<string>('');

    useEffect(() => {
        // Handle special test board case
        if (courseId === 'test') {
            const testCourse = getCourseById('test');
            const testBoard = getBoardDefinitionById('test');
            if (testBoard && testCourse) {
                const builtBoard = buildCourse(testCourse);
                // Override board checkpoints with course checkpoints
                //builtBoard.checkpoints = testCourse.checkpoints;
                setBoard(builtBoard);
                setCourseName('Test Board');
            }
            return;
        }

        // Get course and its boards
        const courseDefinition = getCourseById(courseId);
        buildCourse(courseDefinition);

        // if (courseDefinition) {
        //     setCourseName(courseDefinition.name);

        //     // Get all board definitions for this course
        //     const boardDefs = courseDefinition.boards
        //         .map(boardId => getBoardDefinitionById(boardId))
        //         .filter(board => board !== undefined);

        //     if (boardDefs.length === 0) {
        //         console.error('No boards found for course:', courseId);
        //         return;
        //     }

        //     if (boardDefs.length === 1) {
        //         // Single board course - build it and apply course checkpoints
        //         const builtBoard = buildCourse(boardDefs[0]!);
        //         //builtBoard.checkpoints = courseData.checkpoints;
        //         setBoard(builtBoard);
        //     } else {
        //         // Multi-board course - combine them
        //         // Separate factory floors and docking bays
        //         const factoryFloors = boardDefs.filter(b => !b!.id.includes('docking'));
        //         const dockingBays = boardDefs.filter(b => b!.id.includes('docking'));

        //         // For Risky Exchange: combine factory floor (top) with docking bay (bottom)
        //         if (factoryFloors.length > 0 && dockingBays.length > 0) {
        //             // combineBoardsVertically expects (topBoard, bottomBoard)
        //             const combinedBoardDef = combineBoardsVertically(factoryFloors[0]!, dockingBays[0]!);
        //             const builtBoard = buildBoard(combinedBoardDef);
        //             // Apply course checkpoints to the combined board
        //             //builtBoard.checkpoints = courseData.checkpoints;
        //             setBoard(builtBoard);
        //         } else {
        //             // Fallback: just use the first board if we can't identify the types
        //             console.warn('Could not identify factory floor and docking bay boards');
        //             const builtBoard = buildBoard(boardDefs[0]!);
        //             //builtBoard.checkpoints = courseData.checkpoints;
        //             setBoard(builtBoard);
        //         }
        //     }
        // }
    }, [courseId]);

    if (!course) {
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
            course={course}
            //course={course}
            players={players}
            currentPlayerId={currentPlayerId}
            isHost={isHost}
            gameState={gameState}
            roomCode={roomCode}
            activeLasers={activeLasers}
        />
    );
}