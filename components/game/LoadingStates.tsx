import React from 'react';
import Link from 'next/link';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = "Loading game..." }: LoadingScreenProps) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-2xl">{message}</div>
        </div>
    );
}

interface NameModalProps {
    roomCode: string;
    playerName: string;
    onNameChange: (name: string) => void;
    onJoinGame: () => void;
}

export function NameModal({ roomCode, playerName, onNameChange, onJoinGame }: NameModalProps) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Join Game</h2>
                <p className="text-gray-400 mb-4">Room Code: <span className="font-mono text-yellow-400">{roomCode}</span></p>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => onNameChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onJoinGame()}
                    className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
                    autoFocus
                />
                <button
                    onClick={onJoinGame}
                    disabled={!playerName.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Join Game
                </button>
            </div>
        </div>
    );
}

interface ErrorScreenProps {
    error: string;
}

export function ErrorScreen({ error }: ErrorScreenProps) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl text-red-500 mb-4">Error</h2>
                <p>{error}</p>
                <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}

interface GameOverModalProps {
    winner: string;
    onBackToHome: () => void;
}

export function GameOverModal({ winner, onBackToHome }: GameOverModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <h2 className="text-4xl font-bold text-yellow-400 mb-4">Game Over!</h2>
                <p className="text-2xl mb-6">Winner: <span className="font-bold text-white">{winner}</span></p>
                <button
                    onClick={onBackToHome}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-lg font-semibold"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}