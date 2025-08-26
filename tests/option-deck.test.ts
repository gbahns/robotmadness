import { GameEngine, ServerGameState } from '@/lib/game/gameEngine';
import { createTestGameState, placeRobot } from './utils/test-helpers';
import { Direction, GamePhase } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import { Server } from 'socket.io';

describe('Option Deck Management', () => {
  let gameEngine: GameEngine;
  let gameState: ServerGameState;
  let mockIo: Server;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
    // Use test mode with short damage prevention timeout
    gameEngine = new GameEngine(mockIo, {
      testMode: true,
      damagePreventionTimeout: 100
    });
    gameState = createTestGameState();
  });

  it('should initialize option deck with one of each card type (excluding Shield)', () => {
    // Start a game which initializes the option deck
    (gameEngine as any).startGame(gameState, 'test-course');
    
    // Check that deck was initialized
    expect(gameState.optionDeck).toBeDefined();
    expect(gameState.optionDeck.length).toBeGreaterThan(0);
    
    // Check that there are no Shield cards
    const hasShield = gameState.optionDeck.some(card => card.type === OptionCardType.SHIELD);
    expect(hasShield).toBe(false);
    
    // Check that there are no duplicates
    const cardTypes = gameState.optionDeck.map(card => card.type);
    const uniqueTypes = new Set(cardTypes);
    expect(cardTypes.length).toBe(uniqueTypes.size);
    
    // Check discarded pile is empty
    expect(gameState.discardedOptions).toEqual([]);
  });

  it('should not create new cards when deck is empty', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    
    // Start with empty deck
    gameState.optionDeck = [];
    gameState.discardedOptions = [];
    
    // Try to draw a card
    (gameEngine as any).drawOptionCard(gameState, robot);
    
    // Should not create new cards
    expect(gameState.optionDeck.length).toBe(0);
    expect(robot.optionCards.length).toBe(0);
  });

  it('should not reshuffle discarded cards back into deck', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    
    // Set up a scenario with empty deck but cards in discard
    gameState.optionDeck = [];
    gameState.discardedOptions = [
      { id: 'test-1', type: OptionCardType.ABLATIVE_COAT, name: 'Ablative Coat', description: '', implemented: true },
      { id: 'test-2', type: OptionCardType.BRAKES, name: 'Brakes', description: '', implemented: false }
    ];
    
    const discardedCount = gameState.discardedOptions.length;
    
    // Try to draw a card
    (gameEngine as any).drawOptionCard(gameState, robot);
    
    // Deck should still be empty
    expect(gameState.optionDeck.length).toBe(0);
    // Discarded cards should remain in discard pile
    expect(gameState.discardedOptions.length).toBe(discardedCount);
    // Robot should not get a card
    expect(robot.optionCards.length).toBe(0);
  });

  it('should properly discard option cards when used', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    
    // Initialize the deck
    (gameEngine as any).startGame(gameState, 'test-course');
    // Players now start with 0 cards
    expect(robot.optionCards.length).toBe(0);
    const initialDeckSize = gameState.optionDeck.length;
    
    // Draw a card
    (gameEngine as any).drawOptionCard(gameState, robot);
    
    expect(robot.optionCards.length).toBe(1);
    expect(gameState.optionDeck.length).toBe(initialDeckSize - 1);
    
    // Simulate using the card (would normally happen through damage prevention)
    const usedCard = robot.optionCards[0];
    robot.optionCards = [];
    gameState.discardedOptions.push(usedCard);
    
    // Card should be in discard pile
    expect(gameState.discardedOptions.length).toBe(1);
    expect(gameState.discardedOptions[0]).toBe(usedCard);
    
    // Try to draw when deck is empty
    gameState.optionDeck = [];
    (gameEngine as any).drawOptionCard(gameState, robot);
    
    // Should not get the discarded card back
    expect(robot.optionCards.length).toBe(0);
    expect(gameState.discardedOptions.length).toBe(1);
  });

  it('should limit players to maximum 7 option cards', () => {
    const robot = placeRobot(gameState, 5, 5, Direction.UP, 'TestRobot');
    
    // Initialize deck with cards first
    (gameEngine as any).startGame(gameState, 'test-course');
    
    // Override robot cards to have exactly 7
    robot.optionCards = [];
    for (let i = 0; i < 7; i++) {
      robot.optionCards.push({
        id: `card-${i}`,
        type: OptionCardType.BRAKES,
        name: 'Test Card',
        description: '',
        implemented: false
      });
    }
    
    const deckSizeBefore = gameState.optionDeck.length;
    
    // Try to draw another card
    (gameEngine as any).drawOptionCard(gameState, robot);
    
    // Should still have 7 cards
    expect(robot.optionCards.length).toBe(7);
    // Deck should not change
    expect(gameState.optionDeck.length).toBe(deckSizeBefore);
  });

  it('should ensure each card type exists only once in the game', () => {
    // Initialize the deck  
    (gameEngine as any).startGame(gameState, 'test-course');
    
    // Count total cards in game (deck + discarded + in player hands)
    const allCards: any[] = [...gameState.optionDeck];
    if (gameState.discardedOptions) {
      allCards.push(...gameState.discardedOptions);
    }
    
    Object.values(gameState.players).forEach(player => {
      if (player.optionCards) {
        allCards.push(...player.optionCards);
      }
    });
    
    // Group by type and ensure no duplicates
    const typeCount = new Map<OptionCardType, number>();
    allCards.forEach(card => {
      const count = typeCount.get(card.type) || 0;
      typeCount.set(card.type, count + 1);
    });
    
    // Each type should appear at most once (Shield should not appear at all)
    typeCount.forEach((count, type) => {
      if (type === OptionCardType.SHIELD) {
        expect(count).toBe(0);
      } else {
        expect(count).toBeLessThanOrEqual(1);
      }
    });
  });
});