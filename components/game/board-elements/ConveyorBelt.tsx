import React from 'react';
import { getRotationDirection } from '@/lib/game/utils/conveyor-migration';

// Sub-component: Black belt center
const BlackBelt = () => (
  <rect x="20" y="0" width="60" height="100" fill="#1a1a1a" />
);

// Sub-component: Side track with tread lines
const SideTrack = ({ side, treadColor, treadLineColor }: { 
  side: 'left' | 'right'; 
  treadColor: string; 
  treadLineColor: string;
}) => {
  const x = side === 'left' ? 2 : 80;
  return (
    <>
      <rect x={x} y="0" width="18" height="100" fill={treadColor} />
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(y => (
        <rect key={`${side}-${y}`} x={x} y={y} width="18" height="3" fill={treadLineColor} />
      ))}
    </>
  );
};

// Sub-component: Arrow line (without head)
const ArrowLine = ({ start, end, color, width = 10, opacity = 1 }: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  width?: number;
  opacity?: number;
}) => (
  <path 
    d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
    fill="none" 
    stroke={color} 
    strokeWidth={width} 
    opacity={opacity}
  />
);

// Sub-component: Arrow head
const ArrowHead = ({ x, y, direction, color, size = 15, opacity = 1 }: {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  color: string;
  size?: number;
  opacity?: number;
}) => {
  const half = size / 2;
  let path = '';
  
  switch(direction) {
    case 'up':
      path = `M ${x - half} ${y} L ${x} ${y - size} L ${x + half} ${y} Z`;
      break;
    case 'down':
      path = `M ${x - half} ${y} L ${x} ${y + size} L ${x + half} ${y} Z`;
      break;
    case 'left':
      path = `M ${x} ${y - half} L ${x - size} ${y} L ${x} ${y + half} Z`;
      break;
    case 'right':
      path = `M ${x} ${y - half} L ${x + size} ${y} L ${x} ${y + half} Z`;
      break;
  }
  
  return <path d={path} fill={color} opacity={opacity} />;
};

// Sub-component: Curved black belt center
const CurvedBlackBelt = () => (
  <path d="M 50 89 Q 50 50 89 50"
    fill="none" stroke="#1a1a1a" strokeWidth="60" strokeLinecap="square" />
);

// Sub-component: Outer curved side track (base only)
const OuterCurvedTrack = ({ treadColor }: { 
  treadColor: string;
}) => (
  <path d="M 20 98 Q 20 20 98 20"
    fill="none" stroke={treadColor} strokeWidth="36" />
);

// Sub-component: Outer curved tread lines (rendered separately for z-order)
const OuterCurvedTreadLines = ({ treadLineColor }: { 
  treadLineColor: string;
}) => (
  <>
    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => {
      const progress = t / 90;
      // The outer tread follows path M 20 98 Q 20 20 98 20
      // Using quadratic bezier formula
      const tx = 20 + (20 - 20) * progress + (98 - 20) * progress * progress;
      const ty = 98 + (20 - 98) * 2 * progress * (1 - progress) + (20 - 98) * progress * progress;
      
      // Calculate perpendicular to the curve for tread line direction
      const dx = 2 * (1 - progress) * (20 - 20) + 2 * progress * (98 - 20);
      const dy = 2 * (1 - progress) * (20 - 98) + 2 * progress * (20 - 20);
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      
      const lineLength = 18;
      const x1 = tx - lineLength * Math.cos(angle);
      const y1 = ty - lineLength * Math.sin(angle);
      // Shorten the other end to keep it out of the black belt
      const x2 = tx - 2 * Math.cos(angle);
      const y2 = ty - 2 * Math.sin(angle);
      
      return (
        <line key={`outer-${t}`} x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke={treadLineColor} strokeWidth="3" />
      );
    })}
  </>
);

// Sub-component: Inner curved side track
const InnerCurvedTrack = ({ treadColor }: { treadColor: string }) => (
  <path d="M 88 98 Q 88 88 98 88"
    fill="none" stroke={treadColor} strokeWidth="18" />
);

// Sub-component: Curved arrow line
const CurvedArrowLine = ({ color, width = 16, opacity = 1 }: {
  color: string;
  width?: number;
  opacity?: number;
}) => (
  <path d="M 50 90 Q 50 50 90 50"
    fill="none" stroke={color} strokeWidth={width} opacity={opacity} />
);

