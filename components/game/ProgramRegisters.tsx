// components/game/ProgramRegisters.tsx

import React from 'react';
import { ProgramCard } from '@/lib/game/types';
import Card from './Card';
import { useDrop } from 'react-dnd';
import { CARD_TYPE, DragItem } from './Card';

interface ProgramRegistersProps {
  selectedCards: (ProgramCard | null)[];
  lockedRegisters: number;
  onCardDrop: (card: ProgramCard, registerIndex: number) => void;
  onCardRemove: (registerIndex: number) => void;
  isSubmitted: boolean;
}

interface RegisterSlotProps {
  card: ProgramCard | null;
  index: number;
  isLocked: boolean;
  onDrop: (card: ProgramCard) => void;
  onRemove: () => void;
  isSubmitted: boolean;
}

function RegisterSlot({ card, index, isLocked, onDrop, onRemove, isSubmitted }: RegisterSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: CARD_TYPE,
    drop: (item: DragItem) => {
      if (!isLocked && !isSubmitted) {
        onDrop(item.card);
      }
    },
    canDrop: () => !isLocked && !isSubmitted && !card,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [card, isLocked, isSubmitted]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-gray-400 mb-1">Register {index + 1}</div>
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`
          relative w-28 h-36 rounded-lg border-2 transition-all
          ${isLocked ? 'border-red-600 bg-red-900 bg-opacity-20' : 'border-gray-600'}
          ${isOver && canDrop ? 'border-green-400 bg-green-900 bg-opacity-20' : ''}
          ${!card && !isLocked ? 'border-dashed' : ''}
        `}
      >
        {card ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card
              card={card}
              isLocked={isLocked}
              isDraggable={false}
              onClick={() => !isLocked && !isSubmitted && onRemove()}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-gray-500 text-xs">
              {isLocked ? '🔒 Locked' : 'Drop card here'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgramRegisters({
  selectedCards,
  lockedRegisters,
  onCardDrop,
  onCardRemove,
  isSubmitted,
}: ProgramRegistersProps) {
  const totalLocked = Math.min(lockedRegisters, 5);
  
  return (
    <div>
      {totalLocked > 0 && (
        <div className="text-sm text-red-400 text-center mb-2">
          {totalLocked} register{totalLocked > 1 ? 's' : ''} locked due to damage
        </div>
      )}
      
      <div className="flex gap-3 justify-center">
        {selectedCards.map((card, index) => {
          const isLocked = index >= (5 - totalLocked);
          return (
            <RegisterSlot
              key={index}
              card={card}
              index={index}
              isLocked={isLocked}
              onDrop={(card) => onCardDrop(card, index)}
              onRemove={() => onCardRemove(index)}
              isSubmitted={isSubmitted}
            />
          );
        })}
      </div>
      
      {isSubmitted && (
        <div className="mt-4 text-center text-green-400">
          ✓ Program submitted! Waiting for other players...
        </div>
      )}
    </div>
  );
}