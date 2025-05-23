import React from 'react';
import { SQUARE_STATE } from '../utils/gameConfig';
import './InteractivePlayerBoard.css'; // Reuse styles for grid and cells

export const StaticPlayerBoard = ({ boardCells, boardTitle = "Your Board" }) => {
    if (!boardCells || boardCells.length === 0) {
        // Render a placeholder or empty state if boardCells aren't available yet
        // This can happen if gameData is still loading or not properly initialized.
        return (
            <div className="player-board static-board mb-3">
                <h5>{boardTitle}</h5>
                <div className="board-grid disabled-board">
                    {/* Placeholder for 10x10 grid if needed, or just a loading message */}
                    {Array(10).fill(0).map((_, y) => (
                        Array(10).fill(0).map((_, x) => (
                            <div key={`${y}-${x}`} className="cell empty" />
                        ))
                    ))}
                </div>
                <small className="text-muted">Board data is loading or unavailable.</small>
            </div>
        );
    }

    return (
        <div className="player-board static-board mb-3">
            <h5>{boardTitle}</h5>
            <div className="board-grid">
                {boardCells.map((row, y) => (
                    row.map((cell, x) => {
                        const cellKey = `${y}-${x}`;
                        let cellClass = 'cell';

                        // Determine cell class based on its state
                        // This needs to align with how states are stored in gameData.boardX_cells
                        // Assuming cell object might have { state: SQUARE_STATE.hit, shipName: 'cruiser' } or just { state: SQUARE_STATE.empty }
                        switch (cell?.state) {
                            case SQUARE_STATE.ship:
                                cellClass += ' ship'; // Your own unhit ship part
                                break;
                            case SQUARE_STATE.hit:
                                cellClass += ' hit';   // Your ship part that was hit
                                break;
                            case SQUARE_STATE.miss:
                                cellClass += ' miss';  // Empty cell that was fired upon by opponent
                                break;
                            case SQUARE_STATE.ship_sunk: // If we have a distinct sunk state visual
                                cellClass += ' sunk'; // Your ship part that is sunk
                                break;
                            default:
                                cellClass += ' empty';
                                break;
                        }
                        
                        return (
                            <div 
                                key={cellKey} 
                                className={cellClass}
                                title={`Cell: ${x},${y} State: ${cell?.state || 'unknown'}`}
                            />
                        );
                    })
                ))}
            </div>
        </div>
    );
}; 
