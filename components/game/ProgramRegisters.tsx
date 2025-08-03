import React, { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ProgramCard } from '@/lib/game/types';
import Card from './Card';

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
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'card',
    canDrop: () => !isLocked && !card && !isSubmitted,
    drop: (item: { card: ProgramCard }) => onDrop(item.card),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
  }, [drop]);

  const borderColor = isSelected && !isSubmitted ? 'border-yellow-400' : 'border-gray-600';
  const bgColor = isLocked ? 'bg-gray-900' : isOver && canDrop ? 'bg-gray-700' : 'bg-gray-800';

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-400 mb-1">#{index + 1}</div>
      <div
        ref={dropRef}
        onClick={onClick}
        className={`
          relative w-20 h-28 border-2 rounded-lg transition-all cursor-pointer
          ${bgColor} ${borderColor}
          ${isLocked ? 'cursor-not-allowed' : 'hover:border-gray-400'}
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
              {isLocked ? '🔒' : ''}
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
    <div className="flex gap-3">
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

      {isSubmitted && (
        <div className="flex items-center ml-4 text-green-400">
          <span className="text-sm">✓ Submitted</span>
        </div>
      )}
    </div>
  );
}