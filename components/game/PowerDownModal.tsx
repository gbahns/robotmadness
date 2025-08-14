import React from 'react';
import { socketClient } from '@/lib/socket';

interface PowerDownModalProps {
    isOpen: boolean;
    roomCode: string;
    playerId: string;
    playerName: string;
    onClose: () => void;
}

export default function PowerDownModal({
    isOpen,
    roomCode,
    playerId,
    playerName,
    onClose
}: PowerDownModalProps) {

    if (!isOpen) return null;

    const handleContinuePowerDown = () => {
        console.log(`${playerName} chooses to stay powered down`);
        socketClient.emit('continue-power-down', { roomCode, playerId, continueDown: true });
        onClose();
    };

    const handlePowerUp = () => {
        console.log(`${playerName} chooses to power back on`);
        socketClient.emit('continue-power-down', { roomCode, playerId, continueDown: false });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-yellow-500">
                <div className="flex items-center mb-4">
                    <svg className="w-8 h-8 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Power Down Status</h2>
                </div>

                <div className="mb-6">
                    <p className="text-gray-300 mb-4">
                        Your robot is currently powered down and has repaired all damage.
                    </p>
                    <p className="text-gray-300">
                        Would you like to stay powered down for another turn to ensure full repairs,
                        or power back on and rejoin the action?
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleContinuePowerDown}
                        className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg 
                                 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Stay Powered Down
                    </button>

                    <button
                        onClick={handlePowerUp}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg 
                                 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Power Back On
                    </button>
                </div>

                <div className="mt-4 text-sm text-gray-400 text-center">
                    <p>Staying powered down: Skip turn, repair any new damage</p>
                    <p>Powering back on: Resume normal play next turn</p>
                </div>
            </div>
        </div>
    );
}