# Board Sizing and Layout Documentation

## Overview
The game board automatically resizes to fill available space while maintaining proper aspect ratio. This document explains how the sizing works and how to maintain it.

## Component Structure

```
Game Page Layout
├── Header (minimal height: pt-2, mb-2)
└── Game Area (flex-1)
    ├── Board Container (flex-1)
    │   └── Course Component
    │       └── Board Component (auto-sizing)
    └── Right Sidebar (w-96 fixed)
```

## Sizing Logic

The Board component (`components/game/Board.tsx`) handles automatic resizing:

1. **Container Detection** (lines 39-45)
   - First tries to find `.flex-1.flex.justify-center.items-center`
   - Falls back to any parent with `h-full` class
   - Final fallback: parent's parent element

2. **Size Calculation** (lines 68-69)
   - Horizontal padding: 20px total (10px each side)
   - Vertical padding: 40px total (20px top/bottom)
   - Tile size = min(width/columns, height/rows)
   - Clamped between 30px min and 120px max

3. **Responsive Updates**
   - Window resize events
   - ResizeObserver on parent container
   - Recalculates on board changes

## Critical CSS Classes

**DO NOT REMOVE these classes as they are required for sizing:**

- `flex-1` - Makes containers fill available space
- `min-h-0` - Prevents flex containers from overflowing
- `h-full` - Ensures proper height inheritance
- `w-full` - Ensures proper width inheritance

## Common Issues and Solutions

### Board Too Small
- Check if parent containers have `flex-1` and proper height
- Verify no extra margins/paddings in parent chain
- Check browser console for sizing debug logs

### Board Not Resizing
- Ensure ResizeObserver is watching correct container
- Check if container selector in Board.tsx matches actual DOM
- Verify CSS classes haven't been accidentally removed

### Extra Space Around Board
- Header spacing: `GameHeader.tsx` line 16 (mb-2)
- Page header wrapper: `page.tsx` line 254 (pt-2)
- Board padding calculation: `Board.tsx` lines 68-69

## Testing Board Sizing

1. Open game in different window sizes
2. Check console for "Board sizing:" debug messages
3. Verify board fills space without scrollbars
4. Test with different board dimensions (12x12, 16x12, etc.)

## Maintenance Notes

- The sizing logic is self-contained in Board.tsx
- Debug logging only appears in development mode
- Container detection is robust with multiple fallbacks
- Always test after modifying parent container CSS