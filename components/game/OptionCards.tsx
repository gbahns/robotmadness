import React, { useState } from 'react';
import { OptionCard } from '@/lib/game/optionCards';

interface OptionCardsProps {
  optionCards: OptionCard[];
}

export default function OptionCards({ optionCards }: OptionCardsProps) {
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
          {optionCards.map((card) => {
            const isImplemented = card.implemented ?? false;
            const isPassive = card.passive ?? false;
            
            return (
              <div 
                key={card.id}
                className={`bg-gray-700 rounded p-3 border transition-colors ${
                  isImplemented 
                    ? 'border-purple-600/30 hover:border-purple-600/60' 
                    : 'border-gray-600/30 hover:border-gray-600/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      isImplemented ? 'text-purple-400' : 'text-gray-500'
                    }`}>
                      {card.name}
                      {!isImplemented && (
                        <span className="text-xs text-gray-600 ml-2">(Not implemented)</span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {card.type === 'ABLATIVE_COAT' && (
                        <span className="text-xs text-yellow-400">
                          Absorbed: {card.damageAbsorbed || 0}/3
                        </span>
                      )}
                      {card.type === 'SHIELD' && card.usedThisRegister && (
                        <span className="text-xs text-orange-400">
                          Used this register
                        </span>
                      )}
                      {card.damageValue && card.type !== 'ABLATIVE_COAT' && (
                        <span className="text-xs text-yellow-400">
                          Absorbs {card.damageValue} damage
                        </span>
                      )}
                      <span className={`text-xs ${isPassive ? 'text-green-400' : 'text-blue-400'}`}>
                        {isPassive ? '• Passive' : '• Active'}
                      </span>
                    </div>
                  </div>
                  <div className={`ml-2 ${isImplemented ? 'text-purple-500' : 'text-gray-600'}`}>
                    🛡️
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!expanded && optionCards.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {optionCards.map((card) => {
            const isImplemented = card.implemented ?? false;
            return (
              <span 
                key={card.id}
                className={`text-xs px-2 py-1 rounded ${
                  isImplemented 
                    ? 'bg-purple-900/30 text-purple-400' 
                    : 'bg-gray-800/50 text-gray-500'
                }`}
                title={card.name}
              >
                {card.name.length > 15 ? card.name.substring(0, 15) + '...' : card.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}