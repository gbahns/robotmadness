import React, { useState } from 'react';
import { OptionCard, OptionCardType } from '@/lib/game/optionCards';
import { socketClient } from '@/lib/socket';

interface OptionCardLossDialogProps {
    roomCode: string;
    playerId: string;
    optionCards: OptionCard[];
    onClose: () => void;
}

export default function OptionCardLossDialog({
    roomCode,
    playerId,
    optionCards,
    onClose
}: OptionCardLossDialogProps) {
    const [selectedCard, setSelectedCard] = useState<OptionCardType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!selectedCard) return;
        
        setIsSubmitting(true);
        socketClient.emit('option-card-loss-decision', {
            roomCode,
            playerId,
            cardToLose: selectedCard
        });
        
        // Close the dialog after submitting
        setTimeout(() => {
            onClose();
        }, 500);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">
                Your Robot Was Destroyed!
            </h2>
            <p className="text-gray-300 mb-6">
                Choose one option card to lose:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {optionCards.map((card) => (
                    <button
                        key={card.type}
                        onClick={() => setSelectedCard(card.type)}
                        disabled={isSubmitting}
                        className={`
                            p-4 rounded-lg border-2 transition-all
                            ${selectedCard === card.type 
                                ? 'border-red-500 bg-red-900/30' 
                                : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                            }
                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <h3 className="font-bold text-white mb-2">{card.name}</h3>
                        <p className="text-sm text-gray-400">{card.description}</p>
                    </button>
                ))}
            </div>
            
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedCard || isSubmitting}
                    className={`
                        px-6 py-2 rounded font-bold
                        ${!selectedCard || isSubmitting
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }
                    `}
                >
                    {isSubmitting ? 'Losing Card...' : 'Lose Selected Card'}
                </button>
            </div>
        </div>
    );
}