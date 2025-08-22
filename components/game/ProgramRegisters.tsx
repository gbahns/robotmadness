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
  currentRegister?: number;
  phase?: string;
  boardPhase?: string | null;
}

interface RegisterSlotProps {
  card: ProgramCard | null;
  index: number;
  isLocked: boolean;
  onDrop: (card: ProgramCard) => void;
  onRemove: () => void;
  isSubmitted: boolean;
  currentRegister?: number;
  phase?: string;
}

function RegisterSlot({ card, index, isLocked, onDrop, onRemove, isSubmitted, currentRegister, phase }: RegisterSlotProps) {
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
    <div className="flex flex-col items-center flex-1">
      <div className="text-xs text-gray-400 mb-1">R{index + 1}</div>
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`
          relative w-16 h-20 rounded-lg border-2 transition-all
          ${phase === 'executing' && currentRegister === index ? 'border-yellow-400 bg-yellow-900 bg-opacity-50 ring-2 ring-yellow-400' : ''}
          ${isLocked ? 'border-red-600 bg-red-900 bg-opacity-20' : 'border-gray-600'}
          ${isOver && canDrop ? 'border-green-400 bg-green-900 bg-opacity-20' : ''}
          ${!card && !isLocked ? 'border-dashed' : ''}
        `}
      >
        {card ? (
          <div className="h-full flex items-center justify-center">
            <Card
              card={card}
              isLocked={isLocked}
              isDraggable={false}
              onClick={() => !isLocked && !isSubmitted && onRemove()}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <span className="text-gray-500 text-[10px]">
              {isLocked ? '🔒' : 'Drop'}
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
  currentRegister,
  phase,
  boardPhase
}: ProgramRegistersProps) {
  const totalLocked = Math.min(lockedRegisters, 5);

  return (
    <div>
      {totalLocked > 0 && (
        <div className="text-sm text-red-400 text-center mb-2">
          {totalLocked} register{totalLocked > 1 ? 's' : ''} locked due to damage
        </div>
      )}

      <div className="flex gap-2 justify-between">
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
              currentRegister={currentRegister}
              phase={phase}
            />
          );
        })}
      </div>

      {isSubmitted && phase !== 'executing' && (
        <div className="mt-4 text-center text-green-400">
          ✓ Program submitted! Waiting for other players...
        </div>
      )}

      {phase === 'executing' && (
        <div className="mt-4 text-center text-yellow-400">
          <div className="text-lg font-semibold">
            Executing Register {(currentRegister || 0) + 1}
          </div>
          {boardPhase && (
            <div className="text-sm text-gray-300 mt-1">
              {boardPhase}
            </div>
          )}
          {!boardPhase && (
            <div className="text-sm text-gray-400 mt-1">
              Watch the chaos unfold!
            </div>
          )}
        </div>
      )}
    </div>
  );
}