// components/game/Hand.tsx

import React from 'react';
import { ProgramCard } from '@/lib/game/types';
import Card from './Card';

interface HandProps {
  cards: ProgramCard[];
  selectedCards: (ProgramCard | null)[];
  onCardClick: (index: number) => void;
  isSubmitted: boolean;
}

export default function Hand({ cards, selectedCards, onCardClick, isSubmitted }: HandProps) {
  // Check if a card is already programmed
  const isCardProgrammed = (card: ProgramCard): boolean => {
    return selectedCards.some(selected => selected && selected.id === card.id);
  };
  
  return (
    <div>
      <div className="grid grid-cols-9 gap-2">
        {cards.map((card, index) => {
          const isProgrammed = isCardProgrammed(card);
          return (
            <div key={`${card.id}-${index}`} className={isProgrammed ? 'opacity-50' : ''}>
              <Card
                card={card}
                index={index}
                isSelected={false}
                isDraggable={!isSubmitted && !isProgrammed}
                onClick={() => !isSubmitted && !isProgrammed && onCardClick(index)}
              />
            </div>
          );
        })}
      </div>
      {cards.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          Waiting for cards to be dealt...
        </p>
      )}
    </div>
  );
}