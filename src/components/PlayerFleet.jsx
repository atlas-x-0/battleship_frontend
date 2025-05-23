import React from 'react';
import { ShipBox } from './ShipBox';

export const PlayerFleet = ({
  availableShips,
  chooseShip,
  currentlyPlacing,
  startTurn,
  startAgain,
}) => {
  // Extract ship names from available ships
  let shipsLeft = availableShips.map((ship) => ship.name);

  // Create a ShipBox component for each available ship
  let shipReplicaBoxes = shipsLeft.map((shipName) => (
    <ShipBox
      chooseShip={chooseShip}
      key={shipName}
      isCurrentlyPlacing={currentlyPlacing && currentlyPlacing.name === shipName}
      shipName={shipName}
      availableShips={availableShips}
    />
  ));

  // Fleet display with ship selection boxes and restart button
  let fleet = (
    <div id="square-fleet">
      {shipReplicaBoxes}

      <button className="btn-primary btn-lg mt-5" onClick={startAgain}>
        Restart
      </button>
    </div>
  );

  // Play button shown when all ships have been placed
  let playButton = (
    <div id="play-ready">
      <p className="player-tip">Press button to start game!</p>
      <button id="play-button" onClick={startTurn}>
        Start game
      </button>
    </div>
  );

  return (
    <div id="available-ships">
      <div className="tip-box-title">Pickup Ships</div>
      {availableShips.length > 0 ? fleet : playButton}
    </div>
  );
};
