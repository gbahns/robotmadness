import React, { useState } from 'react';
import { socketClient } from '@/lib/socket';
import { SAMPLE_BOARD, TEST_BOARD, RISKY_EXCHANGE_BOARD, RISKY_EXCHANGE_BOARD_CLAUDE_1, RISKY_EXCHANGE_BOARD_GEMINI, LASER_TEST_BOARD } from '@/boardConfig';

interface GameControlsProps {
  isHost: boolean;
  roomCode: string;
  playerCount: number;
  gameState: any; // Consider a more specific type if available
}

const availableCourses = [
  { id: 'TEST_BOARD', name: 'Test Board' },
  { id: 'SAMPLE_BOARD', name: 'Factory Floor' },
  { id: 'RISKY_EXCHANGE_BOARD', name: 'Risky Exchange' },
  { id: 'RISKY_EXCHANGE_BOARD_CLAUDE_1', name: 'Risky Exchange (Claude)' },
  { id: 'RISKY_EXCHANGE_BOARD_GEMINI', name: 'Risky Exchange (Gemini)' },
  { id: 'LASER_TEST_BOARD', name: 'Laser Test Arena' },
];

export default function GameControls({ isHost, roomCode, playerCount, gameState }: GameControlsProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>(availableCourses[0].id);

  const handleStartGame = () => {
    socketClient.startGame(roomCode, selectedCourse);
  };

  if (!isHost || gameState?.phase !== 'waiting') {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Waiting for host to start the game...</p>
      </div>
    );
  }

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
          {availableCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => {
          //this.emit(SocketEvent.START_GAME, { roomCode, selectedCourse });
          console.log('Start game clicked ', { roomCode, selectedCourse });
          socketClient.emit('start-game', { roomCode, selectedCourse });
          console.log('Emitted start_game event', { roomCode, selectedCourse });
        }}
        disabled={playerCount < 2}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded font-semibold text-lg"
      >
        Start Game
      </button>
      {/* <button
        onClick={handleStartGame}
        disabled={playerCount < 2}
        className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {playerCount < 2 ? 'Need at least 2 players' : 'Start Game'}
      </button> */}
      {playerCount < 2 && (
        <p className="text-sm text-gray-500">Need at least 2 players to start</p>
      )}
    </div>
  );
}