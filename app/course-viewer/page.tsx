'use client';

import React, { useState, useEffect } from 'react';
import { ALL_COURSES, getCourseById, buildCourse } from '@/lib/game/courses/courses';
import { Course as CourseType } from '@/lib/game/types';
import Course from '@/components/game/Course';  // Changed from Board to Course component
import ErrorBoundary from '@/components/ErrorBoundary';

export default function CourseViewerPage() {  // Renamed from BoardViewerPage
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [course, setCourse] = useState<CourseType | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);


    // Load saved course selection from localStorage on mount
    useEffect(() => {
        const savedCourseId = localStorage.getItem('courseViewer.selectedCourseId');
        const allCourseIds = ALL_COURSES.map(course => course.id);
        
        if (savedCourseId && allCourseIds.includes(savedCourseId)) {
            setSelectedCourseId(savedCourseId);
        } else if (allCourseIds.length > 0) {
            // No saved course or invalid, select first
            setSelectedCourseId(allCourseIds[0]);
        }
    }, []); // Only run once on mount

    // Save course selection to localStorage when it changes
    useEffect(() => {
        if (selectedCourseId) {
            localStorage.setItem('courseViewer.selectedCourseId', selectedCourseId);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        if (selectedCourseId) {
            try {
                setLoadError(null);
                const courseDefinition = getCourseById(selectedCourseId);
                const builtCourse = buildCourse(courseDefinition);
                setCourse(builtCourse);
            } catch (error) {
                console.error('Error loading course:', error);
                setCourse(null);
                
                // Extract error message
                let errorMessage = 'Failed to load course';
                if (error instanceof Error) {
                    errorMessage = error.message;
                    
                    // Provide more helpful messages for common errors
                    if (error.message.includes('No valid boards found')) {
                        const boardIds = getCourseById(selectedCourseId).boards.join(', ');
                        errorMessage = `Missing board definitions: ${boardIds}. These boards may not be implemented yet.`;
                    }
                }
                setLoadError(errorMessage);
            }
        } else {
            setLoadError(null);
            setCourse(null);
        }
    }, [selectedCourseId]);

    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <div className="min-h-screen bg-gray-900 text-white p-4">
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 max-w-2xl mx-auto mt-8">
                        <h2 className="text-red-400 font-semibold text-lg mb-2">Error Loading Course</h2>
                        <p className="text-gray-300 text-sm mb-4">{error.message}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedCourseId('');
                                    setCourse(null);
                                    setLoadError(null);
                                    reset();
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                                Reset Viewer
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        >
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
                                <optgroup label="Beginner Courses">
                                    {ALL_COURSES.filter(c => c.difficulty === 'beginner' && c.id !== 'test').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Intermediate Courses">
                                    {ALL_COURSES.filter(c => c.difficulty === 'intermediate' && c.id !== 'test').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Hard Courses">
                                    {ALL_COURSES.filter(c => c.difficulty === 'hard' && c.id !== 'test').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Expert Courses">
                                    {ALL_COURSES.filter(c => c.difficulty === 'expert' && c.id !== 'test').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Test Courses">
                                    {ALL_COURSES.filter(c => c.id === 'test').map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </optgroup>
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
                {loadError ? (
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-red-400 font-semibold mb-1">Error Loading Course</h3>
                                <p className="text-gray-300 text-sm">{loadError}</p>
                            </div>
                        </div>
                    </div>
                ) : course ? (
                    <div className="flex-1 flex justify-center items-center overflow-auto h-full" style={{ height: 'calc(100vh - 120px)' }}>
                        <Course
                            courseId={selectedCourseId}
                            players={{}}
                            gameState={undefined}
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        {selectedCourseId ? 'Loading course...' : 'Select a course to view'}
                    </div>
                )}
                </div>
            </div>
        </ErrorBoundary>
    );
}