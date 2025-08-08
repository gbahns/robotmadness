import React, { useState } from 'react';
import { socketClient } from '@/lib/socket';
import { ALL_COURSES, getBoardById, TEST_BOARD } from '@/lib/game/boards/boardDefinitions';
import BoardPreview from './BoardPreview';

interface GameControlsProps {
  isHost: boolean;
  roomCode: string;
  playerCount: number;
  gameState: any;
  selectedCourse?: string;
  onCourseChange?: (courseId: string) => void;
}

// Build available courses from our board definitions
const availableCourses = [
  { id: 'test', name: 'Test Board' },
  ...ALL_COURSES.map(course => ({
    id: course.boards[0].id, // Use the first board in each course
    name: course.name,
    description: course.description,
    difficulty: course.difficulty,
    playerRange: `${course.minPlayers}-${course.maxPlayers} players`
  }))
];

export default function GameControls({ isHost, roomCode, playerCount, gameState, selectedCourse: externalSelectedCourse, onCourseChange }: GameControlsProps) {
  const [internalSelectedCourse, setInternalSelectedCourse] = useState<string>('test');

  // Use external course if provided, otherwise use internal state
  const selectedCourse = externalSelectedCourse || internalSelectedCourse;
  const setSelectedCourse = (courseId: string, fromSocket = false) => {
    setInternalSelectedCourse(courseId);
    onCourseChange?.(courseId);

    // Only emit board selection to server if host and not from socket event
    if (isHost && !fromSocket) {
      socketClient.emit('select-board', { roomCode, boardId: courseId });
    }
  };

  if (!isHost || gameState?.phase !== 'waiting') {
    // Show selected board info for non-hosts in waiting phase
    if (gameState?.phase === 'waiting' && selectedCourse) {
      const courseInfo = ALL_COURSES.find(c => c.boards.some(b => b.id === selectedCourse));
      const boardName = selectedCourse === 'test' ? 'Test Board' : courseInfo?.name || 'Unknown Board';

      return (
        <div className="bg-gray-800 rounded-lg p-6 text-center space-y-2">
          <p className="text-gray-400">Waiting for host to start the game...</p>
          <p className="text-sm text-gray-500">
            Selected course: <span className="text-white font-semibold">{boardName}</span>
          </p>
          {courseInfo && (
            <p className="text-xs text-gray-600">{courseInfo.description}</p>
          )}
        </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Waiting for host to start the game...</p>
      </div>
    );
  }

  // Find the selected course details
  const selectedBoard = getBoardById(selectedCourse) || TEST_BOARD;
  const courseInfo = ALL_COURSES.find(c => c.boards.some(b => b.id === selectedCourse));

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex flex-col">
        <label htmlFor="course-select" className="text-xl font-semibold mb-1">Course:</label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
        >
          <option value="test">Test Board</option>
          <optgroup label="Beginner Courses">
            {ALL_COURSES.filter(c => c.difficulty === 'beginner').map(course => (
              <option key={course.boards[0].id} value={course.boards[0].id}>
                {course.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Show course details */}
        {selectedCourse !== 'test' && courseInfo && (
          <div className="mt-2 text-sm text-gray-400">
            <p>{courseInfo.description}</p>
            <p className="text-xs mt-1">
              {courseInfo.minPlayers}-{courseInfo.maxPlayers} players •
              {' '}{courseInfo.boards[0].checkpoints.length} checkpoints
            </p>
          </div>
        )}
      </div>

      {/* Board Preview */}
      {selectedBoard && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Board Preview:</h3>
          <BoardPreview board={selectedBoard} size={250} />
        </div>
      )}

      <button
        onClick={() => {
          console.log('Start game clicked ', { roomCode, selectedCourse });
          socketClient.emit('start-game', { roomCode, selectedCourse });
          console.log('Emitted start_game event', { roomCode, selectedCourse });
        }}
        disabled={playerCount < 2}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded font-semibold text-lg"
      >
        Start Game
      </button>

      {playerCount < 2 && (
        <p className="text-sm text-gray-500">Need at least 2 players to start</p>
      )}
    </div>
  );
}
