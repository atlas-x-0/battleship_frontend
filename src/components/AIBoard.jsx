import React from 'react';
import { stateToClass, SQUARE_STATE } from '../utils/gameConfig';
import { gameLogic } from '../utils/gameLogic';

/**
 * AIBoard Component - Represents the computer's game board that the player attacks
 * 
 * @param {Object} props - Component props
 * @param {Array} props.computerShips - Array of ship objects representing the computer's fleet
 * @param {string} props.gameState - Current state of the game (e.g., 'player-turn', 'computer-turn')
 * @param {Array} props.hitsByPlayer - Array of hit objects made by the player
 * @param {Function} props.setHitsByPlayer - Function to update the hitsByPlayer state
 * @param {Function} props.handleComputerTurn - Function to trigger the computer's turn
 * @param {Function} props.checkIfGameOver - Function to check if the game has ended
 * @param {Function} props.setComputerShips - Function to update the computerShips state
 * @returns {JSX.Element} The rendered AI board component
 */
export const AIBoard = ({
  computerShips,
  gameState,
  hitsByPlayer,
  setHitsByPlayer,
  handleComputerTurn,
  checkIfGameOver,
  setComputerShips
}) => {
  /**
   * Generate the initial layout by placing all computer ships on an empty board
   * This uses reduce to apply each ship to the layout sequentially
   */
  let compLayout = computerShips.reduce(
    (prevLayout, currentShip) =>
      gameLogic.updateLayout(prevLayout, currentShip, SQUARE_STATE.ship),
    gameLogic.generateEmptyLayout()
  );

  /**
   * Update the layout to show all hits and misses made by the player
   * This applies each hit/miss to the layout using reduce
   */
  compLayout = hitsByPlayer.reduce(
    (prevLayout, currentHit) =>
      gameLogic.updateLayout(prevLayout, currentHit, currentHit.type),
    compLayout
  );

  /**
   * Update the layout to show any ships that have been completely sunk
   * For ships with sunk:true property, update their squares to ship_sunk state
   */
  compLayout = computerShips.reduce(
    (prevLayout, currentShip) =>
      currentShip.sunk
        ? gameLogic.updateLayout(prevLayout, currentShip, SQUARE_STATE.ship_sunk)
        : prevLayout,
    compLayout
  );

  /**
   * Handles the player's attack on a specific board position
   */
  const fireTorpedo = (index) => {
    if (compLayout[index] === 'ship') {
      // If hit a ship, record it as a hit
      const newHits = [
        ...hitsByPlayer,
        {
          position: gameLogic.indexToCoords(index),
          type: SQUARE_STATE.hit,
        },
      ];
      setHitsByPlayer(newHits);
      return newHits;
    }

    if (compLayout[index] === 'empty') {
      // If hit empty water, record it as a miss
      const newHits = [
        ...hitsByPlayer,
        {
          position: gameLogic.indexToCoords(index),
          type: SQUARE_STATE.miss,
        },
      ];
      setHitsByPlayer(newHits);
      return newHits;
    }
  };

  // Check if it's player's turn and game is not over
  const playerTurn = gameState === 'player-turn';
  const playerCanFire = playerTurn && !checkIfGameOver();

  /**
   * Check if a position has already been targeted by the player
   */
  let alreadyHit = (index) =>
    compLayout[index] === 'hit' ||
    compLayout[index] === 'miss' ||
    compLayout[index] === 'ship-sunk';

  /**
   * Generate the board squares for rendering
   * Only show hits, misses, and sunk ships to the player (not ship positions)
   */
  let compSquares = compLayout.map((square, index) => {
    return (
      <div
        className={
          stateToClass[square] === 'hit' ||
            stateToClass[square] === 'miss' ||
            stateToClass[square] === 'ship-sunk'
            ? `square ${stateToClass[square]}`
            : `square`
        }
        key={`comp-square-${index}`}
        id={`comp-square-${index}`}
        onClick={() => {
          // Only allow clicking if it's player's turn, game isn't over, and square hasn't been hit
          if (playerCanFire && !alreadyHit(index)) {
            const newHits = fireTorpedo(index);
            const shipsWithSunkFlag = gameLogic.updateSunkShips(newHits, computerShips);
            setComputerShips(shipsWithSunkFlag);
            handleComputerTurn();
          }
        }}
      />
    );
  });

  return (
    <div>
      <h2 className="ai-title">AI</h2>
      <div className="board">{compSquares}</div>
    </div>
  );
};
