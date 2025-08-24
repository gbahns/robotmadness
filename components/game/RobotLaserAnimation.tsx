// /components/game/RobotLaserAnimation.tsx
import React, { useEffect, useState } from 'react';
import { Player, Position } from '@/lib/game/types';

export interface RobotLaserShot {
    shooterId: string;
    path: Position[];
    targetId?: string;
    timestamp: number;
}

interface RobotLaserAnimationProps {
    players: Record<string, Player>;
    activeLasers: RobotLaserShot[];
    tileSize: number;
}


export default function RobotLaserAnimation({ players, activeLasers, tileSize }: RobotLaserAnimationProps) {
    const [visibleLasers, setVisibleLasers] = useState<RobotLaserShot[]>([]);

    useEffect(() => {
        // Show lasers and set timer to hide them after animation duration
        const newVisibleLasers = [...activeLasers];
        setVisibleLasers(newVisibleLasers);

        const timers = newVisibleLasers.map((laser) => {
            return setTimeout(() => {
                setVisibleLasers(prev => prev.filter(l => l.timestamp !== laser.timestamp));
            }, 500); // Laser visible for 500ms
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [activeLasers]);

    const renderLaserBeam = (laser: RobotLaserShot) => {
        const shooter = players[laser.shooterId];
        if (!shooter || laser.path.length === 0) return null;

        // Direction vectors to determine laser orientation
        const isHorizontal = shooter.direction === 1 || shooter.direction === 3; // East or West

        const elements = [];

        // Render the laser beam path
        laser.path.forEach((pos, index) => {
            const beamWidth = 3;
            const beamLength = tileSize;

            // Position calculations
            let left = pos.x * tileSize;
            let top = pos.y * tileSize;

            // Center the beam on the tile
            if (isHorizontal) {
                top += (tileSize - beamWidth) / 2;
            } else {
                left += (tileSize - beamWidth) / 2;
            }

            // Create a unique key for this beam segment
            const key = `robot-laser-${laser.shooterId}-${laser.timestamp}-${index}`;

            elements.push(
                <React.Fragment key={key}>
                    {/* Main laser beam with animation */}
                    <div
                        className="absolute"
                        style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: isHorizontal ? `${beamLength}px` : `${beamWidth}px`,
                            height: isHorizontal ? `${beamWidth}px` : `${beamLength}px`,
                            backgroundColor: '#dc2626',
                            boxShadow: '0 0 8px #ef4444, 0 0 16px #dc2626',
                            zIndex: 20,
                            opacity: 0,
                            animation: 'laserFire 0.5s ease-out'
                        }}
                    />

                    {/* Glow effect */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: `${left - 8}px`,
                            top: `${top - 8}px`,
                            width: isHorizontal ? `${beamLength + 16}px` : `${beamWidth + 16}px`,
                            height: isHorizontal ? `${beamWidth + 16}px` : `${beamLength + 16}px`,
                            background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.6) 0%, transparent 70%)',
                            filter: 'blur(8px)',
                            zIndex: 19,
                            opacity: 0,
                            animation: 'laserGlow 0.5s ease-out'
                        }}
                    />
                </React.Fragment>
            );
        });

        // Add explosion effect if laser hit a target
        if (laser.targetId && laser.path.length > 0) {
            const lastPos = laser.path[laser.path.length - 1];
            const explosionX = lastPos.x * tileSize + tileSize / 2;
            const explosionY = lastPos.y * tileSize + tileSize / 2;

            elements.push(
                <div
                    key={`explosion-${laser.shooterId}-${laser.timestamp}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${explosionX}px`,
                        top: `${explosionY}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 45
                    }}
                >
                    {/* Explosion burst effect */}
                    <div
                        className="absolute"
                        style={{
                            width: '50px',
                            height: '50px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(255, 0, 0, 0.4)',
                            borderRadius: '50%',
                            animation: 'robotHitExplosion 0.5s ease-out'
                        }}
                    />

                    {/* Impact core */}
                    <div
                        className="absolute"
                        style={{
                            width: '25px',
                            height: '25px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(255,255,0,0.9) 0%, rgba(255,0,0,0.7) 40%, transparent 100%)',
                            borderRadius: '50%',
                            boxShadow: '0 0 25px rgba(255, 0, 0, 0.9), 0 0 50px rgba(255, 255, 0, 0.7)',
                            animation: 'pulse 0.3s ease-in-out 2'
                        }}
                    />

                    {/* Spark particles */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={`spark-${i}`}
                            className="absolute"
                            style={{
                                width: '3px',
                                height: '3px',
                                left: '50%',
                                top: '50%',
                                backgroundColor: '#ffff00',
                                borderRadius: '50%',
                                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-15px)`,
                                animation: `sparkFly 0.5s ease-out`,
                                animationDelay: `${i * 0.05}s`,
                            }}
                        />
                    ))}

                    {/* Impact text */}
                    <div
                        className="absolute font-bold text-yellow-300"
                        style={{
                            left: '50%',
                            top: '-20px',
                            transform: 'translateX(-50%)',
                            fontSize: '14px',
                            textShadow: '0 0 10px rgba(255, 255, 0, 0.9)',
                            animation: 'fadeUp 0.5s ease-out',
                            pointerEvents: 'none'
                        }}
                    >
                        HIT!
                    </div>
                </div>
            );
        }

        return elements;
    };

    // Return a single container with all laser elements
    return (
        <>
            {visibleLasers.map((laser) => {
                const elements = renderLaserBeam(laser);
                if (!elements) return null;

                // Return a fragment with a unique key for each laser
                return (
                    <React.Fragment key={`laser-group-${laser.shooterId}-${laser.timestamp}`}>
                        {elements}
                    </React.Fragment>
                );
            })}
        </>
    );
}