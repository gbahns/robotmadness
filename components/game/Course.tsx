import React, { useEffect, useState } from 'react';
import { getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { getBoardDefinitionById } from '@/lib/game/boards/factoryFloorBoards';
import { Course as CourseType, Player } from '@/lib/game/types';
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
                setBoard(builtBoard);
                setCourseName('Test Board');
            }
            return;
        }

        // Get course and its boards
        const courseDefinition = getCourseById(courseId);
        const course = buildCourse(courseDefinition);
        setBoard(course);

        console.log('Course built and set:', courseDefinition.name, 'Board size:', course.board.width, 'x', course.board.height);
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
            players={players}
            currentPlayerId={currentPlayerId}
            isHost={isHost}
            gameState={gameState}
            roomCode={roomCode}
            activeLasers={activeLasers}
        />
    );
}