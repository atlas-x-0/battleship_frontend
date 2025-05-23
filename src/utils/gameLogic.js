import { BOARD_ROWS, BOARD_COLUMNS, SQUARE_STATE, HORIZONTAL, VERTICAL } from "./gameConfig";

/**
 * Creates an empty game board layout filled with empty squares
 * An array representing the game board with all squares set to empty
 */
const generateEmptyLayout = () => {
    return new Array(BOARD_ROWS * BOARD_COLUMNS).fill(SQUARE_STATE.empty);
};

/**
 * Converts 2D coordinates to a index in the game board array
 * @param {Object} coord - The x,y coordinates
 * @param {number} coord.x - The x coordinate (column)
 * @param {number} coord.y - The y coordinate (row)
 * @returns {number} The corresponding index in the 1D array
 */
const coordsToIndex = (coord) => {
    const { x, y } = coord;

    return y * BOARD_COLUMNS + x;
};

/**
 * Converts a 1D array index back to 2D coordinates
 * @param {number} index - The index in the 1D array
 * @returns {Object} An object with x and y coordinates
 */
const indexToCoords = (index) => {
    return {
        x: index % BOARD_COLUMNS,
        y: Math.floor(index / BOARD_ROWS),
    };
};

/**
 * Gets all occupied indices for a ship or other entity based on its position, orientation and length
 * @param {Object} entity - A ship or other game entity with position, orientation and length
 * @returns {Array} Array of indices that the entity occupies on the board
 */
const getOccupiedIndices = (entity) => {
    let position = entity.position;
    const indices = [];

    for (let i = 0; i < entity.length; ++i) {
        const coords = entity.orientation === VERTICAL
            ? { x: position.x, y: position.y + i }
            : { x: position.x + i, y: position.y };
        indices.push(coordsToIndex(coords));
    }

    return indices;
};

/**
 * Checks if an entity is completely within the boundaries of the game board
 * @param {Object} entity - The entity to check
 * @returns {boolean} True if entity is within board boundaries, false otherwise
 */
const isWithinBoard = (entity) => {
    let orientation = entity.orientation;

    if (orientation === VERTICAL) {
        return entity.position.y + entity.length <= BOARD_ROWS;
    } else {
        return entity.position.x + entity.length <= BOARD_COLUMNS;
    }
};

/**
 * Checks if all squares that an entity would occupy are empty
 * @param {Object} entity - The entity to check
 * @param {Array} layout - The current board layout
 * @returns {boolean} True if all squares are empty, false otherwise
 */
export const isEmpty = (entity, layout) => {
    let indices = getOccupiedIndices(entity);

    return indices.every((idx) => layout[idx] === SQUARE_STATE.empty);
};

/**
 * Updates the game board layout based on an entity and action type
 * @param {Array} oldLayout - The current board layout
 * @param {Object} entity - The entity being placed or modified
 * @param {string} type - The type of update ('ship', 'forbidden', 'hit', 'miss', 'ship-sunk')
 * @returns {Array} The updated board layout
 */
const updateLayout = (oldLayout, entity, type) => {
    let newLayout = oldLayout.slice();

    if (type === 'ship') {
        getOccupiedIndices(entity).forEach((idx) => {
            newLayout[idx] = SQUARE_STATE.ship;
        });
    }

    if (type === 'forbidden') {
        getOccupiedIndices(entity).forEach((idx) => {
            newLayout[idx] = SQUARE_STATE.forbidden;
        });
    }

    if (type === 'hit') {
        newLayout[coordsToIndex(entity.position)] = SQUARE_STATE.hit;
    }

    if (type === 'miss') {
        newLayout[coordsToIndex(entity.position)] = SQUARE_STATE.miss;
    }

    if (type === 'ship-sunk') {
        getOccupiedIndices(entity).forEach((idx) => {
            newLayout[idx] = SQUARE_STATE.ship_sunk;
        });
    }

    return newLayout;
};

