// components/game/ProgramRegisters.tsx - Updated with selected slot highlighting

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
  selectedSlot: number;
  onRegisterClick: (index: number) => void;
}

interface RegisterSlotProps {
  card: ProgramCard | null;
  index: number;
  isLocked: boolean;
  isSelected: boolean;
  onDrop: (card: ProgramCard) => void;
  onRemove: () => void;
  onClick: () => void;
  isSubmitted: boolean;
}

function RegisterSlot({
  card,
  index,
  isLocked,
  isSelected,
  onDrop,
  onRemove,
  onClick,
  isSubmitted
}: RegisterSlotProps) {
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
      <div className="text-sm text-gray-400 mb-1">
        Register {index + 1}
        {isSelected && !isLocked && <span className="text-green-400"> ◄</span>}
      </div>
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        onClick={onClick}
        className={`
          relative w-28 h-36 rounded-lg border-2 transition-all cursor-pointer
          ${isLocked ? 'border-red-600 bg-red-900 bg-opacity-20' : 'border-gray-600'}
          ${isSelected && !isLocked ? 'border-green-400 border-4 shadow-lg shadow-green-400/50' : ''}
          ${isOver && canDrop ? 'border-green-400 bg-green-900 bg-opacity-20' : ''}
          ${!card && !isLocked ? 'border-dashed' : ''}
          ${!isLocked && !isSubmitted ? 'hover:border-gray-400' : ''}
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
            <span className="text-gray-500 text-xs text-center px-2">
              {isLocked ? '🔒 Locked' : isSelected ? 'Click a card\nto place here' : 'Click to select'}
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
  selectedSlot,
  onRegisterClick,
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
              isSelected={selectedSlot === index}
              onDrop={(card) => onCardDrop(card, index)}
              onRemove={() => onCardRemove(index)}
              onClick={() => onRegisterClick(index)}
              isSubmitted={isSubmitted}
            />
          );
        })}
      </div>

      <div className="mt-4 text-center">
        {!isSubmitted && (
          <p className="text-sm text-gray-400">
            Click a register slot to select it, then click a card to place it there
          </p>
        )}
        {isSubmitted && (
          <div className="text-green-400">
            ✓ Program submitted! Waiting for other players...
          </div>
        )}
      </div>
    </div>
  );
}