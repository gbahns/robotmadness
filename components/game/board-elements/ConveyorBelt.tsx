import React from 'react';

interface ConveyorBeltProps {
  type: 'conveyor' | 'express';
  direction: number;
  rotate?: 'clockwise' | 'counter-clockwise';
  tileSize: number;
}

export default function ConveyorBelt({ type, direction, rotate, tileSize }: ConveyorBeltProps) {
  const isExpress = type === 'express';
  const color = isExpress ? 'bg-blue-400' : 'bg-yellow-600';
  const arrowRotation = (direction || 0) * 90;
  const arrowSize = tileSize * 0.6;

  return (
    <div className={`absolute inset-1 ${color} rounded-sm flex items-center justify-center`}>
      {isExpress && !rotate ? (
        // Express conveyor with double arrows back-to-back
        <div
          className="relative flex items-center justify-center"
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            width: '100%',
            height: '100%'
          }}
        >
          {/* First arrow */}
          <svg
            className="text-gray-900 absolute"
            style={{
              width: `${arrowSize * 0.85}px`,
              height: `${arrowSize * 0.85}px`,
              transform: `translateY(${arrowSize * 0.35}px)`
            }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
          </svg>
          {/* Second arrow */}
          <svg
            className="text-gray-900 absolute"
            style={{
              width: `${arrowSize * 0.85}px`,
              height: `${arrowSize * 0.85}px`,
              transform: `translateY(-${arrowSize * 0.35}px)`
            }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
          </svg>
        </div>
      ) : isExpress && rotate ? (
        // Rotating EXPRESS conveyor - curved arrow plus straight entry arrow
        <svg
          className="text-gray-900"
          style={{
            transform: `rotate(${arrowRotation - 90}deg)`,
            width: `${tileSize}px`,
            height: `${tileSize}px`,
          }}
          fill="currentColor"
          viewBox="-8 -8 40 40"
        >
          {rotate === 'clockwise' ? (
            // Clockwise rotation - enters from bottom, curves right
            <g>
              <path d="M12 24 Q12 12 24 12"
                fill="none" stroke="currentColor" strokeWidth="6" />
              <path d="M21 5 L31 12 L21 19 Z" />
              {/* Straight arrow entering from bottom - pointing up (narrower) */}
              <path d="M12 14 L6 24 L9 24 L9 32 L15 32 L15 24 L18 24 Z" />
            </g>
          ) : (
            // Counter-clockwise rotation - enters from right, exits up (which becomes down after rotation)
            <g>
              <path d="M24 12 Q12 12 12 0"
                fill="none" stroke="currentColor" strokeWidth="6" />
              <path d="M19 5 L29 12 L19 19 Z" />
              {/* Arrow pointing up from top - after rotation will point left from right (narrower) */}
              <path d="M12 10 L6 0 L9 0 L9 -8 L15 -8 L15 0 L18 0 Z" />
            </g>
          )}
        </svg>
      ) : rotate ? (
        // Rotating conveyor with curved arrow
        <svg
          className="text-gray-900"
          style={{
            transform: `rotate(${arrowRotation - 90}deg)`,
            width: `${tileSize}px`,
            height: `${tileSize}px`,
          }}
          fill="currentColor"
          viewBox="-8 -8 40 40"
        >
          {rotate === 'clockwise' ? (
            // Clockwise rotation - enters from bottom, curves right
            <g>
              <path d="M12 24 Q12 12 24 12"
                fill="none" stroke="currentColor" strokeWidth="8" />
              <path d="M21 5 L31 12 L21 19 Z" />
            </g>
          ) : (
            // Counter-clockwise rotation - enters from right, exits up
            <g>
              <path d="M24 12 Q12 12 12 0"
                fill="none" stroke="currentColor" strokeWidth="8" />
              <path d="M19 5 L29 12 L19 19 Z" />
            </g>
          )}
        </svg>
      ) : (
        // Regular straight conveyor arrow
        <svg
          className="text-gray-900"
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            width: `${arrowSize}px`,
            height: `${arrowSize}px`
          }}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
        </svg>
      )}
    </div>
  );
}