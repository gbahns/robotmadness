// components/game/Card.tsx

import React from 'react';
import { ProgramCard, CardType } from '@/lib/game/types';
import { CARD_DISPLAY } from '@/lib/game/constants';
import { useDrag } from 'react-dnd';

interface CardProps {
  card: ProgramCard | null;
  index?: number;
  isLocked?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onClick?: () => void;
}

export const CARD_TYPE = 'PROGRAM_CARD';

export interface DragItem {
  card: ProgramCard;
  index: number;
  source: 'hand' | 'register';
}

export default function Card({
  card,
  index = 0,
  isLocked = false,
  isSelected = false,
  isDraggable = true,
  onClick
}: CardProps) {
  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
    type: CARD_TYPE,
    item: (): DragItem | null => {
      if (!card || !isDraggable || isLocked) return null;
      return { card, index, source: 'hand' };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => !!card && isDraggable && !isLocked,
  }), [card, index, isDraggable, isLocked]);

  if (!card) {
    return (
      <div className="w-24 h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
        <span className="text-gray-500 text-xs">Empty</span>
      </div>
    );
  }

  const display = CARD_DISPLAY[card.type];

  return (
    <div
      ref={isDraggable && !isLocked ? (drag as unknown as React.Ref<HTMLDivElement>) : undefined}
      onClick={onClick}
      className={`
        w-24 h-32 rounded-lg shadow-lg transition-all cursor-pointer
        ${display.color} 
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${isSelected ? 'ring-4 ring-yellow-400' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${!isDraggable ? 'cursor-default' : ''}
      `}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
      }}
    >
      <div className="h-full flex flex-col items-center justify-between p-2 text-white">
        {/* Priority */}
        <div className="self-end text-xs font-bold bg-black bg-opacity-30 px-1 rounded">
          {card.priority}
        </div>

        {/* Card Symbol */}
        <div className="text-5xl">
          {display.symbol}
        </div>

        {/* Card Name */}
        <div className="text-center">
          <div className="text-xs font-semibold">
            {display.name}
          </div>
        </div>

        {/* Locked indicator */}
        {isLocked && (
          <div className="absolute top-1 left-1">
            <span className="text-xl">🔒</span>
          </div>
        )}
      </div>
    </div>
  );
}
