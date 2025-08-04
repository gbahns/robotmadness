# AI Partner Guide

## Purpose
This guide defines how I should interact with you to effectively build the RoboRally game. It establishes clear patterns for communication, code delivery, and progress tracking.

## Core Principles

### 1. Source of Truth Hierarchy
1. **Next Steps**: docs/backlg.md - lists the specific features we're implementing or issues we're fixing next
2. **Primary**: `docs/requirements.md` - This is our authoritative source
3. **Secondary**: Official RoboRally Rules (2005 Avalon Hill edition)
4. **Note Conflicts**: Always explicitly highlight when our requirements differ from official rules

Example:
```
"According to our requirements (REQ-MOVE-5), robots can push multiple robots in a chain.
Note: This differs from some RoboRally editions where chain pushing is limited."
```

Here's a summary of our updated agreement for the AI Partner Guide:

## 2. Code Delivery Standards

### When to Provide Complete Files vs. Targeted Changes
- **Provide complete file** when changes are >75% of the file's total lines
- **Provide targeted changes** when changes are <75% of the file's total lines

### Format for Targeted Changes
When providing targeted changes:
1. **Use separate artifacts** for each distinct change - never combine multiple changes in one artifact
2. **Each artifact should contain ONLY the code to copy** - no extra explanation or context within the code block (so the Copy button works cleanly)
3. **Clear action words in titles** - use "ADD", "REPLACE", "MODIFY", etc.
4. **Always include filepath in artifact title** - e.g., "server.js - ADD these helper functions after dealCards"

### Benefits of This Approach
- **Token efficiency** - saves significant tokens on large files with small changes
- **Learning opportunity** - you understand changes better by applying them
- **Clear tracking** - separate artifacts make it easy to track what's been applied
- **Flexibility** - adapts to the scope of changes needed

### Always Required (unchanged)
- Never use "..." or "// rest of code unchanged" 
- Always be explicit about what action to take
- Include all imports, exports, and dependencies in the provided code

This approach balances efficiency with clarity while respecting that you learn more by actively applying changes rather than blindly copying entire files.

#### Example Format
```typescript
// File: /components/game/Board.tsx

import React from 'react';
import { GameState } from '@/lib/game/types';

export default function Board({ gameState }: { gameState: GameState }) {
  // Complete implementation here
  return (
    <div className="game-board">
      {/* Full component code */}
    </div>
  );
}
```

### 3. Session Change Tracking

#### Maintain a Running Change Log
At the start of each session, I should ask: "Should I start a new change log or continue from a previous session?"

#### Change Log Format
```markdown
## Session Changes - [Current Date]

### Files Created:
1. `/lib/game/movement.ts` - Robot movement logic implementation
2. `/components/game/Timer.tsx` - Turn timer component

### Files Modified:
1. `/lib/game/engine.ts` - Added REQ-MOVE-1 through REQ-MOVE-5 implementations
2. `/lib/game/types.ts` - Added MovementResult interface
3. `/components/game/Board.tsx` - Integrated movement animations

### Requirements Implemented:
- REQ-MOVE-1: Basic forward movement ✅
- REQ-MOVE-2: Backward movement ✅
- REQ-MOVE-5: Push other robots (partial)

### Key Changes:
- Implemented priority-based movement resolution
- Added collision detection system
- Created movement animation queue
- Fixed robot position sync issue

### Next Steps:
- Complete chain pushing (REQ-MOVE-6)
- Add wall collision detection (REQ-MOVE-7)
- Implement board boundary checks
```

### 4. Interaction Patterns

#### When You Ask for Help
I should:
1. First check the requirements document for relevant REQ-IDs
2. Reference official rules if needed
3. Identify any conflicts between sources
4. Provide complete, working code files
5. Update the session change log

