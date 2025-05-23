import React from 'react';
import { gameLogic } from '../utils/gameLogic';
import { SQUARE_STATE, stateToClass } from '../utils/gameConfig';

export const PlayerBoard = ({
  currentlyPlacing,
  setCurrentlyPlacing,
  placeShip,
  placedShips,
  hitsByComputer,
}) => {
  // Generate the initial board layout with player's ships
  let layout = placedShips.reduce(
    (prevLayout, currentShip) => gameLogic.updateLayout(prevLayout, currentShip, SQUARE_STATE.ship),
    gameLogic.generateEmptyLayout()
  );

  // Add computer's hits and misses to the board
  layout = hitsByComputer.reduce(
    (prevLayout, currentHit) =>
      gameLogic.updateLayout(prevLayout, currentHit, currentHit.type),
    layout
  );

  // Mark any sunk ships on the board
  layout = placedShips.reduce(
    (prevLayout, currentShip) =>
      currentShip.sunk
        ? gameLogic.updateLayout(prevLayout, currentShip, SQUARE_STATE.ship_sunk)
        : prevLayout,
    layout
  );

  // Check if player is currently placing a ship and if it's over the board
  const isPlacingOverBoard = currentlyPlacing && currentlyPlacing.position != null;
  const canPlaceCurrentShip = isPlacingOverBoard && gameLogic.canBePlaced(currentlyPlacing, layout);

  // Update layout to show ship placement preview (valid or invalid)
  if (isPlacingOverBoard) {
    if (canPlaceCurrentShip) {
      // Show valid placement
      layout = gameLogic.updateLayout(layout, currentlyPlacing, SQUARE_STATE.ship);
    } else {
      // Show invalid placement with correct overhang calculation
      let forbiddenShip = {
        ...currentlyPlacing,
        length: currentlyPlacing.length - gameLogic.computeOverhang(currentlyPlacing),
      };
      layout = gameLogic.updateLayout(layout, forbiddenShip, SQUARE_STATE.forbidden);
    }
  }

  // Generate board squares with event handlers for placement
  let squares = layout.map((square, index) => {
    return (
      <div
        onClick={() => {
          if (canPlaceCurrentShip) {
            placeShip(currentlyPlacing);
          }
        }}
        className={`square ${stateToClass[square]}`}
        key={`square-${index}`}
        id={`square-${index}`}
        onMouseOver={() => {
          // Update ship position on mouse over for preview、
          if (currentlyPlacing) {
            setCurrentlyPlacing({
              ...currentlyPlacing,
              position: gameLogic.indexToCoords(index),
            });
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();

          // Update ship position during drag for preview
          if (currentlyPlacing) {
            setCurrentlyPlacing({
              ...currentlyPlacing,
              position: gameLogic.indexToCoords(index),
            });
          }
        }}
        onDrop={(e) => {
          // Place ship on drop if valid
          if (canPlaceCurrentShip) {
            placeShip(currentlyPlacing);
          }
        }}
      />
    );
  });

  return (
    <div>
      <h2 className="player-title">You</h2>
      <div className="board">{squares}</div>
    </div>
  );
};
