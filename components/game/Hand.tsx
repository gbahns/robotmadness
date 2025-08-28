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
      <div className="space-y-2">
        {/* First row - cards 0-4 */}
        <div className="grid grid-cols-5 gap-2">
          {cards.slice(0, 5).map((card, index) => {
            const isProgrammed = isCardProgrammed(card);
            return (
              <div 
                key={`${card.id}-${index}`} 
                className={`relative ${isProgrammed ? 'opacity-30 grayscale' : ''}`}
              >
                <Card
                  card={card}
                  index={index}
                  isSelected={false}
                  isDraggable={!isSubmitted && !isProgrammed}
                  onClick={() => !isSubmitted && !isProgrammed && onCardClick(index)}
                />
                {isProgrammed && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="bg-gray-900 bg-opacity-80 text-yellow-400 text-xs font-bold px-2 py-1 rounded border border-yellow-500">
                      USED
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Second row - cards 5-8 */}
        {cards.length > 5 && (
          <div className="grid grid-cols-5 gap-2">
            {cards.slice(5).map((card, realIndex) => {
              const index = realIndex + 5;
              const isProgrammed = isCardProgrammed(card);
              return (
                <div 
                  key={`${card.id}-${index}`} 
                  className={`relative ${isProgrammed ? 'opacity-30 grayscale' : ''}`}
                >
                  <Card
                    card={card}
                    index={index}
                    isSelected={false}
                    isDraggable={!isSubmitted && !isProgrammed}
                    onClick={() => !isSubmitted && !isProgrammed && onCardClick(index)}
                  />
                  {isProgrammed && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="bg-gray-900 bg-opacity-80 text-yellow-400 text-xs font-bold px-2 py-1 rounded border border-yellow-500">
                        USED
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Add empty slots if less than 4 cards in second row */}
            {cards.slice(5).length < 4 && Array.from({ length: 4 - cards.slice(5).length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </div>
        )}
      </div>
      {cards.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          Waiting for cards to be dealt...
        </p>
      )}
    </div>
  );
}