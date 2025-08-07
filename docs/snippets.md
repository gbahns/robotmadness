  // Get laser at position (for enhanced boards)
  const getLaserAt = (x: number, y: number): Laser | undefined => {
    const boardWithLasers = board as BoardType & { lasers?: Laser[] };
    if (boardWithLasers.lasers && Array.isArray(boardWithLasers.lasers)) {
      return boardWithLasers.lasers.find((laser: Laser) => laser.position?.x === x && laser.position?.y === y);
    }
    return undefined;
  };


                  <div className="flex flex-col">
                    <label htmlFor="map-select" className="text-gray-400 text-sm mb-1">Select Map:</label>
                    <select
                      id="map-select"
                      value={selectedMap}
                      onChange={(e) => setSelectedMap(e.target.value)}
                      className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    >
                      {availableMaps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleStartGame}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold text-lg"
                  >
                    Start Game
                  </button>



//this was in the game page
  const handleStartGame = () => {
    socketClient.startGame(roomCode);
  };
