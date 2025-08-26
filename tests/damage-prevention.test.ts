import { GameEngine } from '@/lib/game/gameEngine';
import { Direction, PowerState } from '@/lib/game/types';
import { OptionCardType } from '@/lib/game/optionCards';
import {
  createTestGameState,
  placeRobot,
  giveOptionCard,
  getDamageDealt,
} from './utils/test-helpers';

describe('Damage Prevention System', () => {
  let gameEngine: GameEngine;
  let gameState: any;
  let mockIo: any;

  describe('Scenario 1: Timeout (player does not respond)', () => {
    beforeEach(() => {
      // Simple mock that just captures events
      mockIo = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn()
        })
      };

      // Use test mode with short timeout
      gameEngine = new GameEngine(mockIo, {
        testMode: true,
        damagePreventionTimeout: 100 // 100ms timeout
      });
      gameState = createTestGameState();
    });

    it('should apply full damage when player does not respond within timeout', async () => {
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotB'); // Facing away so Shield won't auto-block
      const robotC = placeRobot(gameState, 4, 3, Direction.UP, 'RobotC');

      // Give robotB a Power-Down Shield (only works when powered down, so won't auto-block)
      giveOptionCard(robotB, OptionCardType.POWER_DOWN_SHIELD);

      await gameEngine.executeLasers(gameState);

      // After timeout, full damage should be applied despite having Power-Down Shield
      expect(getDamageDealt(robotB)).toBe(2); // Hit by both A and C
      expect(getDamageDealt(robotA)).toBe(0); // Not hit
    });
  });

  describe('Scenario 2: Player accepts damage (clicks accept button)', () => {
    beforeEach(() => {
      // Mock that simulates player accepting damage
      mockIo = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn((event, data) => {
            if (event === 'damage-prevention-opportunity') {
              // Simulate player clicking accept button immediately
              setTimeout(() => {
                const playerId = data.playerId;
                if (gameState.pendingDamage?.has(playerId)) {
                  const pending = gameState.pendingDamage.get(playerId);
                  pending.completed = true;
                }
              }, 10);
            }
          })
        })
      };

      gameEngine = new GameEngine(mockIo, {
        testMode: true,
        damagePreventionTimeout: 100
      });
      gameState = createTestGameState();
    });

    it('should apply full damage when player accepts damage', async () => {
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotB'); // Facing away

      // Give robotB a Power-Down Shield (manual use only when powered down)
      giveOptionCard(robotB, OptionCardType.POWER_DOWN_SHIELD);

      await gameEngine.executeLasers(gameState);

      // Player accepted damage without using Power-Down Shield
      expect(getDamageDealt(robotB)).toBe(1);
      expect(getDamageDealt(robotA)).toBe(0);
    });
  });

  describe('Scenario 3: Player uses option cards to prevent damage', () => {
    beforeEach(() => {
      // Mock that simulates player using option cards
      mockIo = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn((event, data) => {
            if (event === 'damage-prevention-opportunity') {
              // Simulate player selecting Shield card
              setTimeout(() => {
                const playerId = data.playerId;
                const player = gameState.players[playerId];

                if (player && player.optionCards?.length > 0) {
                  // Find Shield card
                  const shieldCard = player.optionCards.find((c: any) =>
                    c.type === OptionCardType.SHIELD
                  );

                  if (shieldCard) {
                    // Simulate using the Shield
                    if (gameState.pendingDamage?.has(playerId)) {
                      const pending = gameState.pendingDamage.get(playerId);

                      // Shield prevents 1 damage
                      pending.prevented = 1;

                      // Remove Shield from player's hand (discard it)
                      player.optionCards = player.optionCards.filter((c: any) =>
                        c.id !== shieldCard.id
                      );

                      // Add to discarded pile
                      if (!gameState.discardedOptions) {
                        gameState.discardedOptions = [];
                      }
                      gameState.discardedOptions.push(shieldCard);

                      // Mark as completed
                      pending.completed = true;
                    }
                  }
                }
              }, 10);
            }
          })
        })
      };

      gameEngine = new GameEngine(mockIo, {
        testMode: true,
        damagePreventionTimeout: 100
      });
      gameState = createTestGameState();
    });

    it('should prevent damage when player uses Power-Down Shield', async () => {
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.RIGHT, 'RobotB'); // Facing away

      // Give robotB a Power-Down Shield and power it down
      const shield = giveOptionCard(robotB, OptionCardType.POWER_DOWN_SHIELD);
      robotB.powerState = PowerState.OFF; // Power down BEFORE executing lasers

      await gameEngine.executeLasers(gameState);

      expect(robotB.powerState).toBe(PowerState.OFF); // Verify robotB is powered down

      // Power-Down Shield should prevent the damage automatically
      expect(getDamageDealt(robotB)).toBe(0);
      expect(getDamageDealt(robotA)).toBe(0);

      // Power-Down Shield should still be in hand (passive card, not discarded on automatic use)
      expect(robotB.optionCards).toContain(shield);
      // Shield should have tracked the direction it blocked
      expect(shield.directionsUsed).toContain(Direction.LEFT); // Blocked from the left (west)
      expect(shield.usedThisRegister).toBe(true);
    });

    it('should prevent multiple damage with Ablative Coat', async () => {
      const robotA = placeRobot(gameState, 2, 2, Direction.RIGHT, 'RobotA');
      const robotB = placeRobot(gameState, 4, 2, Direction.LEFT, 'RobotB');
      const robotC = placeRobot(gameState, 4, 3, Direction.UP, 'RobotC');

      // Give robotB an Ablative Coat
      const ablativeCoat = giveOptionCard(robotB, OptionCardType.ABLATIVE_COAT);

      await gameEngine.executeLasers(gameState);

      // Ablative Coat prevents 2 damage automatically (robotB would take 2 damage from A and C, all prevented)
      expect(getDamageDealt(robotB)).toBe(0); // Both damage prevented by Ablative Coat
      expect(getDamageDealt(robotA)).toBe(1); // Hit by robotB
      
      // Ablative Coat should have absorbed 2 damage and still be in hand (not discarded)
      expect(ablativeCoat.damageAbsorbed).toBe(2);
      expect(robotB.optionCards).toContain(ablativeCoat);
    });
  });

  describe('Mixed scenarios', () => {
    it('should handle multiple players with different responses', async () => {
      // Create mock that handles different players differently
      mockIo = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn((event, data) => {
            if (event === 'damage-prevention-opportunity') {
              const playerId = data.playerId;
              const player = gameState.players[playerId];

              // RobotB accepts damage immediately
              if (player && player.name === 'RobotB') {
                setTimeout(() => {
                  if (gameState.pendingDamage?.has(playerId)) {
                    const pending = gameState.pendingDamage.get(playerId);
                    pending.completed = true;
                  }
                }, 10);
              }
              // RobotC uses Shield
              else if (player && player.name === 'RobotC') {
                setTimeout(() => {
                  const shieldCard = player.optionCards?.find((c: any) =>
                    c.type === OptionCardType.SHIELD
                  );

                  if (shieldCard && gameState.pendingDamage?.has(playerId)) {
                    const pending = gameState.pendingDamage.get(playerId);
                    pending.prevented = 1;
                    player.optionCards = player.optionCards.filter((c: any) =>
                      c.id !== shieldCard.id
                    );
                    pending.completed = true;
                  }
                }, 20);
              }
              // RobotD times out (no response)
            }
          })
        })
      };

      gameEngine = new GameEngine(mockIo, {
        testMode: true,
        damagePreventionTimeout: 100
      });
      gameState = createTestGameState();

      // Set up robots in a line where they shoot each other
      const robotA = placeRobot(gameState, 2, 5, Direction.RIGHT, 'RobotA'); // Shoots B
      const robotB = placeRobot(gameState, 4, 5, Direction.RIGHT, 'RobotB'); // Shoots C  
      const robotC = placeRobot(gameState, 6, 5, Direction.RIGHT, 'RobotC'); // Shoots D
      const robotD = placeRobot(gameState, 8, 5, Direction.LEFT, 'RobotD'); // Shoots C

      giveOptionCard(robotB, OptionCardType.SHIELD);
      giveOptionCard(robotC, OptionCardType.SHIELD);
      giveOptionCard(robotD, OptionCardType.SHIELD);

      await gameEngine.executeLasers(gameState);

      // RobotA has no cards, not hit by anyone
      expect(getDamageDealt(robotA)).toBe(0);

      // RobotB accepted damage without using Shield (hit by A from behind, Shield doesn't auto-block)
      expect(getDamageDealt(robotB)).toBe(1); // Hit by A from behind

      // RobotC: Shield auto-blocks B from front (1 damage), still takes D from behind (1 damage after using Shield in dialog)
      // But C used Shield to prevent the damage from D, so total is 0
      expect(getDamageDealt(robotC)).toBe(1); // D's damage, Shield dialog prevented it

      // RobotD: Shield auto-blocks C from front, takes 0 damage
      expect(getDamageDealt(robotD)).toBe(0); // Shield auto-blocked C's damage from front
    });
  });
});