// Parent component: Straight Conveyor (combines all straight conveyor elements)
const StraightConveyor = ({ arrowRotation, treadColor, treadLineColor, arrowColor, isExpress = false }: {
  arrowRotation: number;
  treadColor: string;
  treadLineColor: string;
  arrowColor: string;
  isExpress?: boolean;
}) => (
  <svg
    className="absolute inset-0"
    style={{
      transform: `rotate(${arrowRotation}deg)`,
      width: '100%',
      height: '100%'
    }}
    viewBox="0 0 100 100"
  >
    <SideTrack side="left" treadColor={treadColor} treadLineColor={treadLineColor} />
    <SideTrack side="right" treadColor={treadColor} treadLineColor={treadLineColor} />
    <BlackBelt />
    {isExpress ? (
      <>
        {/* Double arrows for express - wider, shorter, bigger arrowheads */}
        <svg x="25" y="10" width="50" height="35" viewBox="0 0 24 28">
          <path d="M12 0 L22 14 L17 14 L17 28 L7 28 L7 14 L2 14 Z" fill={arrowColor} />
        </svg>
        <svg x="25" y="50" width="50" height="35" viewBox="0 0 24 28">
          <path d="M12 0 L22 14 L17 14 L17 28 L7 28 L7 14 L2 14 Z" fill={arrowColor} />
        </svg>
      </>
    ) : (
      <svg x="25" y="10" width="50" height="80" viewBox="0 0 24 32">
        <path d="M12 2 L20 12 L16 12 L16 30 L8 30 L8 12 L4 12 Z" fill={arrowColor} />
      </svg>
    )}
  </svg>
);

// Parent component: T-Merge Conveyor (2 curves merging from opposite sides)
const TMergeConveyor = ({ arrowRotation, treadColor, treadLineColor, arrowColor }: {
  arrowRotation: number;
  treadColor: string;
  treadLineColor: string;
  arrowColor: string;
}) => (
  <svg
    className="absolute inset-0 w-full h-full"
    style={{
      transform: `rotate(${arrowRotation}deg)`,
    }}
    viewBox="0 0 100 100"
  >
    {/* Render side tracks first (in the back) */}
    {/* Straight side tracks for exit */}
    <SideTrack side="left" treadColor={treadColor} treadLineColor={treadLineColor} />
    <SideTrack side="right" treadColor={treadColor} treadLineColor={treadLineColor} />
    
    {/* Outer curved side tracks */}
    {/* Clockwise curve outer track from left entry */}
    <g transform="rotate(180 50 50)">
      <OuterCurvedTrack treadColor={treadColor} />
      <OuterCurvedTreadLines treadLineColor={treadLineColor} />
    </g>
    
    {/* Counter-clockwise curve outer track from right entry */}
    <g transform="rotate(270 50 50)">
      <OuterCurvedTrack treadColor={treadColor} />
      <OuterCurvedTreadLines treadLineColor={treadLineColor} />
    </g>
    
    {/* Render black belts on top of side tracks (no straight belt for T-merge) */}
    {/* Clockwise curve black belt from left entry */}
    <g transform="rotate(180 50 50)">
      <CurvedBlackBelt />
    </g>
    
    {/* Counter-clockwise curve black belt from right entry */}
    <g transform="rotate(270 50 50)">
      <CurvedBlackBelt />
    </g>
    
    {/* Finally render all arrows on top */}
    {/* Main exit arrow - matching curved entry style */}
    <path d="M 35 15 L 50 0 L 65 15 Z" fill={arrowColor} />
    
    {/* Clockwise curve arrow from left entry */}
    <g transform="rotate(180 50 50)">
      <CurvedArrowLine color={arrowColor} width={12} />
      <path d="M 35 85 L 50 100 L 65 85 Z" fill={arrowColor} />
    </g>
    
    {/* Counter-clockwise curve arrow from right entry */}
    <g transform="rotate(270 50 50)">
      <CurvedArrowLine color={arrowColor} width={12} />
      <path d="M 85 35 L 100 50 L 85 65 Z" fill={arrowColor} />
    </g>
  </svg>
);

