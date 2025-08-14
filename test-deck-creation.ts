import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from './lib/game/gameEngine.js';
import { CardType } from './lib/game/types.js';
import type { ProgramCard } from './lib/game/types.js';

// Create a mock io object for the GameEngine constructor
const mockIo = {
  to: () => ({
    emit: () => {},
  }),
};

// Instantiate the GameEngine
// The GameEngine class has a private method `createDeck` that we want to test.
// We can access it via this cast.
const gameEngine = new GameEngine(mockIo) as any;

const FULL_DECK_SIZE = 84;

describe('GameEngine.createDeck', () => {
  test('should create a full deck when no cards are excluded', () => {
    const deck = gameEngine.createDeck();
    assert.strictEqual(deck.length, FULL_DECK_SIZE, 'Deck should have 84 cards');
  });

  test('should create a full deck for an empty exclusion list', () => {
    const deck = gameEngine.createDeck([]);
    assert.strictEqual(deck.length, FULL_DECK_SIZE, 'Deck should have 84 cards');
  });

  test('should exclude a single card from the deck', () => {
    const excludedCard: ProgramCard = { id: 70, type: CardType.U_TURN, priority: 70 };
    const deck = gameEngine.createDeck([excludedCard]);
    assert.strictEqual(deck.length, FULL_DECK_SIZE - 1, 'Deck should have 83 cards');
    assert.ok(!deck.some((card: ProgramCard) => card.id === excludedCard.id), 'Excluded card should not be in the deck');
  });

  test('should exclude multiple cards from the deck', () => {
    const excludedCards: ProgramCard[] = [
      { id: 80, type: CardType.ROTATE_RIGHT, priority: 80 },
      { id: 490, type: CardType.MOVE_1, priority: 490 },
      { id: 670, type: CardType.MOVE_2, priority: 670 },
    ];
    const deck = gameEngine.createDeck(excludedCards);
    const excludedIds = new Set(excludedCards.map(c => c.id));

    assert.strictEqual(deck.length, FULL_DECK_SIZE - excludedCards.length, `Deck should have ${FULL_DECK_SIZE - excludedCards.length} cards`);
    assert.ok(!deck.some((card: ProgramCard) => excludedIds.has(card.id)), 'None of the excluded cards should be in the deck');
  });

  test('should not remove anything if excluded card is not in the deck', () => {
    const excludedCard: ProgramCard = { id: 9999, type: CardType.MOVE_1, priority: 9999 };
    const deck = gameEngine.createDeck([excludedCard]);
    assert.strictEqual(deck.length, FULL_DECK_SIZE, 'Deck should still have 84 cards');
  });

  test('should handle duplicate entries in the exclusion list', () => {
    const excludedCard: ProgramCard = { id: 100, type: CardType.ROTATE_LEFT, priority: 100 };
    const deck = gameEngine.createDeck([excludedCard, excludedCard]);
    assert.strictEqual(deck.length, FULL_DECK_SIZE - 1, 'Deck should have 83 cards, only removing one instance');
    assert.ok(!deck.some((card: ProgramCard) => card.id === excludedCard.id), 'Excluded card should not be in the deck');
  });
});
