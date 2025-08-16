import React from 'react';
import { getCourseById, buildCourse } from '@/lib/game/boards/courses';
import BoardPreview from './BoardPreview';

interface CoursePreviewProps {
    courseId: string;
    size?: number; // Size of the preview in pixels
}

export default function CoursePreview({ courseId, size = 300 }: CoursePreviewProps) {
    // Handle special case for test board
    if (courseId === 'test') {
        const testCourse = buildCourse(getCourseById('test'));
        return testCourse ? <BoardPreview course={testCourse} size={size} /> : null;
    }

    // Get course details
    const course = buildCourse(getCourseById(courseId));

    // For single board courses, just show the board
    // if (boards.length === 1) {
    //     return <BoardPreview board={boards[0]!} size={size} />;
    // }

    // For multi-board courses, show them stacked or side by side
    // Adjust size for multiple boards
    const boardSize = course.definition.boards.length > 2 ? size / 2 : size / course.definition.boards.length;

    return (
        <div className="space-y-2">
            <div className="text-xs text-gray-400 text-center mb-1">
                {course.definition.name} ({course.definition.boards.length} boards)
            </div>
            <div className={`flex ${course.definition.boards.length > 2 ? 'flex-wrap' : 'flex-col'} gap-2`}>
                {course.definition.boards.map((board, index) => (
                    <div key={index} className="relative">
                        <div className="text-xs text-gray-500 mb-1">
                            {index === 0 && course.definition.boards.length > 1 ? 'Factory Floor' :
                                index === course.definition.boards.length - 1 && course.definition.boards.length > 1 ? 'Docking Bay' :
                                    `Board ${index + 1}`}
                        </div>
                        <BoardPreview course={course} size={boardSize} />
                    </div>
                ))}
            </div>
        </div>
    );
}