// Parent component: Left Merge Conveyor (straight from bottom, curve from left)
const LeftMergeConveyor = ({ arrowRotation, treadColor, treadLineColor, arrowColor, isExpress = false }: {
  arrowRotation: number;
  treadColor: string;
  treadLineColor: string;
  arrowColor: string;
  isExpress?: boolean;
}) => (
  <svg
    className="absolute inset-0 w-full h-full"
    style={{
      transform: `rotate(${arrowRotation}deg)`,
    }}
    viewBox="0 0 100 100"
  >
    {/* Both side tracks (full length) */}
    <SideTrack side="left" treadColor={treadColor} treadLineColor={treadLineColor} />
    <SideTrack side="right" treadColor={treadColor} treadLineColor={treadLineColor} />
    
    {/* Center black belt */}
    <BlackBelt />
    
    {/* Counter-clockwise curve from left - just the black belt and arrow, no side tracks */}
    <g transform="rotate(270 50 50)">
      <CurvedBlackBelt />
      <CurvedArrowLine color={arrowColor} />
      {/* Entry arrowhead for the curve */}
      <path d="M 85 35 L 100 50 L 85 65 Z" fill={arrowColor} />
    </g>
    
    {/* Straight arrow from bottom - rendered on top with arrowhead */}
    {isExpress ? (
      <>
        <rect x="42" y="10" width="16" height="35" fill={arrowColor} />
        <rect x="42" y="70" width="16" height="15" fill={arrowColor} />
        {/* Entry arrowhead - matching curved entry style */}
        <path d="M 35 70 L 50 55 L 65 70 Z" fill={arrowColor} />
      </>
    ) : (
      <svg x="25" y="10" width="50" height="80" viewBox="0 0 24 32">
        <rect x="8" y="-2" width="8" height="34" fill={arrowColor} />
      </svg>
    )}
    
    {/* Main exit arrow - matching curved entry style */}
    <path d="M 35 15 L 50 0 L 65 15 Z" fill={arrowColor} />
  </svg>
);

// Parent component: Right Merge Conveyor (straight from bottom, curve from right)
const RightMergeConveyor = ({ arrowRotation, treadColor, treadLineColor, arrowColor, isExpress = false }: {
  arrowRotation: number;
  treadColor: string;
  treadLineColor: string;
  arrowColor: string;
  isExpress?: boolean;
}) => (
  <svg
    className="absolute inset-0 w-full h-full"
    style={{
      transform: `rotate(${arrowRotation}deg)`,
    }}
    viewBox="0 0 100 100"
  >
    {/* Both side tracks (full length) */}
    <SideTrack side="left" treadColor={treadColor} treadLineColor={treadLineColor} />
    <SideTrack side="right" treadColor={treadColor} treadLineColor={treadLineColor} />
    
    {/* Center black belt */}
    <BlackBelt />
    
    {/* Clockwise curve from right - just the black belt and arrow, no side tracks */}
    <g transform="rotate(180 50 50)">
      <CurvedBlackBelt />
      <CurvedArrowLine color={arrowColor} />
      {/* Entry arrowhead for the curve */}
      <path d="M 35 85 L 50 100 L 65 85 Z" fill={arrowColor} />
    </g>
    
    {/* Straight arrow from bottom - rendered on top with arrowhead */}
    {isExpress ? (
      <>
        <rect x="42" y="10" width="16" height="35" fill={arrowColor} />
        <rect x="42" y="70" width="16" height="15" fill={arrowColor} />
        {/* Entry arrowhead - matching curved entry style */}
        <path d="M 35 70 L 50 55 L 65 70 Z" fill={arrowColor} />
      </>
    ) : (
      <svg x="25" y="10" width="50" height="80" viewBox="0 0 24 32">
        <rect x="8" y="-2" width="8" height="34" fill={arrowColor} />
      </svg>
    )}
    
    {/* Main exit arrow - matching curved entry style */}
    <path d="M 35 15 L 50 0 L 65 15 Z" fill={arrowColor} />
  </svg>
);

// Parent component: Curved Conveyor (combines all curved conveyor elements)
const CurvedConveyor = ({ arrowRotation, rotation, treadColor, treadLineColor, arrowColor, isExpress = false }: {
  arrowRotation: number;
  rotation: 'clockwise' | 'counterclockwise';
  treadColor: string;
  treadLineColor: string;
  arrowColor: string;
  isExpress?: boolean;
}) => {
  const rotationDegrees = rotation === 'clockwise' ? 180 : 270;
  
  return (
    <svg
      className="absolute inset-0"
      style={{
        transform: `rotate(${arrowRotation}deg)`,
        width: '100%',
        height: '100%'
      }}
      viewBox="0 0 100 100"
    >
      <g transform={`rotate(${rotationDegrees} 50 50)`}>
        <OuterCurvedTrack treadColor={treadColor} />
        <CurvedBlackBelt />
        <InnerCurvedTrack treadColor={treadColor} />
        <OuterCurvedTreadLines treadLineColor={treadLineColor} />
        {isExpress ? (
          /* Single curved arrow for express - wider to match non-express */
          <CurvedArrowLine color={arrowColor} width={16} />
        ) : (
          <CurvedArrowLine color={arrowColor} />
        )}
        {/* Entry arrowhead */}
        {rotation === 'clockwise' ? (
          <path d="M 35 85 L 50 100 L 65 85 Z" fill={arrowColor} />
        ) : (
          <path d="M 85 35 L 100 50 L 85 65 Z" fill={arrowColor} />
        )}
      </g>
    </svg>
  );
};

