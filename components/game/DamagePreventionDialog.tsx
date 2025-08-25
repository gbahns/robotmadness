import React, { useState, useEffect } from 'react';
import { OptionCard } from '@/lib/game/optionCards';
import { socketClient } from '@/lib/socket';

interface DamagePreventionDialogProps {
  isOpen: boolean;
  damageAmount: number;
  source: string;
  optionCards: OptionCard[];
  roomCode: string;
  onClose: () => void;
}

export default function DamagePreventionDialog({
  isOpen,
  damageAmount,
  source,
  optionCards,
  roomCode,
  onClose
}: DamagePreventionDialogProps) {
  const [preventedDamage, setPreventedDamage] = useState(0);
  const [remainingDamage, setRemainingDamage] = useState(damageAmount);
  const [timeLeft, setTimeLeft] = useState(15);
  const [usedCards, setUsedCards] = useState<string[]>([]);

  const handleClose = () => {
    // Notify server that damage prevention is complete
    socketClient.emit('damage-prevention-complete', { roomCode });
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state when dialog opens
    setPreventedDamage(0);
    setUsedCards([]);
    setTimeLeft(15);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const newRemaining = damageAmount - preventedDamage;
    setRemainingDamage(newRemaining);
    
    // Auto-close if all damage is prevented
    if (isOpen && newRemaining <= 0 && damageAmount > 0) {
      setTimeout(() => {
        handleClose();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damageAmount, preventedDamage, isOpen]);

  const handleUseCard = (card: OptionCard) => {
    if (remainingDamage <= 0 || usedCards.includes(card.id)) return;
    
    socketClient.emit('use-option-for-damage', {
      roomCode,
      cardId: card.id
    });
    
    const newPreventedDamage = Math.min(preventedDamage + 1, damageAmount);
    setPreventedDamage(newPreventedDamage);
    setUsedCards(prev => [...prev, card.id]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Incoming Damage!
          </h2>
          <p className="text-gray-300">
            Taking {damageAmount} damage from {source}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Damage prevented: {preventedDamage} / {damageAmount}
            </div>
            <div className="text-sm text-red-400">
              Time left: {timeLeft}s
            </div>
          </div>
        </div>

        {remainingDamage > 0 && optionCards.length > 0 ? (
          <>
            <div className="mb-4">
              <div className="bg-red-900/20 border border-red-600 rounded p-3">
                <p className="text-red-400 font-semibold">
                  {remainingDamage} damage will be applied!
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Discard option cards to prevent damage (1 card = 1 damage prevented)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {optionCards.map(card => {
                const isUsed = usedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleUseCard(card)}
                    disabled={isUsed || remainingDamage <= 0}
                    className={`
                      p-3 rounded border-2 text-left transition-all
                      ${isUsed 
                        ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed' 
                        : 'bg-gray-700 border-blue-600 hover:bg-gray-600 cursor-pointer'}
                    `}
                  >
                    <div className="font-medium text-white text-sm">{card.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{card.description}</div>
                    {isUsed && (
                      <div className="text-xs text-green-400 mt-1">✓ Used</div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : remainingDamage === 0 ? (
          <div className="bg-green-900/20 border border-green-600 rounded p-3">
            <p className="text-green-400 font-semibold">
              All damage prevented! Closing...
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded p-3">
            <p className="text-yellow-400">
              No option cards available to prevent damage
            </p>
          </div>
        )}

        {remainingDamage > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Accept Damage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}