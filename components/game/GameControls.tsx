import React, { useState } from 'react';
import { socketClient } from '@/lib/socket';
import { getBoardById, TEST_BOARD } from '@/lib/game/boards/factoryFloorBoards';
import BoardPreview from './BoardPreview';
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
}

export default function GameControls({ isHost, roomCode, playerCount, currentPlayer, gameState, selectedCourse: externalSelectedCourse, onCourseChange }: GameControlsProps) {
  const [internalSelectedCourse, setInternalSelectedCourse] = useState<string>('test');

  // Use external course if provided, otherwise use internal state
  const selectedCourse = externalSelectedCourse || internalSelectedCourse;
  const setSelectedCourse = (courseId: string, fromSocket = false) => {
    setInternalSelectedCourse(courseId);
    onCourseChange?.(courseId);

    // Only emit course selection to server if host and not from socket event
    if (isHost && !fromSocket) {
      socketClient.emit('select-board', { roomCode, boardId: courseId });
    }
  };

  if (!isHost || gameState?.phase !== 'waiting') {
    // Show selected course info for non-hosts in waiting phase
    if (gameState?.phase === 'waiting' && selectedCourse) {
      //const courseInfo = ALL_COURSES.find(c => c.boards.some(b => b === selectedCourse));
      //const boardName = selectedCourse === 'test' ? 'Test Board' : courseInfo?.name || 'Unknown Board';
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
    else if (currentPlayer && gameState) {
      return (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">What the fuck</p>
          <PowerDownButton
            roomCode={gameState.roomCode}
            playerId={currentPlayer.id}
            selectedCards={currentPlayer.selectedCards}
            powerState={currentPlayer.powerState}
            damage={currentPlayer.damage}
            disabled={currentPlayer.isDead || currentPlayer.lives <= 0}
            isProgrammingPhase={gameState.phase === 'programming'}
          />
        </div>
      )
    }
  }

  // Find the selected course details
  const courseInfo = getCourseById(selectedCourse);
  //const selectedBoard = courseInfo ? getBoardById(courseInfo.boards[0]) : getBoardById('test');

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
