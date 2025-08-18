'use client';

import React, { useState, useEffect } from 'react';
import { ALL_COURSES, getCourseById, buildCourse } from '@/lib/game/boards/courses';
import { Course as CourseType } from '@/lib/game/types';
import Board from '@/components/game/Board';

export default function BoardViewerPage() {
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
                <h1 className="text-2xl font-bold mb-2">Board Viewer</h1>

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
                                className="px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                            >
                                <option value="">-- Select --</option>
                                <option value="test">Test Course</option>
                                <optgroup label="Beginner">
                                    {ALL_COURSES.filter(c => c.difficulty === 'beginner').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Intermediate">
                                    {ALL_COURSES.filter(c => c.difficulty === 'intermediate').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Expert">
                                    {ALL_COURSES.filter(c => c.difficulty === 'expert').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Course Info - all in one line */}
                        {course && (
                            <>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Size:</span>{' '}
                                    <span className="font-semibold">{course.board.width}×{course.board.height}</span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Checkpoints:</span>{' '}
                                    <span className="font-semibold">{course.definition.checkpoints.length}</span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm">
                                    <span className="text-gray-400">Start Pos:</span>{' '}
                                    <span className="font-semibold">{course.board.startingPositions.length}</span>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-sm flex-1">
                                    <span className="text-gray-400">Name:</span>{' '}
                                    <span className="font-semibold">{course.definition.name}</span>
                                </div>
                                <button
                                    onClick={() => setShowDebug(!showDebug)}
                                    className="ml-auto px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                                >
                                    {showDebug ? 'Hide' : 'Show'} Debug
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Board Display - No container, full width */}
                {course ? (
                    <div className="flex justify-center overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                        <Board
                            course={course}
                            players={{}}
                            gameState={{ phase: 'waiting' }}
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        {selectedCourseId ? 'Loading course...' : 'Select a course to preview'}
                    </div>
                )}

                {/* Collapsible Debug Info */}
                {course && showDebug && (
                    <div className="bg-gray-800 rounded-lg p-3 mt-2">
                        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <h3 className="font-medium mb-1 text-sm">Checkpoints</h3>
                                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(course.definition.checkpoints, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <h3 className="font-medium mb-1 text-sm">Starting Positions</h3>
                                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(course.board.startingPositions, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <h3 className="font-medium mb-1 text-sm">Special Tiles Count</h3>
                                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify({
                                        conveyors: course.board.tiles?.flat().filter(t => t.type === 'conveyor').length || 0,
                                        express: course.board.tiles?.flat().filter(t => t.type === 'express').length || 0,
                                        gear_cw: course.board.tiles?.flat().filter(t => t.type === 'gear_cw').length || 0,
                                        gear_ccw: course.board.tiles?.flat().filter(t => t.type === 'gear_ccw').length || 0,
                                        pits: course.board.tiles?.flat().filter(t => t.type === 'pit').length || 0,
                                        repairs: course.board.tiles?.flat().filter(t => t.type === 'repair').length || 0,
                                        lasers: course.board.lasers?.length || 0,
                                        walls: course.board.walls?.length || 0
                                    }, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}