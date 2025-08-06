// File: /components/game/ExecutionLog.tsx

'use client';

import React, { useEffect, useRef } from 'react';

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
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when new entries are added
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries]);

    const getColorClass = (type: string) => {
        switch (type) {
            case 'action':
                return 'text-blue-400';
            case 'damage':
                return 'text-red-400';
            case 'checkpoint':
                return 'text-green-400';
            case 'board-element':
                return 'text-yellow-400';
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
                return '🚩'; //🚩🏁
            case 'board-element':
                return '⚙️'; //🛠️🛠
            case 'geer':
                return '⚙️';
            case 'conveyor':
                return '➡️'; //➡️⬅️
            case 'pusher':
                return '🔄'; //🔄🔃
            case 'rotator':
                return '🔄'; //🔄🔃
            case 'express':
                return '🚀'; //🚀
            default:
                return '•';
        }
    };

    return (
        <div ref={scrollRef} className="bg-gray-800 rounded-lg p-4 h-[396px] overflow-y-auto">
            <div className="space-y-1">
                {entries.length === 0 ? (
                    <p className="text-gray-500 italic">No actions yet...</p>
                ) : (
                    entries.map((entry) => (
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