/**
 * Generates a random number between 0 and limit-1
 * @param {number} limit - The upper bound (exclusive)
 * @returns {number} A random integer
 */
const generateRandomIndex = (limit) => {
    return Math.floor(Math.random() * Math.floor(limit));
};

/**
 * Randomly selects either horizontal or vertical orientation
 * @returns {string} The randomly selected orientation (HORIZONTAL or VERTICAL)
 */
const generateRandomOrientation = () => {
    let rand = generateRandomIndex(2);

    return rand === 1 ? VERTICAL : HORIZONTAL;
};

/**
 * Creates a randomly positioned and oriented ship
 * @param {Object} ship - The ship object to randomly position
 * @returns {Object} A new ship object with random position and orientation
 */
const generateRandomShip = (ship) => {
    let index = generateRandomIndex(BOARD_ROWS * BOARD_COLUMNS);

    return {
        ...ship,
        position: indexToCoords(index),
        orientation: generateRandomOrientation(),
    };
};

/**
 * Randomly deploys all ships on the board without overlapping
 * @param {Array} ships - Array of ship objects to deploy
 * @returns {Array} Array of placed ship objects with updated positions
 */
const randomDeployShips = (ships) => {
    let layout = generateEmptyLayout();

    return ships.map((ship) => {
        while (true) {
            let newShip = generateRandomShip(ship);

            if (canBePlaced(newShip, layout)) {
                layout = updateLayout(layout, newShip, SQUARE_STATE.ship);

                return { ...newShip, placed: true };
            }
        }
    });
};

/**
 * Gets all adjacent coordinates to a given position
 * @param {Object} coords - The coordinates to find neighbors for
 * @returns {Array} Array of valid neighbor indices
 */
const getNeighbors = (coords) => {
    const { x, y } = coords;
    const directions = [
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }, // Right
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 }, // Down
    ];

    const neighbors = directions
        .map(({ x: dx, y: dy }) => ({ x: x + dx, y: y + dy }))
        .filter(({ x, y }) => x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS);

    return [...new Set(neighbors.map(coordsToIndex))].filter(
        (index) => index >= 0 && index < BOARD_COLUMNS * BOARD_ROWS
    );
};

/**
 * Checks if an entity can be placed on the board
 * @param {Object} entity - The entity to place
 * @param {Array} layout - The current board layout
 * @returns {boolean} True if entity can be placed, false otherwise
 */
const canBePlaced = (entity, layout) => isWithinBoard(entity) && isEmpty(entity, layout);

/**
 * Calculates how much of the entity extends beyond the board's boundaries
 * @param {Object} entity - The entity to check
 * @returns {number} The number of squares that extend beyond the board (0 if within bounds)
 */
const computeOverhang = (entity) =>
    Math.max(
        entity.orientation === VERTICAL
            ? entity.position.y + entity.length - BOARD_ROWS
            : entity.position.x + entity.length - BOARD_COLUMNS,
        0
    );

/**
* Updates the sunk status of ships based on current hits
* @param {Array} currentHits - Array of successful hit positions
* @param {Array} opponentShips - Array of opponent ship objects
* @returns {Array} Updated ship objects with sunk status
*/
const updateSunkShips = (currentHits, opponentShips) => {
    let playerHitIndices = currentHits.map((hit) => coordsToIndex(hit.position));

    let indexWasHit = (index) => playerHitIndices.includes(index);

    let shipsWithSunkFlag = opponentShips.map((ship) => {
        let shipIndices = getOccupiedIndices(ship);

        if (shipIndices.every((idx) => indexWasHit(idx))) {
            return { ...ship, sunk: true };
        } else {
            return { ...ship, sunk: false };
        }
    });

    return shipsWithSunkFlag;
};

/**
 * Export all game logic functions as a single object
 */
export const gameLogic = {
    generateEmptyLayout,
    indexToCoords,
    coordsToIndex,
    canBePlaced,
    updateLayout,
    computeOverhang,
    updateSunkShips,
    generateRandomIndex,
    getNeighbors,
    randomDeployShips,
};
