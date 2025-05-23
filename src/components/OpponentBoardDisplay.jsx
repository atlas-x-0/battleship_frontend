import React from 'react';
import { SQUARE_STATE } from '../utils/gameConfig';
import './InteractivePlayerBoard.css'; // Reuse styles for grid and cells

export const OpponentBoardDisplay = ({
    opponentBoardCells,      // 2D array from gameData {state (hit/miss), ...}
    attackHandler,           // (x,y, targetPlayerId) => void ; targetPlayerId is opponentUserId
    opponentUserId,          // ID of the opponent to pass to attackHandler
    isMyTurn,                // Boolean: true if it's the current player's turn
    gameStatus,              // To disable attacking if game is not 'Active'
    boardTitle = "Opponent's Board"
}) => {

    const canAttack = isMyTurn && gameStatus === 'Active';

    if (!opponentBoardCells || opponentBoardCells.length === 0) {
        return (
            <div className={`player-board opponent-board mb-3 ${canAttack ? 'interactive-board' : 'disabled-board'}`}>
                <h5>{boardTitle}</h5>
                <div className="board-grid">
                    {Array(10).fill(0).map((_, y) => (
                        Array(10).fill(0).map((_, x) => (
                            <div key={`${y}-${x}`} className="cell empty" />
                        ))
                    ))}
                </div>
                <small className="text-muted">Opponent board data is loading or unavailable.</small>
            </div>
        );
    }

    const handleCellClick = (x, y) => {
        if (canAttack && opponentBoardCells[y][x].state !== SQUARE_STATE.hit && opponentBoardCells[y][x].state !== SQUARE_STATE.miss) {
            attackHandler(x, y, opponentUserId);
        } else if (canAttack) {
            alert("This cell has already been attacked.");
        }
    };

    const handleCellKeyDown = (event, x, y) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCellClick(x,y);
        }
    };

    return (
        <div className={`player-board opponent-board mb-3 ${canAttack ? 'interactive-board' : 'disabled-board'}`}>
            <h5>{boardTitle} {canAttack && "(Your Turn - Click to Attack)"}</h5>
            <div className="board-grid">
                {opponentBoardCells.map((row, y) => (
                    row.map((cell, x) => {
                        const cellKey = `${y}-${x}`;
                        let cellClass = 'cell';
                        let cellContent = '';

                        // Opponent's board only shows hits and misses
                        // Their actual ship locations are not directly shown unless hit.
                        switch (cell?.state) {
                            case SQUARE_STATE.hit:
                                cellClass += ' hit';
                                cellContent = 'X'; // Or use a specific icon/background
                                break;
                            case SQUARE_STATE.miss:
                                cellClass += ' miss';
                                cellContent = '•'; // Or use a specific icon/background
                                break;
                            default: // Empty, or unrevealed ship part
                                cellClass += ' empty'; // Or 'unknown' if styled differently
                                break;
                        }
                        
                        const isAttackable = canAttack && cell?.state !== SQUARE_STATE.hit && cell?.state !== SQUARE_STATE.miss;

                        return (
                            <div 
                                key={cellKey} 
                                className={`${cellClass} ${isAttackable ? 'attackable' : ''}`}
                                role={isAttackable ? "button" : undefined}
                                tabIndex={isAttackable ? 0 : undefined}
                                onClick={isAttackable ? () => handleCellClick(x,y) : undefined}
                                onKeyDown={isAttackable ? (e) => handleCellKeyDown(e, x, y) : undefined}
                                title={`Cell: ${x},${y}`}
                                style={{cursor: isAttackable ? 'pointer' : 'default'}}
                            >
                                {cellContent}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
}; 
