import React, { useState, useEffect } from "react";
import { SQUARE_STATE, BOARD_ROWS, BOARD_COLUMNS } from "../utils/gameConfig";
import "./InteractivePlayerBoard.css"; // For custom styles

// Helper to get cells for preview
const getShipPreviewCells = (ship, startX, startY, orientation) => {
	if (!ship || startX === null || startY === null) return [];
	const cells = [];
	for (let i = 0; i < ship.length; i++) {
		if (orientation === "horizontal") {
			cells.push({ x: startX + i, y: startY });
		} else {
			cells.push({ x: startX, y: startY + i });
		}
	}
	return cells;
};

// Helper to check if a cell is part of the preview
const isPreviewCell = (previewCells, x, y) => {
	return previewCells.some((cell) => cell.x === x && cell.y === y);
};

// Helper to check if preview is valid (within bounds, simple check)
const isPreviewValid = (previewCells) => {
	if (previewCells.length === 0) return true; // No preview, no problem
	for (const cell of previewCells) {
		if (
			cell.x < 0 ||
			cell.x >= BOARD_COLUMNS ||
			cell.y < 0 ||
			cell.y >= BOARD_ROWS
		) {
			return false;
		}
	}
	return true;
};

export const InteractivePlayerBoard = ({
	playerPlacementBoardLayout, // 2D array of cell objects {state, shipName}
	placeShipOnBoardHandler, // ({x, y}) => void
	currentlyPlacingShipObject, // The ship object being placed, or null
}) => {
	const [hoveredCell, setHoveredCell] = useState(null); // {x, y} of the currently hovered cell
	const [shipPreviewCells, setShipPreviewCells] = useState([]);
	const [isPreviewPlacementValid, setIsPreviewPlacementValid] = useState(true);

	useEffect(() => {
		if (currentlyPlacingShipObject && hoveredCell) {
			const cells = getShipPreviewCells(
				currentlyPlacingShipObject,
				hoveredCell.x,
				hoveredCell.y,
				currentlyPlacingShipObject.orientation,
			);
			setShipPreviewCells(cells);

			// Check basic bounds for preview validity for visual feedback
			const validBounds = isPreviewValid(cells);
			// More complex: check against already placed ships on playerPlacementBoardLayout
			let overlaps = false;
			if (validBounds) {
				for (const cell of cells) {
					if (
						playerPlacementBoardLayout[cell.y][cell.x].state ===
						SQUARE_STATE.ship
					) {
						overlaps = true;
						break;
					}
				}
			}
			setIsPreviewPlacementValid(validBounds && !overlaps);
		} else {
			setShipPreviewCells([]);
			setIsPreviewPlacementValid(true); // No preview, so it's valid by default
		}
	}, [currentlyPlacingShipObject, hoveredCell, playerPlacementBoardLayout]);

	const handleCellMouseEnter = (x, y) => {
		if (currentlyPlacingShipObject) {
			setHoveredCell({ x, y });
		}
	};

	const handleBoardMouseLeave = () => {
		setHoveredCell(null);
		setShipPreviewCells([]);
		setIsPreviewPlacementValid(true);
	};

	const handleCellClick = (rowIndex, colIndex) => {
		if (placeShipOnBoardHandler) {
			placeShipOnBoardHandler({ y: rowIndex, x: colIndex });
		}
	};

	const handleCellKeyDown = (event, x, y) => {
		if (event.key === "Enter" || event.key === " ") {
			// Space bar
			event.preventDefault(); // Prevent scrolling on space bar
			handleCellClick(x, y);
		}
	};

	// Create a visual representation of the board with the ship being placed
	const displayBoard = playerPlacementBoardLayout.map((row) => [...row]);

	if (currentlyPlacingShipObject && currentlyPlacingShipObject.position) {
		const { name, length, orientation, position } = currentlyPlacingShipObject;
		const { x: startX, y: startY } = position;

		for (let i = 0; i < length; i++) {
			// Use .length for ship size
			let currentX = startX;
			let currentY = startY;
			if (orientation === "horizontal") {
				currentX += i;
			} else {
				currentY += i;
			}
			if (
				currentY >= 0 &&
				currentY < BOARD_ROWS &&
				currentX >= 0 &&
				currentX < BOARD_COLUMNS
			) {
				// Mark cells for the ship being placed, could be a temporary state or style
				// This part might need more sophisticated logic if we want to show invalid placement differently
				if (displayBoard[currentY] && displayBoard[currentY][currentX]) {
					// displayBoard[currentY][currentX] = { ...displayBoard[currentY][currentX], state: 'placing' }; // Example temporary state
				}
			}
		}
	}

	return (
		<div
			className="player-board interactive-board mb-3"
			onMouseLeave={handleBoardMouseLeave}
		>
			<h5>Your Board (Place Ships)</h5>
			<div className="board-grid">
				{displayBoard.map((row, rowIndex) => (
					<div key={rowIndex} className="board-row">
						{row.map((cell, colIndex) => {
							let cellClass = `cell ${cell.state || SQUARE_STATE.empty}`;
							// Highlight for current ship being placed (if position is known by hover, not click)
							// This highlighting logic on hover for currentlyPlacingShipObject might be complex here
							// and better handled if `position` on `currentlyPlacingShipObject` is updated on hover
							// For now, we rely on board state if it gets updated during placement visualization

							if (isPreviewCell(shipPreviewCells, colIndex, rowIndex)) {
								cellClass += isPreviewPlacementValid
									? " preview-valid"
									: " preview-invalid";
							}

							return (
								<div
									key={colIndex}
									className={cellClass}
									role="button"
									tabIndex={0}
									onMouseEnter={() => handleCellMouseEnter(colIndex, rowIndex)}
									onClick={() => handleCellClick(rowIndex, colIndex)}
									onKeyDown={(e) => handleCellKeyDown(e, colIndex, rowIndex)}
								>
									{/* Display ship name if cell state is ship */}
									{/* {cell.state === SQUARE_STATE.ship && cell.shipName ? cell.shipName.substring(0,1) : ''} */}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
};
