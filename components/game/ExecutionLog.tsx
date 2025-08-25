'use client';

import React, { useEffect, useRef } from 'react';

interface LogEntry {
    id: number;
    message: string;
    type: 'info' | 'action' | 'damage' | 'checkpoint' | 'option';
    timestamp: Date;
}

interface ExecutionLogProps {
    entries: LogEntry[];
}

export default function ExecutionLog({ entries }: ExecutionLogProps) {
    let id = 0;
    const scrollRef = useRef<HTMLDivElement>(null);
    const previousHeightRef = useRef<number>(0);

    // Scroll to bottom helper function
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Auto-scroll to bottom when new entries are added
        if (scrollRef.current) {
            // Use setTimeout to ensure DOM has updated with new content
            setTimeout(() => {
                scrollToBottom();
            }, 0);
        }
    }, [entries]);

    useEffect(() => {
        // Watch for container resize and scroll to bottom when it gets smaller
        if (!scrollRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const currentHeight = entry.contentRect.height;
                
                // If height decreased (container got smaller), scroll to bottom
                if (previousHeightRef.current > 0 && currentHeight < previousHeightRef.current) {
                    setTimeout(() => {
                        scrollToBottom();
                    }, 0);
                }
                
                previousHeightRef.current = currentHeight;
            }
        });

        resizeObserver.observe(scrollRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

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
            case 'power-down':
                return 'text-orange-400';
            case 'option':
                return 'text-purple-400';
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
            case 'option':
                return '🛡️';
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
            case 'power-down':
                return '🛑' //⏳⚡⏸️ 💤 🔌
            default:
                return '•';
        }
    };

    return (
        <div ref={scrollRef} className="bg-gray-800 rounded-lg p-4 h-full overflow-y-auto scroll-smooth">
            <div className="space-y-1">
                {entries.length === 0 ? (
                    <p className="text-gray-500 italic">No actions yet...</p>
                ) : (
                    entries.map((entry) => (
                        <div
                            key={id++}
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