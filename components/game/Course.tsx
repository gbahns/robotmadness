import React, { useEffect, useState, useRef } from 'react';
import { getCourseById, buildCourse } from '@/lib/game/courses/courses';
import { Course as CourseType, Player, GameState } from '@/lib/game/types';
import BoardComponent from './Board';
import CheckpointOverlay from './CheckpointOverlay';
import { RobotLaserShot } from './RobotLaserAnimation';

interface CourseProps {
    courseId: string;
    players: Record<string, Player>;
    currentPlayerId?: string;
    isHost?: boolean;
    gameState?: GameState;
    activeLasers?: RobotLaserShot[];
}

export default function Course({
    courseId,
    players,
    currentPlayerId,
    isHost,
    gameState,
    activeLasers = []
}: CourseProps) {
    const [course, setCourse] = useState<CourseType | null>(null);
    const [tileSize, setTileSize] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const courseDefinition = getCourseById(courseId);
        const builtCourse = buildCourse(courseDefinition);
        setCourse(builtCourse);
    }, [courseId]);

    // Remove the duplicate tile size calculation - let BoardComponent handle it
    // and use the onTileSizeChange callback to stay synchronized
    const handleTileSizeChange = (newTileSize: number) => {
        setTileSize(newTileSize);
    };

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

    return (
        //the white border is for debugging the board positioning and sizing; remove it later
        <div ref={containerRef} className="relative h-full w-full flex items-center justify-center" style={{ border: '2px solid white' }}>
            <div className="relative">
                {/* Board component renders the base board and manages tile size */}
                <BoardComponent
                    board={course.board}
                    players={players}
                    currentPlayerId={currentPlayerId}
                    activeLasers={activeLasers}
                    onTileSizeChange={handleTileSizeChange}
                    checkpoints={course.definition.checkpoints}
                />

                {/* Checkpoint overlay - positioned absolutely over the board */}
                <CheckpointOverlay
                    checkpoints={course.definition.checkpoints}
                    boardWidth={course.board.width}
                    boardHeight={course.board.height}
                    tileSize={tileSize}
                    checkpointsCompleted={players[currentPlayerId || '']?.checkpointsVisited || 0}

                />

                {/* Course info overlay */}
                {gameState?.phase === 'waiting' && isHost && (
                    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-90 p-2 rounded">
                        <p className="text-sm text-gray-300">
                            {course.definition.name}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}