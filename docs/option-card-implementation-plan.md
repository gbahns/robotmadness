# Option Cards Complete Implementation Plan

## Summary
We've already implemented the basic option card system infrastructure (definitions, UI components, socket events). Now we need to integrate the damage prevention mechanism so players can actually use option cards to block incoming damage, and implement the specific card effects during gameplay.

## Current State Assessment

### Already Implemented:
- ✅ Option card definitions (`/lib/game/optionCards.ts`)
- ✅ Option deck creation and shuffling
- ✅ UI component for displaying option cards (`/components/game/OptionCards.tsx`)
- ✅ Socket events for option card actions
- ✅ Repair tile integration (robots draw cards on upgrade tiles)
- ✅ Player interface updated with `optionCards` field
- ✅ ServerGameState includes option deck and discard pile

### Needs Implementation:
- ❌ Damage prevention dialog when taking damage
- ❌ Pausing damage application to allow option card selection
- ❌ Specific card effect implementations
- ❌ Integration with movement/execution systems

## Key Implementation Tasks

### 1. Damage Prevention System

#### Problem:
Currently, damage is applied immediately in `executeLasers()` and other methods without giving players a chance to use option cards to prevent it.

#### Solution:
Create a damage queueing system that:
1. Collects all pending damage for a player
2. Emits a damage prevention opportunity event
3. Waits for player response (with timeout)
4. Applies final damage after option cards are used

### 2. Files to Modify

#### `/lib/game/gameEngine.ts`

**ADD new method `applyDamageWithOptions`:**
```typescript
async applyDamageWithOptions(
    gameState: ServerGameState, 
    playerId: string, 
    damageAmount: number, 
    source: string
): Promise<number> {
    const player = gameState.players[playerId];
    if (!player || player.lives <= 0) return 0;
    
    // If player has no option cards, apply damage immediately
    if (player.optionCards.length === 0) {
        player.damage += damageAmount;
        return damageAmount;
    }
    
    // Emit damage prevention opportunity
    this.io.to(playerId).emit('damage-prevention-opportunity', {
        damageAmount,
        source,
        optionCards: player.optionCards
    });
    
    // Store pending damage
    if (!gameState.pendingDamage) {
        gameState.pendingDamage = new Map();
    }
    gameState.pendingDamage.set(playerId, {
        amount: damageAmount,
        source,
        prevented: 0
    });
    
    // Wait for response (with 10-second timeout)
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Apply remaining damage
    const pending = gameState.pendingDamage.get(playerId);
    const finalDamage = Math.max(0, (pending?.amount || damageAmount) - (pending?.prevented || 0));
    player.damage += finalDamage;
    
    // Clean up
    gameState.pendingDamage.delete(playerId);
    
    return finalDamage;
}
```

**MODIFY `executeLasers` method:**
Replace direct damage application with:
```typescript
// Instead of: victim.damage += totalDamage;
const finalDamage = await this.applyDamageWithOptions(
    gameState, 
    playerId, 
    totalDamage, 
    damageInfo.boardDamage > 0 ? 'board laser' : 'robot laser'
);
```

**ADD to ServerGameState interface:**
```typescript
pendingDamage?: Map<string, {
    amount: number;
    source: string;
    prevented: number;
}>;
```

#### `/server.ts`

**ADD new socket handler:**
```typescript
socket.on('use-option-for-damage', ({ roomCode, cardId }) => {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;
    
    const playerId = socket.id;
    const player = gameState.players[playerId];
    if (!player) return;
    
    const pending = gameState.pendingDamage?.get(playerId);
    if (!pending) {
        socket.emit('error', { message: 'No pending damage to prevent' });
        return;
    }
    
    // Find and remove the option card
    const cardIndex = player.optionCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
        socket.emit('error', { message: 'Option card not found' });
        return;
    }
    
    const card = player.optionCards.splice(cardIndex, 1)[0];
    gameState.discardedOptions.push(card);
    
    // Prevent 1 damage
    pending.prevented = Math.min(pending.prevented + 1, pending.amount);
    
    console.log(`${player.name} used ${card.name} to prevent 1 damage`);
    io.to(roomCode).emit('option-card-used-for-damage', {
        playerId: player.id,
        playerName: player.name,
        card: card,
        damagePreventedSoFar: pending.prevented,
        damageRemaining: pending.amount - pending.prevented
    });
    
    // Update game state
    io.to(roomCode).emit('game-state', gameState);
});
```

**ADD to ServerToClientEvents interface:**
```typescript
'damage-prevention-opportunity': (data: { 
    damageAmount: number; 
    source: string; 
    optionCards: any[] 
}) => void;
'option-card-used-for-damage': (data: { 
    playerId: string; 
    playerName: string; 
    card: any; 
    damagePreventedSoFar: number; 
    damageRemaining: number 
}) => void;
```

**ADD to ClientToServerEvents interface:**
```typescript
'use-option-for-damage': (data: { roomCode: string; cardId: string }) => void;
```

