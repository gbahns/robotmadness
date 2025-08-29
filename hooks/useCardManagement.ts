import { useState, useCallback, MutableRefObject } from 'react';
import { GameState, ProgramCard } from '@/lib/game/types';
import { socketClient } from '@/lib/socket';

interface UseCardManagementProps {
    gameState: GameState | null;
    playerIdRef: MutableRefObject<string>;
    roomCode: string;
    onLogEntry: (entry: any) => void;
}

export function useCardManagement({
    gameState,
    playerIdRef,
    roomCode,
    onLogEntry
}: UseCardManagementProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const currentPlayer = gameState?.players[playerIdRef.current];

    const handleCardClick = useCallback((index: number) => {
        if (isSubmitted || !currentPlayer) return null;

        // Find first empty register slot
        const emptySlotIndex = currentPlayer.selectedCards.findIndex(card => card === null);
        if (emptySlotIndex === -1) return null; // All slots full

        // Get the card
        const card = currentPlayer.dealtCards[index];
        if (!card) return null;

        // Place card in first empty slot
        const newSelectedCards = [...currentPlayer.selectedCards];
        newSelectedCards[emptySlotIndex] = card;

        // Emit register update to server
        socketClient.emit('register-update', {
            roomCode,
            playerId: playerIdRef.current,
            selectedCards: newSelectedCards
        });

        // Return the new game state for the parent to update
        if (!gameState) return null;
        return {
            ...gameState,
            players: {
                ...gameState.players,
                [playerIdRef.current]: {
                    ...gameState.players[playerIdRef.current],
                    selectedCards: newSelectedCards,
                },
            },
        };
    }, [isSubmitted, currentPlayer, gameState, playerIdRef]);

    const handleCardDrop = useCallback((card: ProgramCard, registerIndex: number) => {
        if (!currentPlayer || isSubmitted) return null;

        // Check if this card is already in a register
        const existingIndex = currentPlayer.selectedCards.findIndex(
            c => c && c.id === card.id
        );

        const newSelectedCards = [...currentPlayer.selectedCards];

        // If card exists in another slot, remove it first
        if (existingIndex !== -1 && existingIndex !== registerIndex) {
            newSelectedCards[existingIndex] = null;
        }

        // Place card in new slot
        newSelectedCards[registerIndex] = card;

        // Emit register update to server
        socketClient.emit('register-update', {
            roomCode,
            playerId: playerIdRef.current,
            selectedCards: newSelectedCards
        });

        // Return the new game state
        if (!gameState) return null;
        return {
            ...gameState,
            players: {
                ...gameState.players,
                [playerIdRef.current]: {
                    ...gameState.players[playerIdRef.current],
                    selectedCards: newSelectedCards,
                },
            },
        };
    }, [currentPlayer, isSubmitted, gameState, playerIdRef]);

    const handleCardRemove = useCallback((registerIndex: number) => {
        if (!currentPlayer || isSubmitted) return null;

        const newSelectedCards = [...currentPlayer.selectedCards];
        newSelectedCards[registerIndex] = null;

        // Emit register update to server
        socketClient.emit('register-update', {
            roomCode,
            playerId: playerIdRef.current,
            selectedCards: newSelectedCards
        });

        if (!gameState) return null;
        return {
            ...gameState,
            players: {
                ...gameState.players,
                [playerIdRef.current]: {
                    ...gameState.players[playerIdRef.current],
                    selectedCards: newSelectedCards,
                },
            },
        };
    }, [currentPlayer, isSubmitted, gameState, playerIdRef]);

    const handleSubmitCards = useCallback(() => {
        if (!currentPlayer) return;

        const filledSlots = currentPlayer.selectedCards.filter(c => c !== null).length;
        if (filledSlots < 5) {
            alert(`Please select all 5 cards! You have ${filledSlots}/5`);
            return;
        }

        console.log('Submitting cards for player:', {
            playerId: playerIdRef.current,
            playerName: currentPlayer.name,
            cards: currentPlayer.selectedCards
        });

        socketClient.emit('submit-cards', {
            roomCode,
            playerId: playerIdRef.current,
            cards: currentPlayer.selectedCards,
        });

        // Add to log
        onLogEntry({
            id: Date.now(),
            message: `You submitted your program`,
            type: 'info',
            timestamp: new Date()
        });

        setIsSubmitted(true);
    }, [currentPlayer, roomCode, playerIdRef, onLogEntry]);

    const handleResetCards = useCallback(() => {
        if (!currentPlayer) return null;

        // Only emit reset event to server - let server handle all the logic
        socketClient.emit('reset-cards', {
            roomCode,
            playerId: playerIdRef.current,
        });

        // Update submitted state
        setIsSubmitted(false);

        // Add to log
        onLogEntry({
            id: Date.now(),
            message: `You reset your program`,
            type: 'info',
            timestamp: new Date()
        });
    }, [currentPlayer, roomCode, playerIdRef, onLogEntry]);

    // Sync isSubmitted with server state
    const syncSubmittedState = useCallback((submitted: boolean) => {
        setIsSubmitted(submitted);
    }, []);

    return {
        isSubmitted,
        currentPlayer,
        handleCardClick,
        handleCardDrop,
        handleCardRemove,
        handleSubmitCards,
        handleResetCards,
        syncSubmittedState,
        setIsSubmitted
    };
}