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
    selectableTiles?: Array<{x: number, y: number}>;
    onTileClick?: (x: number, y: number) => void;
    selectedTile?: {x: number, y: number};
}

export default function Course({
    courseId,
    players,
    currentPlayerId,
    isHost,
    gameState,
    activeLasers = [],
    selectableTiles,
    onTileClick,
    selectedTile
}: CourseProps) {
    const [course, setCourse] = useState<CourseType | null>(null);
    const [tileSize, setTileSize] = useState(50);
    const [ctrlKeyPressed, setCtrlKeyPressed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle Control key press/release for hiding flags
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                setCtrlKeyPressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey) {
                setCtrlKeyPressed(false);
            }
        };

        const handleBlur = () => {
            setCtrlKeyPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

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
        <div ref={containerRef} className="relative h-full w-full flex justify-center items-center">
            <div className="relative">
                {/* Board component renders the base board and manages tile size */}
                <BoardComponent
                    board={course.board}
                    players={players}
                    currentPlayerId={currentPlayerId}
                    activeLasers={activeLasers}
                    onTileSizeChange={handleTileSizeChange}
                    checkpoints={course.definition.checkpoints}
                    selectableTiles={selectableTiles}
                    onTileClick={onTileClick}
                    selectedTile={selectedTile}
                />

                {/* Checkpoint overlay - positioned absolutely over the board (flags hidden when Control is pressed) */}
                <CheckpointOverlay
                    checkpoints={course.definition.checkpoints}
                    boardWidth={course.board.width}
                    boardHeight={course.board.height}
                    tileSize={tileSize}
                    checkpointsCompleted={players[currentPlayerId || '']?.checkpointsVisited || 0}
                    hideFlagsOnly={ctrlKeyPressed}
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