### 3. Create Damage Prevention Dialog Component

#### `/components/game/DamagePreventionDialog.tsx`
```typescript
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
  const [timeLeft, setTimeLeft] = useState(10);
  const [usedCards, setUsedCards] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    setRemainingDamage(damageAmount - preventedDamage);
  }, [damageAmount, preventedDamage]);

  const handleUseCard = (card: OptionCard) => {
    if (remainingDamage <= 0 || usedCards.includes(card.id)) return;
    
    socketClient.emit('use-option-for-damage', {
      roomCode,
      cardId: card.id
    });
    
    setPreventedDamage(prev => Math.min(prev + 1, damageAmount));
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
              All damage prevented!
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded p-3">
            <p className="text-yellow-400">
              No option cards available to prevent damage
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            {remainingDamage > 0 ? 'Accept Damage' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4. Integrate Dialog in Game Page

#### `/app/game/[roomCode]/page.tsx`

**ADD state and handlers:**
```typescript
// Add to state declarations
const [damagePreventionDialog, setDamagePreventionDialog] = useState<{
  isOpen: boolean;
  damageAmount: number;
  source: string;
  optionCards: OptionCard[];
} | null>(null);

// Add event handler
const handleDamagePreventionOpportunity = (data: {
  damageAmount: number;
  source: string;
  optionCards: OptionCard[];
}) => {
  setDamagePreventionDialog({
    isOpen: true,
    ...data
  });
};

const handleOptionCardUsedForDamage = (data: any) => {
  addLogEntry({
    message: `${data.playerName} used ${data.card.name} to prevent damage (${data.damagePreventedSoFar}/${data.damageRemaining + data.damagePreventedSoFar} prevented)`,
    type: 'option',
    timestamp: new Date(),
  });
};

// Add socket listeners
socketClient.on('damage-prevention-opportunity', handleDamagePreventionOpportunity);
socketClient.on('option-card-used-for-damage', handleOptionCardUsedForDamage);

// Add to cleanup
socketClient.off('damage-prevention-opportunity', handleDamagePreventionOpportunity);
socketClient.off('option-card-used-for-damage', handleOptionCardUsedForDamage);

// Add component to render
{damagePreventionDialog && (
  <DamagePreventionDialog
    isOpen={damagePreventionDialog.isOpen}
    damageAmount={damagePreventionDialog.damageAmount}
    source={damagePreventionDialog.source}
    optionCards={damagePreventionDialog.optionCards}
    roomCode={roomCode}
    onClose={() => setDamagePreventionDialog(null)}
  />
)}
```

### 5. Implement Specific Card Effects

For Phase 2, implement passive card effects in `/lib/game/gameEngine.ts`:

#### Extra Memory Card
```typescript
// In dealCards method, check for Extra Memory option card
const extraCards = player.optionCards.some(card => 
  card.type === OptionCardType.EXTRA_MEMORY) ? 1 : 0;
const cardsToDeal = Math.max(0, 9 - player.damage + extraCards);
```

#### Fourth Gear Card
```typescript
// In executeMovement method
if (card.type === CardType.MOVE_3 && 
    player.optionCards.some(c => c.type === OptionCardType.FOURTH_GEAR)) {
  moveDistance = 4;
}
```

## Testing Plan

1. **Damage Prevention Flow:**
   - Fire lasers at a robot with option cards
   - Verify dialog appears with 10-second timer
   - Test using multiple cards to prevent damage
   - Verify remaining damage is applied after timeout/acceptance

2. **Edge Cases:**
   - Robot with no option cards (immediate damage)
   - Preventing all damage
   - Timeout without action
   - Multiple robots taking damage simultaneously

3. **Card-Specific Tests:**
   - Extra Memory: Verify extra card dealt
   - Fourth Gear: Verify Move 3 becomes Move 4
   - Ablative Coat: Test 3-damage absorption

## Implementation Order

1. **Phase 1 (Core Damage Prevention):**
   - Implement `applyDamageWithOptions` method
   - Create DamagePreventionDialog component
   - Add socket handlers
   - Integrate with executeLasers

2. **Phase 2 (Extend to All Damage Sources):**
   - Apply to pit damage
   - Apply to falling off board
   - Apply to collision damage (if implemented)

3. **Phase 3 (Specific Card Effects):**
   - Implement passive cards (Extra Memory, Fourth Gear, etc.)
   - Implement active use cards (Brakes, Crab Legs, etc.)
   - Implement special cards (Radio Control, Scrambler, etc.)

## Notes for Claude Code

- The option card system foundation is already in place
- Focus on the damage prevention mechanism first as it's the most critical feature
- The dialog should be non-blocking for other players (only the affected player sees it)
- Consider making the timeout configurable (10 seconds default)
- Ensure proper cleanup of pending damage if a player disconnects
- Test thoroughly with multiple players taking damage simultaneously