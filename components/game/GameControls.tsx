import React, { useState, useEffect } from 'react';
import { socketClient } from '@/lib/socket';
import { Player } from '@/lib/game/types';
import { ALL_COURSES, getCourseById } from '@/lib/game/courses/courses';
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
  const [timerMode, setTimerMode] = useState<'players-submitted' | 'players-remaining'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timerMode');
      if (saved === 'players-submitted' || saved === 'players-remaining') {
        return saved;
      }
    }
    return 'players-submitted'; // Default to players-submitted
  });
  const [timerThreshold, setTimerThreshold] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timerThreshold');
      return saved ? Math.max(1, parseInt(saved)) : 1;
    }
    return 1;
  });
  const [timerDuration, setTimerDuration] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timerDuration');
      return saved ? Math.max(10, Math.min(120, parseInt(saved))) : 45; // Default to 45 seconds
    }
    return 45; // Default to 45 seconds
  });

  // Save timer settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerMode', timerMode);
    }
  }, [timerMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerThreshold', timerThreshold.toString());
    }
  }, [timerThreshold]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerDuration', timerDuration.toString());
    }
  }, [timerDuration]);

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
      // Check if this is a respawn scenario (not currently powered down) or regular power down decision
      const isRespawnScenario = currentPlayer.powerState !== 'OFF';

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
              {isRespawnScenario
                ? "You have respawned with 2 damage."
                : "Your robot is currently powered down."
              }
            </p>

            {/* Show current game status */}
            <div className="bg-gray-800 rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Damage:</span>
                <span className={`font-semibold ${currentPlayer.damage === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {currentPlayer.damage === 0 ? 'Fully Repaired' : `${currentPlayer.damage}/10`}
                </span>
              </div>
            </div>

            <p className="text-gray-300 text-sm">
              {isRespawnScenario
                ? "Would you like to enter powered down mode for safety, or continue playing normally?"
                : "Would you like to stay powered down for another turn to ensure safety, or power back on and rejoin the action?"
              }
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
              <span>{isRespawnScenario ? "Enter Powered Down" : "Stay Powered Down"}</span>
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
              <span>{isRespawnScenario ? "Enter Powered Up" : "Power Back On"}</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-3">
            {isRespawnScenario ? (
              <>
                <p>Enter powered down: Repair damage safely, skip programming next turn</p>
                <p>Continue normally: Program cards and play next turn with 2 damage</p>
              </>
            ) : (
              <>
                <p>Staying powered down: No damage from board elements, skip programming</p>
                <p>Powering back on: Resume normal play, program cards next turn</p>
              </>
            )}
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

      {/* Timer Configuration */}
      <div className="space-y-3 border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold">Timer Settings</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-white">
            <span>Timer expires</span>
            <input
              type="number"
              min="10"
              max="120"
              step="5"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Math.max(10, Math.min(120, parseInt(e.target.value) || 30)))}
              className="w-14 px-1 py-1 rounded bg-gray-700 text-white border border-gray-600 text-center text-sm"
            />
            <span>seconds after</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timer-mode-toggle"
              checked={timerMode === 'players-remaining'}
              onChange={(e) => setTimerMode(e.target.checked ? 'players-remaining' : 'players-submitted')}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="timer-mode-toggle" className="flex items-center gap-2 text-sm text-white">
              <input
                type="number"
                min="1"
                max={playerCount}
                value={timerThreshold}
                onChange={(e) => setTimerThreshold(Math.max(1, Math.min(playerCount, parseInt(e.target.value) || 1)))}
                className="w-12 px-1 py-1 rounded bg-gray-700 text-white border border-gray-600 text-center text-sm"
              />
              <span>
                {timerMode === 'players-remaining' 
                  ? (timerThreshold === 1 ? 'player is left to submit' : 'players are left to submit')
                  : (timerThreshold === 1 ? 'player has submitted' : 'players have submitted')
                }
              </span>
            </label>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-900 rounded p-2">
          Timer will start when {timerMode === 'players-remaining' 
            ? `only ${timerThreshold} player${timerThreshold === 1 ? ' hasn\'t' : 's haven\'t'}`
            : `${timerThreshold} player${timerThreshold === 1 ? ' has' : 's have'}`} submitted cards,
          giving {timerDuration} seconds to finish.
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={() => {
            console.log('Start game clicked ', { roomCode, selectedCourse, timerConfig: { mode: timerMode, threshold: timerThreshold, duration: timerDuration } });
            socketClient.emit('start-game', { 
              roomCode, 
              selectedCourse,
              timerConfig: {
                mode: timerMode,
                threshold: timerThreshold,
                duration: timerDuration
              }
            });
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
    </div >
  );
}
