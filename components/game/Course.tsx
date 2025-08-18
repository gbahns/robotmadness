import React, { useEffect, useState } from 'react';
import { getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { Course as CourseType, Player } from '@/lib/game/types';
import Board from './Board';  // Rename import to avoid naming conflict
import CheckpointOverlay from './CheckpointOverlay';
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
    const [course, setCourse] = useState<CourseType | null>(null);
    const [tileSize, setTileSize] = useState(50);

    useEffect(() => {
        const courseDefinition = getCourseById(courseId);
        const builtCourse = buildCourse(courseDefinition);
        setCourse(builtCourse);
    }, [courseId]);

    if (!course) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <p className="text-xl text-gray-300">
                        Loading course: {courseId}...
                    </p>
                </div>
            </div>
        );
    }

    const handleTileSizeChange = (newTileSize: number) => {
        setTileSize(newTileSize);
    };

    return (
        <div className="relative">
            {/* Board component renders the base board */}
            <Board
                board={course.board}  // board is already Board type
                players={players}
                currentPlayerId={currentPlayerId}
                activeLasers={activeLasers}
                onTileSizeChange={handleTileSizeChange}
            />

            {/* Checkpoint overlay - positioned absolutely over the board */}
            <CheckpointOverlay
                checkpoints={course.definition.checkpoints}
                boardWidth={course.board.width}
                boardHeight={course.board.height}
                tileSize={tileSize}
            />

            {/* Course-specific controls or information could go here */}
            {gameState?.phase === 'waiting' && isHost && (
                <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-90 p-2 rounded">
                    <p className="text-sm text-gray-300">
                        {course.definition.name}
                    </p>
                </div>
            )}
        </div>
    );
}
