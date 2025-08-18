import React, { useState } from 'react';
import { socketClient } from '@/lib/socket';
import PowerDownButton from './PowerDownButton';
import { Player } from '@/lib/game/types';
import { ALL_COURSES, getCourseById } from '@/lib/game/boards/courses';
import CoursePreview from './CoursePreview';

interface GameControlsProps {
  isHost: boolean;
  roomCode: string;
  playerCount: number;
  currentPlayer?: Player;
  gameState: any;
  selectedCourse?: string;
  onCourseChange?: (courseId: string) => void;
  showPowerDownPrompt?: boolean;
  onPowerDownDecision?: (continueDown: boolean) => void;
}

export default function GameControls({
  isHost,
  roomCode,
  playerCount,
  currentPlayer,
  gameState,
  selectedCourse: externalSelectedCourse,
  onCourseChange,
  showPowerDownPrompt,
  onPowerDownDecision
}: GameControlsProps) {
  const [internalSelectedCourse, setInternalSelectedCourse] = useState<string>('test');

  // Use external course if provided, otherwise use internal state
  const selectedCourse = externalSelectedCourse || internalSelectedCourse;
  const setSelectedCourse = (courseId: string, fromSocket = false) => {
    setInternalSelectedCourse(courseId);
    onCourseChange?.(courseId);

    // Only emit course selection to server if host and not from socket event
    if (isHost && !fromSocket) {
      socketClient.emit('select-course', { roomCode, courseId });
    }
  };

  if (!isHost || gameState?.phase !== 'waiting') {
    // Show selected course info for non-hosts in waiting phase
    if (gameState?.phase === 'waiting' && selectedCourse) {
      const courseInfo = getCourseById(selectedCourse);
      const courseName = selectedCourse === 'test' ? 'Test Course' : courseInfo?.name || 'Unknown Course';

      return (
        <div className="bg-gray-800 rounded-lg p-6 text-center space-y-2">
          <p className="text-gray-400">Waiting for host to start the game...</p>
          <p className="text-sm text-gray-500">
            Selected course: <span className="text-white font-semibold">{courseName}</span>
          </p>
          {courseInfo && (
            <p className="text-xs text-gray-600">{courseInfo.description}</p>
          )}
        </div>
      );
    }
    if (gameState?.phase === 'waiting') {
      return (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">Waiting for host to start the game...</p>
        </div>
      );
    }
    // Show power down prompt when needed
    if (showPowerDownPrompt && currentPlayer && onPowerDownDecision) {
      return (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-bold text-white">Power Down Decision</h3>
          </div>

          <div className="bg-gray-700 rounded p-4 space-y-3">
            <p className="text-gray-300">
              Your robot is currently powered down and has repaired all damage.
            </p>

            {/* Show current game status */}
            <div className="bg-gray-800 rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Status:</span>
                <span className="text-green-400 font-semibold">Fully Repaired</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lives Remaining:</span>
                <span className="text-white font-semibold">{currentPlayer.lives}/3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Checkpoints Reached:</span>
                <span className="text-white font-semibold">{currentPlayer.checkpointsVisited || 0}</span>
              </div>
              {currentPlayer.position && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Position:</span>
                  <span className="text-white font-semibold">
                    ({currentPlayer.position.x}, {currentPlayer.position.y})
                  </span>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-sm">
              Would you like to stay powered down for another turn to ensure safety,
              or power back on and rejoin the action?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onPowerDownDecision(true)}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg 
                   transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Stay Powered Down</span>
              <span className="text-xs opacity-90">Skip turn, stay safe</span>
            </button>

            <button
              onClick={() => onPowerDownDecision(false)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg 
                   transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Power Back On</span>
              <span className="text-xs opacity-90">Resume playing</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-3">
            <p>Staying powered down: No damage from board elements, skip programming</p>
            <p>Powering back on: Resume normal play, program cards next turn</p>
          </div>
        </div>
      );
    }
  }

  // Find the selected course details
  const courseInfo = getCourseById(selectedCourse);

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
          <option value="test">Test Course</option>
          <optgroup label="Beginner Courses">
            {ALL_COURSES.filter(c => c.difficulty === 'beginner').map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Intermediate Courses">
            {ALL_COURSES.filter(c => c.difficulty === 'intermediate').map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Expert Courses">
            {ALL_COURSES.filter(c => c.difficulty === 'expert').map(course => (
              <option key={course.id} value={course.id}>
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
              {/* {' '}{courseInfo.boards[0].checkpoints.length} checkpoints */}
            </p>
          </div>
        )}
      </div>

      {/* Course Preview */}
      {selectedCourse && (
        < div className="mt-4">
          <CoursePreview courseId={selectedCourse} size={250} />
        </div>
      )
      }

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

      {
        playerCount < 2 && (
          <p className="text-sm text-gray-500">Need at least 2 players to start</p>
        )
      }
    </div >
  );
}
