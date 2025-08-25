import React, { useState } from 'react';
import { OptionCard } from '@/lib/game/optionCards';

interface OptionCardsProps {
  optionCards: OptionCard[];
  playerName: string;
}

export default function OptionCards({ optionCards, playerName }: OptionCardsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!optionCards || optionCards.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-semibold text-gray-300">
          Option Cards ({optionCards.length})
        </h3>
        <button className="text-gray-400 hover:text-gray-200">
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          {optionCards.map((card) => (
            <div 
              key={card.id}
              className="bg-gray-700 rounded p-3 border border-purple-600/30 hover:border-purple-600/60 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-purple-400 text-sm">
                    {card.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                  {card.damageValue && (
                    <div className="mt-1">
                      <span className="text-xs text-yellow-400">
                        Absorbs {card.damageValue} damage
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-2 text-purple-500">
                  🛡️
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!expanded && optionCards.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {optionCards.slice(0, 3).map((card, index) => (
            <span 
              key={card.id}
              className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded"
              title={card.name}
            >
              {card.name.length > 15 ? card.name.substring(0, 15) + '...' : card.name}
            </span>
          ))}
          {optionCards.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{optionCards.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}