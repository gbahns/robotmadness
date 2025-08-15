import React from 'react';
import { getCourseById } from '@/lib/game/boards/courses';
import { getBoardById } from '@/lib/game/boards/factoryFloorBoards';
import BoardPreview from './BoardPreview';

interface CoursePreviewProps {
    courseId: string;
    size?: number; // Size of the preview in pixels
}

export default function CoursePreview({ courseId, size = 300 }: CoursePreviewProps) {
    // Handle special case for test board
    if (courseId === 'test') {
        const testBoard = getBoardById('test');
        return testBoard ? <BoardPreview board={testBoard} size={size} /> : null;
    }

    // Get course details
    const course = getCourseById(courseId);
    if (!course) {
        return (
            <div className="bg-gray-800 rounded p-4 text-center text-gray-500">
                Course not found
            </div>
        );
    }

    // Get all boards for this course
    const boards = course.boards.map(boardId => getBoardById(boardId)).filter(Boolean);

    if (boards.length === 0) {
        return (
            <div className="bg-gray-800 rounded p-4 text-center text-gray-500">
                No boards found for this course
            </div>
        );
    }

    // For single board courses, just show the board
    if (boards.length === 1) {
        return <BoardPreview board={boards[0]!} size={size} />;
    }

    // For multi-board courses, show them stacked or side by side
    // Adjust size for multiple boards
    const boardSize = course.boards.length > 2 ? size / 2 : size / boards.length;

    return (
        <div className="space-y-2">
            <div className="text-xs text-gray-400 text-center mb-1">
                {course.name} ({boards.length} boards)
            </div>
            <div className={`flex ${boards.length > 2 ? 'flex-wrap' : 'flex-col'} gap-2`}>
                {boards.map((board, index) => (
                    <div key={index} className="relative">
                        <div className="text-xs text-gray-500 mb-1">
                            {index === 0 && boards.length > 1 ? 'Factory Floor' :
                                index === boards.length - 1 && boards.length > 1 ? 'Docking Bay' :
                                    `Board ${index + 1}`}
                        </div>
                        <BoardPreview board={board!} size={boardSize} />
                    </div>
                ))}
            </div>
        </div>
    );
}