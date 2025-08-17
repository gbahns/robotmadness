// /components/game/RobotLaserAnimation.tsx
import React, { useEffect, useState } from 'react';
import { Player, Position } from '@/lib/game/types';
import { getTileAt } from '@/lib/game/wall-utils';

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

// Helper to check if a robot's laser is immediately blocked
const isRobotLaserBlocked = (shooter: Player, course: any): boolean => {
    // Get the tile the robot is on
    const robotTile = getTileAt(course, shooter.position.x, shooter.position.y);

    // Check if there's a wall blocking the robot's firing direction
    if (robotTile && robotTile.walls && robotTile.walls.includes(shooter.direction)) {
        return true; // Robot can't fire - wall in the way
    }

    return false;
};

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

        // // Check if robot's laser is blocked immediately
        // if (isRobotLaserBlocked(shooter, course)) {
        //     return null; // Don't render the laser beam at all
        // }

        // Direction vectors to determine laser orientation
        const isHorizontal = shooter.direction === 1 || shooter.direction === 3; // East or West

        return laser.path.map((pos, index) => {
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

            return (
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

                    {/* Hit effect at the end of the beam if it hit a target */}
                    {index === laser.path.length - 1 && laser.targetId && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: `${pos.x * tileSize + tileSize / 2}px`,
                                top: `${pos.y * tileSize + tileSize / 2}px`,
                                width: '40px',
                                height: '40px',
                                marginLeft: '-20px',
                                marginTop: '-20px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.4) 50%, transparent 70%)',
                                zIndex: 21,
                                opacity: 0,
                                animation: 'laserHit 0.5s ease-out'
                            }}
                        />
                    )}
                </React.Fragment>
            );
        }).flat();
    };

    // Add CSS animations via style tag
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes laserFire {
                0% {
                    opacity: 0;
                    transform: scale(0.5, 1);
                }
                10% {
                    opacity: 1;
                    transform: scale(1, 1);
                }
                90% {
                    opacity: 1;
                    transform: scale(1, 1);
                }
                100% {
                    opacity: 0;
                    transform: scale(1, 0.5);
                }
            }

            @keyframes laserGlow {
                0% {
                    opacity: 0;
                }
                10% {
                    opacity: 0.6;
                }
                90% {
                    opacity: 0.6;
                }
                100% {
                    opacity: 0;
                }
            }

            @keyframes laserHit {
                0% {
                    opacity: 0;
                    transform: scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: scale(1.5);
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <>
            {visibleLasers.map((laser) => renderLaserBeam(laser))}
        </>
    );
}