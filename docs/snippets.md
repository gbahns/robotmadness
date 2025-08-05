  // Get laser at position (for enhanced boards)
  const getLaserAt = (x: number, y: number): Laser | undefined => {
    const boardWithLasers = board as BoardType & { lasers?: Laser[] };
    if (boardWithLasers.lasers && Array.isArray(boardWithLasers.lasers)) {
      return boardWithLasers.lasers.find((laser: Laser) => laser.position?.x === x && laser.position?.y === y);
    }
    return undefined;
  };
