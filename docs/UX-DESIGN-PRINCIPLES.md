# UX Design Principles for RobotMadness

## Core Philosophy
The user interface should enhance gameplay, not obstruct it. Every UI decision should prioritize player agency, game flow, and strategic decision-making.

## Design Principles

### 1. Avoid Modal Dialogs for Game Decisions

**Principle:** Game decision interfaces should be non-modal and integrated into the game UI, allowing players to maintain visual context of the game board while making decisions.

**Rationale:**
- Players need to see the game state to make informed tactical decisions
- The board position, other robots, hazards, and objectives all influence player choices
- Blocking the view with modals disrupts the decision-making process and may lead to suboptimal plays

**Implementation Guidelines:**

1. **Use Inline Panels Instead of Modals**
   - Place decision interfaces in the sidebar or as overlays that don't obscure the game board
   - Keep decision panels compact and positioned to maintain board visibility
   - Example: Respawn decisions, power-down choices, card selection

2. **When to Use Modals (Exceptions)**
   - Only for non-gameplay decisions where board context is irrelevant:
     - Initial game setup (player name, room creation)
     - Game over/victory screens
     - Connection errors or critical system messages
     - Confirmation of destructive actions (leaving game, etc.)

3. **Design Patterns for Game Decisions**
   - **Sidebar Panels:** Primary method for decision interfaces
   - **Bottom Drawer:** For card selection and hand management
   - **Floating Action Buttons:** For simple binary choices
   - **Toast Notifications:** For non-blocking status updates

4. **Visual Hierarchy**
   - Decision panels should be visually prominent but not dominant
   - Use borders, shadows, or background colors to distinguish decision areas
   - Maintain consistent positioning to avoid confusing players

**Example Implementation:**
```typescript
// ❌ Avoid: Modal that blocks game view
<Modal isOpen={showDecision}>
  <RespawnDecision />
</Modal>

// ✅ Preferred: Inline panel in sidebar
{showDecision && (
  <div className="sidebar-panel">
    <RespawnDecisionPanel />
  </div>
)}
```

**Benefits:**
- Improved decision quality through maintained context
- Faster gameplay with less visual disruption
- Better multiplayer experience (can see other players' actions)
- Reduced player frustration from misclicks due to lack of information

**Applies to:**
- Power-down decisions
- Respawn choices and direction selection
- Upgrade selections
- Card programming decisions
- Any tactical choice requiring board awareness

### 2. Visual Feedback and Game State Clarity

**Principle:** Players should always understand the current game state and their available actions.

**Guidelines:**
- Use consistent color coding for player states (powered down, damaged, etc.)
- Provide clear visual indicators for the current phase
- Show countdown timers for time-limited decisions
- Highlight valid actions and disable invalid ones

### 3. Responsive and Accessible Design

**Principle:** The game should be playable across different screen sizes and accessible to all players.

**Guidelines:**
- Ensure touch-friendly controls for tablet play
- Maintain minimum target sizes for interactive elements (44x44px)
- Provide keyboard shortcuts for common actions
- Use sufficient color contrast for readability
- Don't rely solely on color to convey information

### 4. Minimize Cognitive Load

**Principle:** Reduce the mental effort required to play the game by presenting information clearly.

**Guidelines:**
- Group related information together
- Use progressive disclosure for complex information
- Provide tooltips for game elements
- Maintain consistent layouts across different game phases
- Show only relevant information for the current phase

### 5. Multiplayer Awareness

**Principle:** Players should be aware of other players' actions and states without being overwhelmed.

**Guidelines:**
- Show player actions in the activity log
- Use subtle animations for other players' moves
- Display player status indicators (thinking, disconnected, etc.)
- Provide options to review previous moves
- Keep player list visible and informative

## Component-Specific Guidelines

### Game Board
- Should remain visible and central at all times during gameplay
- Zoom and pan controls should be easily accessible
- Grid coordinates should be visible for planning

### Card/Programming Interface
- Cards should be large enough to read clearly
- Drag-and-drop should have clear visual feedback
- Selected cards should be visually distinct
- Lock indicators for damaged registers should be prominent

### Player Information
- Current player should be clearly highlighted
- Health/damage should use intuitive visualization
- Power state should have clear visual indicator
- Lives remaining should be immediately visible

### Decision Panels
- Should appear in consistent locations
- Must not cover critical game information
- Should have clear call-to-action buttons
- Timer/urgency should be indicated when relevant

## Testing Checklist

When implementing new UI features, verify:
- [ ] Game board remains visible during decisions
- [ ] All interactive elements are accessible
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44x44px
- [ ] Feature works on mobile/tablet viewports
- [ ] Loading states are handled gracefully
- [ ] Error states provide helpful feedback
- [ ] Animations don't cause motion sickness
- [ ] Feature is intuitive without instructions

## Future Considerations

As the game evolves, maintain these principles while considering:
- Spectator mode requirements
- Tournament/competitive play needs
- Streaming-friendly layouts
- Colorblind modes
- Internationalization requirements

---

*This document should be reviewed and updated whenever significant UI changes are proposed or usability issues are identified.*