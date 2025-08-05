// {/* Game Controls */ }
// <div className="bg-gray-800 rounded-lg p-6">
//     <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
//     {gameState?.phase === 'waiting' && (
//         <>
//             {isHost ? (
//                 <button
//                     onClick={handleStartGame}
//                     disabled={Object.keys(gameState.players).length < 2}
//                     className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                     {Object.keys(gameState.players).length < 2
//                         ? 'Need at least 2 players'
//                         : 'Start Game'}
//                 </button>
//             ) : (
//                 <p className="text-gray-400 text-center">
//                     Waiting for host to start game...
//                 </p>
//             )}
//         </>
//     )}
//     {gameState?.phase === 'starting' && (
//         <p className="text-yellow-400 text-center animate-pulse">
//             Game starting...
//         </p>
//     )}
//     {gameState?.phase === 'programming' && (
//         <p className="text-gray-400 text-center">
//             Program your robot!
//         </p>
//     )}
//     {/* {gameState?.phase === 'executing' && (
//                     <div className="grid grid-cols-4 gap-4 mb-4">
//                       <div className="bg-yellow-900 p-4 rounded-lg">
//                         <h2 className="text-2xl font-bold mb-2">Execution Phase</h2>
//                         <p className="text-lg">Register {gameState.currentRegister + 1} of 5</p>
//                         {executionMessage && (
//                           <p className="text-xl mt-2 text-yellow-200">{executionMessage}</p>
//                         )}
//                       </div>
//                     </div>
//                   )} */}
// </div>
