// components/game/Course.tsx
import React, { useEffect, useState } from 'react';
import { getCourseById } from '@/lib/game/boards/courses';
import { getBoardById } from '@/lib/game/boards/factoryFloorBoards';
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
    const [boards, setBoards] = useState<BoardType[]>([]);
    const [course, setCourse] = useState<any>(null);

    useEffect(() => {
        // Handle special test board case
        if (courseId === 'test') {
            const testBoard = getBoardById('test');
            if (testBoard) {
                setBoards([testBoard]);
            }
            return;
        }

        // Get course and its boards
        const courseData = getCourseById(courseId);
        if (courseData) {
            setCourse(courseData);
            const courseBoards = courseData.boards
                .map(boardId => getBoardById(boardId))
                .filter((board): board is BoardType => board !== null);
            setBoards(courseBoards);
        }
    }, [courseId]);

    if (boards.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <p className="text-xl text-gray-300">
                        Loading course...
                    </p>
                </div>
            </div>
        );
    }

    // For single board courses, just render the board
    if (boards.length === 1) {
        return (
            <Board
                board={boards[0]}
                players={players}
                currentPlayerId={currentPlayerId}
                isHost={isHost}
                gameState={gameState}
                roomCode={roomCode}
                activeLasers={activeLasers}
            />
        );
    }

    // For multi-board courses, we need to handle the player positions
    // Players might be on different boards depending on their Y position
    const splitPlayersByBoard = (players: Record<string, Player>, boards: BoardType[]) => {
        const playersByBoard: Record<string, Player>[] = boards.map(() => ({}));

        // Calculate total height and board boundaries
        const boardHeights = boards.map(b => b.height);
        const boardYOffsets = boardHeights.reduce((acc, height, index) => {
            if (index === 0) return [0];
            return [...acc, acc[index - 1] + boardHeights[index - 1]];
        }, [] as number[]);

        // Assign players to boards based on their Y position
        Object.entries(players).forEach(([playerId, player]) => {
            // Find which board this player is on based on Y position
            let boardIndex = 0;
            for (let i = 0; i < boardYOffsets.length; i++) {
                if (player.position.y >= boardYOffsets[i]) {
                    boardIndex = i;
                }
            }

            // Adjust player position relative to their board
            const adjustedPlayer = {
                ...player,
                position: {
                    ...player.position,
                    y: player.position.y - boardYOffsets[boardIndex]
                }
            };

            playersByBoard[boardIndex][playerId] = adjustedPlayer;
        });

        return playersByBoard;
    };

    const playersByBoard = splitPlayersByBoard(players, boards);

    // Render multiple boards vertically (factory floor on top, docking bay on bottom)
    return (
        <div className="flex flex-col gap-0">
            {boards.map((board, index) => (
                <div key={index} className="relative">
                    {/* Optional board label */}
                    {boards.length > 1 && (
                        <div className="absolute top-0 left-0 z-10 bg-gray-900 bg-opacity-75 px-2 py-1 text-xs text-gray-400">
                            {index === 0 ? 'Factory Floor' : 'Docking Bay'}
                        </div>
                    )}
                    <Board
                        board={board}
                        players={playersByBoard[index]}
                        currentPlayerId={currentPlayerId}
                        isHost={isHost}
                        gameState={gameState}
                        roomCode={roomCode}
                        activeLasers={activeLasers}
                    />
                </div>
            ))}
        </div>
    );
}