interface ConveyorBeltProps {
  type: 'conveyor' | 'express';
  direction: number;  // Exit direction
  rotate?: 'clockwise' | 'counterclockwise'; // Deprecated
  entries?: number[]; // Entry directions
  tileSize: number;
}

export default function ConveyorBelt({ type, direction, rotate, entries, tileSize }: ConveyorBeltProps) {
  // Determine if this is a rotating conveyor based on entries
  let effectiveRotate: 'clockwise' | 'counterclockwise' | undefined = rotate;
  let isMergeConveyor = false;
  
  if (entries && entries.length > 0) {
    // Check if we have multiple entries (merge conveyor)
    if (entries.length > 1) {
      isMergeConveyor = true;
      console.log('Merge conveyor detected:', { entries, direction, type });
      // For merge conveyors, don't set effectiveRotate - we'll handle it differently
      // We want to show all merge paths, not just rotate based on one
    } else {
      // Single entry - check if it creates a 90-degree turn
      const rotationType = getRotationDirection(entries[0], direction);
      if (rotationType === 'clockwise' || rotationType === 'counterclockwise') {
        effectiveRotate = rotationType;
      }
    }
    
    // If no 90-degree entry found but we had a rotate prop, keep it
    if (!effectiveRotate && rotate && !isMergeConveyor) {
      effectiveRotate = rotate;
    }
  }
  
  const isExpress = type === 'express';
  const arrowRotation = (direction || 0) * 90;
  const treadColor = isExpress ? '#87CEEB' : '#f5e6a3';  // Light blue for express, pale yellow for regular
  const treadLineColor = isExpress ? '#5F9FBF' : '#d4c57a';  // Darker blue for express, darker yellow for regular
  const arrowColor = isExpress ? '#4682B4' : '#b8860b';  // Steel blue for express, dark gold for regular

  console.log('ConveyorBelt render:', { 
    isMergeConveyor, 
    isExpress, 
    effectiveRotate,
    entries,
    direction,
    willRenderMerge: isMergeConveyor,
    willRenderStraight: !effectiveRotate && !isMergeConveyor
  });

  return (
    <div className="absolute inset-1 rounded-sm">
      {isMergeConveyor ? (
        // Merge conveyor - determine type and render appropriate component
        (() => {
          // Analyze entry types to determine merge conveyor type
          let hasStraightEntry = false;
          let hasLeftEntry = false;
          let hasRightEntry = false;
          
          if (entries && entries.length === 2) {
            for (const entry of entries) {
              const rotationType = getRotationDirection(entry, direction);
              
              if (rotationType === 'straight') {
                hasStraightEntry = true;
              } else if (rotationType === 'counterclockwise') {
                // Counter-clockwise means entry from left relative to exit
                hasLeftEntry = true;
              } else if (rotationType === 'clockwise') {
                // Clockwise means entry from right relative to exit
                hasRightEntry = true;
              }
            }
            
            // Check for T-merge (both entries are 90-degree turns from opposite sides)
            if (hasLeftEntry && hasRightEntry && !hasStraightEntry) {
              return <TMergeConveyor 
                arrowRotation={arrowRotation}
                treadColor={treadColor}
                treadLineColor={treadLineColor}
                arrowColor={arrowColor}
              />;
            }
            // Check for right merge (straight + right curve)
            else if (hasStraightEntry && hasRightEntry) {
              return <RightMergeConveyor
                arrowRotation={arrowRotation}
                treadColor={treadColor}
                treadLineColor={treadLineColor}
                arrowColor={arrowColor}
                isExpress={isExpress}
              />;
            }
            // Check for left merge (straight + left curve)
            else if (hasStraightEntry && hasLeftEntry) {
              return <LeftMergeConveyor
                arrowRotation={arrowRotation}
                treadColor={treadColor}
                treadLineColor={treadLineColor}
                arrowColor={arrowColor}
                isExpress={isExpress}
              />;
            }
          }
          
          // Fallback to old rendering if we can't determine type
          return (
            <div className="absolute inset-0">
              {/* Base conveyor belt for the exit direction */}
              <svg
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `rotate(${arrowRotation}deg)`,
                }}
                viewBox="0 0 100 100"
              >
                <SideTrack side="left" treadColor={treadColor} treadLineColor={treadLineColor} />
                <SideTrack side="right" treadColor={treadColor} treadLineColor={treadLineColor} />
                <BlackBelt />
                <ArrowHead x={50} y={15} direction="up" color={arrowColor} />
              </svg>
          
          {/* Render merge paths for each entry */}
          {entries?.map((entry, index) => {
            const rotationType = getRotationDirection(entry, direction);
            console.log(`Entry ${index}:`, { entry, direction, rotationType });
            
            // For straight/180-degree entries, show a straight merge path
            if (rotationType === 'straight') {
              // Calculate how to draw the arrow from entry to exit
              // Entry direction is where the robot comes FROM, so we need the opposite for drawing
              const entryOpposite = (entry + 2) % 4;
              const relativeRotation = (entryOpposite - direction + 4) % 4;
              
              return (
                <svg
                  key={`straight-${index}`}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    transform: `rotate(${arrowRotation}deg)`,
                  }}
                  viewBox="0 0 100 100"
                >
                  {/* Straight merge arrow from entry */}
                  <g transform={`rotate(${relativeRotation * 90} 50 50)`}>
                    <ArrowLine 
                      start={{x: 50, y: 100}} 
                      end={{x: 50, y: 50}} 
                      color={arrowColor} 
                      opacity={0.7} 
                    />
                    <ArrowHead x={50} y={50} direction="up" color={arrowColor} size={10} opacity={0.7} />
                  </g>
                </svg>
              );
            }
            return null;
          })}
          
          {/* Then render curved merge paths */}
          {entries?.map((entry, index) => {
            const rotationType = getRotationDirection(entry, direction);
            
            if (rotationType === 'clockwise' || rotationType === 'counterclockwise') {
              console.log(`Rendering curved entry ${index}:`, { entry, direction, rotationType });
              return (
                <svg
                  key={`curved-${index}`}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    transform: `rotate(${arrowRotation}deg)`,
                  }}
                  viewBox="0 0 100 100"
                >
                  {rotationType === 'clockwise' ? (
                    // Clockwise curve - just the arrow, no full tracks
                    <g transform="rotate(180 50 50)">
                      <CurvedArrowLine color={arrowColor} width={12} opacity={0.8} />
                      {/* Small arrowhead at merge point */}
                      <ArrowHead x={90} y={50} direction="right" color={arrowColor} size={10} opacity={0.8} />
                    </g>
                  ) : (
                    // Counter-clockwise curve - just the arrow, no full tracks
                    <g transform="rotate(270 50 50)">
                      <CurvedArrowLine color={arrowColor} width={12} opacity={0.8} />
                      {/* Small arrowhead at merge point */}
                      <ArrowHead x={50} y={90} direction="down" color={arrowColor} size={10} opacity={0.8} />
                    </g>
                  )}
                </svg>
              );
            }
            return null;
          })}
            </div>
          );
        })()
      ) : !effectiveRotate && false ? (
        // DISABLED - Straight conveyor with tracks
        <StraightConveyor 
          arrowRotation={arrowRotation}
          treadColor={treadColor} 
          treadLineColor={treadLineColor} 
          arrowColor={arrowColor} 
        />
      ) : isExpress && !effectiveRotate ? (
        // Express straight conveyor
        <StraightConveyor 
          arrowRotation={arrowRotation}
          treadColor={treadColor} 
          treadLineColor={treadLineColor} 
          arrowColor={arrowColor}
          isExpress={true}
        />
      ) : isExpress && effectiveRotate ? (
        // Express rotating conveyor
        <CurvedConveyor 
          arrowRotation={arrowRotation}
          rotation={effectiveRotate}
          treadColor={treadColor} 
          treadLineColor={treadLineColor} 
          arrowColor={arrowColor}
          isExpress={true}
        />
      ) : effectiveRotate ? (
        // Rotating conveyor with both curved arrow AND merge arrow
        <CurvedConveyor 
          arrowRotation={arrowRotation}
          rotation={effectiveRotate}
          treadColor={treadColor} 
          treadLineColor={treadLineColor} 
          arrowColor={arrowColor} 
        />
      ) : !isMergeConveyor ? (
        // Regular straight conveyor arrow
        <StraightConveyor 
          arrowRotation={arrowRotation}
          treadColor={treadColor} 
          treadLineColor={treadLineColor} 
          arrowColor={arrowColor} 
        />
      ) : null}
    </div>
  );
}