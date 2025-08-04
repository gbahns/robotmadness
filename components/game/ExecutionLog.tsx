// File: /components/game/ExecutionLog.tsx

'use client';

import React from 'react';

interface LogEntry {
    id: number;
    message: string;
    type: 'info' | 'action' | 'damage' | 'checkpoint';
    timestamp: Date;
}

interface ExecutionLogProps {
    entries: LogEntry[];
}

export default function ExecutionLog({ entries }: ExecutionLogProps) {
    const getColorClass = (type: string) => {
        switch (type) {
            case 'action':
                return 'text-blue-400';
            case 'damage':
                return 'text-red-400';
            case 'checkpoint':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'action':
                return '▶';
            case 'damage':
                return '⚠';
            case 'checkpoint':
                return '🏁';
            default:
                return '•';
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 h-99overflow-y-auto">
            {/* <h3 className="text-lg font-bold mb-2 text-white">Game Log</h3> */}
            <div className="space-y-1">
                {entries.length === 0 ? (
                    <p className="text-gray-500 italic">No actions yet...</p>
                ) : (
                    entries
                        .slice()
                        .reverse()
                        .map((entry) => (
                            <div
                                key={entry.id}
                                className={`text-sm ${getColorClass(entry.type)} flex items-start gap-2`}
                            >
                                <span className="flex-shrink-0">{getIcon(entry.type)}</span>
                                <span className="break-words">{entry.message}</span>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}