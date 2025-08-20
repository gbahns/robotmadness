'use client';

import React, { useState, useEffect } from 'react';
import { ALL_COURSES, getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { Course as CourseType } from '@/lib/game/types';
import Course from '@/components/game/Course';  // Changed from Board to Course component

export default function CourseViewerPage() {  // Renamed from BoardViewerPage
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [course, setCourse] = useState<CourseType | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Get all course IDs from ALL_COURSES
    const courseIds = ALL_COURSES.map(course => course.id);

    useEffect(() => {
        // Select the first course by default
        if (courseIds.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courseIds[0]);
        }
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            try {
                const courseDefinition = getCourseById(selectedCourseId);
                const builtCourse = buildCourse(courseDefinition);
                setCourse(builtCourse);
            } catch (error) {
                console.error('Error loading course:', error);
                setCourse(null);
            }
        }
    }, [selectedCourseId]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-2">
            <div className="max-w-full">
                <h1 className="text-2xl font-bold mb-2">Course Viewer</h1>  {/* Updated title */}

                {/* Compact controls bar */}
                <div className="bg-gray-800 rounded-lg p-2 mb-2">
                    <div className="flex gap-2 items-center">
                        {/* Course Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                                Course:
                            </label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            >
                                <option value="">Select a course...</option>
                                {courseIds.map(id => (
                                    <option key={id} value={id}>
                                        {ALL_COURSES.find(c => c.id === id)?.name || id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Course Info */}
                        {course && (
                            <>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Boards:</span>{' '}
                                    <span className="font-semibold">{course.definition.boards.length}</span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Size:</span>{' '}
                                    <span className="font-semibold">{course.board.width}×{course.board.height}</span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Checkpoints:</span>{' '}
                                    <span className="font-semibold">{course.definition.checkpoints.length}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Course Display */}
                {course ? (
                    <div className="flex justify-center overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                        <Course
                            courseId={selectedCourseId}
                            players={{}}
                            gameState={{ phase: 'viewing' }}
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        {selectedCourseId ? 'Loading course...' : 'Select a course to view'}
                    </div>
                )}
            </div>
        </div>
    );
}