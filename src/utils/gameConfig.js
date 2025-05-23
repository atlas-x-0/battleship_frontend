export const BOARD_ROWS = 10;
export const BOARD_COLUMNS = 10;
export const VERTICAL = 'vertical';
export const HORIZONTAL = 'horizontal';

/**
 * Array of available ships in the game with their properties
 * Each ship has:
 * - name: The type of ship
 * - length: Number of squares the ship occupies
 * - placed: Boolean flag indicating if the ship has been placed on the board
 * 
 * Standard Battleship game ships:
 * - Carrier: 5 squares
 * - Battleship: 4 squares
 * - Cruiser: 3 squares
 * - Submarine: 3 squares
 * - Destroyer: 2 squares
 */
export const AVAILABLE_SHIPS = [
  {
    name: 'carrier',
    length: 5,
    placed: false,
  },
  {
    name: 'battleship',
    length: 4,
    placed: false,
  },
  {
    name: 'cruiser',
    length: 3,
    placed: false,
  },
  {
    name: 'submarine',
    length: 3,
    placed: false,
  },
  {
    name: 'destroyer',
    length: 2,
    placed: false,
  },
];

/**
 * Enumeration of possible states for each square on the game board
 * - empty: An unoccupied square
 * - ship: A square occupied by a ship (visible only on player's board)
 * - hit: A square where a ship was hit
 * - miss: A square that was targeted but contained no ship
 * - ship_sunk: A square occupied by a ship that has been completely sunk
 * - forbidden: A square where ship placement is not allowed (used during ship placement phase)
 */
export const SQUARE_STATE = {
  empty: 'empty',
  ship: 'ship',
  hit: 'hit',
  miss: 'miss',
  ship_sunk: 'ship-sunk',
  forbidden: 'forbidden',
};

export const stateToClass = {
  [SQUARE_STATE.empty]: 'empty',
  [SQUARE_STATE.ship]: 'ship',
  [SQUARE_STATE.hit]: 'hit',
  [SQUARE_STATE.miss]: 'miss',
  [SQUARE_STATE.ship_sunk]: 'ship-sunk',
  [SQUARE_STATE.forbidden]: 'forbidden',
};