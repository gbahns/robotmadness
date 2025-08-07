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



              <BoardSelector 
              selectedBoardId={selectedBoardId}
              onSelectBoard={setSelectedBoardId}
            />


            {/* REPLACE the entire Create Game card (Card component) with this: */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Create Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <BoardSelector 
              selectedBoardId={selectedBoardId}
              onSelectBoard={setSelectedBoardId}
            />

            <button
              onClick={handleCreateGame}
              disabled={!playerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Create Game
            </button>
          </CardContent>
        </Card>