#### Code Review Pattern
When reviewing existing code:
```markdown
I found these issues with `/lib/game/engine.ts`:
1. Line 45: Missing implementation for REQ-MOVE-7 (wall collision)
2. Line 67: Priority calculation doesn't match REQ-EXEC-2
3. Missing error handling for invalid moves

Here's the complete corrected file:
[Full file content]
```

#### Feature Implementation Pattern
```markdown
To implement [feature name], we need to:

1. Create/modify these files:
   - `/lib/game/newFeature.ts` (new)
   - `/lib/game/engine.ts` (modify)

2. This implements requirements:
   - REQ-XXX-1: [Description]
   - REQ-XXX-2: [Description]

3. Note: This differs from official rules in that [explanation]

[Complete file contents follow]
```

### 5. Testing and Verification

#### Test File Delivery
When providing tests, include complete test files:
```typescript
// File: /lib/game/__tests__/movement.test.ts

import { describe, it, expect } from 'vitest';
import { moveRobot } from '../movement';

describe('REQ-MOVE-1: Basic forward movement', () => {
  it('should move robot forward one space', () => {
    // Complete test implementation
  });
});
```

#### Verification Checklist
Before providing code, I should verify:
- [ ] Code implements the correct requirement IDs
- [ ] No partial files or snippets
- [ ] File paths are absolute from project root
- [ ] Any rule differences are noted
- [ ] Session change log is updated

### 6. Communication Standards

#### Clear Requirement References
- Always cite requirement IDs: "According to REQ-MOVE-5..."
- Link related requirements: "This affects REQ-MOVE-6 and REQ-PUSH-2"
- Note dependencies: "Requires REQ-DMG-1 to be implemented first"

#### Progress Updates
Regularly provide status updates:
```markdown
Current Progress:
- Completed: REQ-MOVE-1, REQ-MOVE-2
- In Progress: REQ-MOVE-5 (chain pushing logic remaining)
- Blocked: REQ-LASER-1 (waiting for board element system)
```

### 7. Error Handling

#### When Issues Arise
1. Identify the specific requirement affected
2. Check if our requirements conflict with official rules
3. Propose a solution with complete code
4. Note any side effects on other requirements

### 8. Documentation Updates

When code changes affect documentation:
```markdown
This change requires updating:
1. `/docs/requirements.md` - Mark REQ-MOVE-1 as complete
2. `/README.md` - Update setup instructions
3. `/docs/api.md` - Add new endpoint documentation
```

## Session Workflow

### Starting a Session
1. Ask about continuing or starting fresh change log
2. Review current implementation status
3. Identify session goals from requirements tracker

### During Development
1. Always provide complete files
2. Reference requirement IDs
3. Note any rule variations
4. Update change log after each file
5. Deliver results as quickly as possible (e.g. type instantaneously; don't animate your typing)

### Ending a Session
1. Provide complete session change summary
2. List all affected files
3. Suggest git commit message
4. Identify next priority items

## Git Commit Message Template
Based on session changes:
```
feat: Implement robot movement system (REQ-MOVE-1 through REQ-MOVE-5)

Files Created:
- /lib/game/movement.ts
- /components/game/Timer.tsx

Files Modified:
- /lib/game/engine.ts
- /lib/game/types.ts
- /components/game/Board.tsx

Requirements Implemented:
- REQ-MOVE-1: Basic forward movement
- REQ-MOVE-2: Backward movement
- REQ-MOVE-5: Push other robots (partial)

Key changes:
- Added priority-based movement resolution
- Implemented collision detection
- Created movement animation queue
```

## Quick Reference

### Do's ✅
- Provide complete files
- Use absolute paths from project root
- Reference requirement IDs
- Note rule differences
- Keep change log updated
- Include all imports/exports
- type your responses instantaneously
- write and modify code instantaneously

### Don'ts ❌
- Give code snippets
- Use relative paths
- Assume context from previous messages
- Skip requirement references
- Forget the change log
- Use placeholders like "..."
- animate your typing

---

*This guide ensures consistent, efficient collaboration and clear code delivery throughout the RoboRally development process.*