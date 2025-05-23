export const ShipBox = ({
  shipName,
  chooseShip,
  availableShips,
  isCurrentlyPlacing,
}) => {
  // Find the ship details from availableShips array
  let ship = availableShips.find((item) => item.name === shipName);

  // Create array representing the ship's length
  let shipLength = new Array(ship.length).fill('ship');

  // Generate visual squares representing the ship's size
  let allReplicaSquares = shipLength.map((_, index) => (
    <div className="small-square" key={index} />
  ));

  return (
    <div
      id={`${shipName}-square`}
      onClick={() => chooseShip(shipName)}
      key={`${shipName}`}
      // Highlight the ship if it's currently being placed
      className={isCurrentlyPlacing ? 'square placing' : 'square'}
      draggable
      onDragStart={() => chooseShip(shipName)}
    >
      <div className="square-title">{shipName}</div>
      <div className="square-squares">{allReplicaSquares}</div>
    </div>
  );
};
