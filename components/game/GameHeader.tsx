import React from 'react';
import Link from 'next/link';
import { socketClient } from '@/lib/socket';

interface GameHeaderProps {
    roomCode: string;
    onLeaveGame: () => void;
    isHost?: boolean;
}

export default function GameHeader({ roomCode, onLeaveGame, isHost }: GameHeaderProps) {
    const handleDealOptionCards = () => {
        socketClient.emit('deal-option-cards-to-all', { roomCode });
    };
    return (
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">RobotMadness</h1>
                <Link href="/" className="text-blue-400 hover:underline text-sm">
                    &larr; Back to Home
                </Link>
            </div>
            <div className="flex items-center gap-6">
                {isHost && (
                    <button
                        onClick={handleDealOptionCards}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs font-semibold"
                        title="Deal 1 random option card to each player (dev/test)"
                    >
                        +1 Option Card (All)
                    </button>
                )}
                <div className="text-right">
                    <p className="text-sm text-gray-400">Room Code</p>
                    <p className="text-2xl font-mono font-bold text-yellow-400">{roomCode}</p>
                </div>
                <button
                    onClick={onLeaveGame}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
                >
                    Leave Game
                </button>
            </div>
        </div>
    );
}