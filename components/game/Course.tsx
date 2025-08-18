import React, { useEffect, useState, useRef } from 'react';
import { getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { Course as CourseType, Player, Board } from '@/lib/game/types';
import BoardComponent from './Board';
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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const courseDefinition = getCourseById(courseId);
        const builtCourse = buildCourse(courseDefinition);
        setCourse(builtCourse);
    }, [courseId]);

    // Calculate tile size based on container
    useEffect(() => {
        const calculateTileSize = () => {
            if (!containerRef.current || !course) return;

            const container = containerRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // Calculate the maximum tile size that fits in the container
            const maxWidthTileSize = Math.floor(containerWidth / course.board.width);
            const maxHeightTileSize = Math.floor((containerHeight - 60) / course.board.height);

            // Use the smaller of the two, with better limits
            const newTileSize = Math.min(maxWidthTileSize, maxHeightTileSize, 100);
            setTileSize(Math.max(newTileSize, 50)); // Better minimum
        };

        calculateTileSize();
        window.addEventListener('resize', calculateTileSize);

        const resizeObserver = new ResizeObserver(calculateTileSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', calculateTileSize);
            resizeObserver.disconnect();
        };
    }, [course]);

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
        <div ref={containerRef} className="relative h-full w-full flex items-center justify-center">
            <div className="relative">
                {/* Board component renders the base board */}
                <BoardComponent
                    board={course.board}
                    players={players}
                    currentPlayerId={currentPlayerId}
                    activeLasers={activeLasers}
                    tileSize={tileSize}
                />

                {/* Checkpoint overlay - positioned absolutely over the board */}
                <CheckpointOverlay
                    checkpoints={course.definition.checkpoints}
                    boardWidth={course.board.width}
                    boardHeight={course.board.height}
                    tileSize={tileSize}
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