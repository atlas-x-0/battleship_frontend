import React from 'react';
// Fleet and InteractivePlayerBoard are no longer used here as placement is done on a separate page.
// import { Fleet } from './Fleet'; 
// import { InteractivePlayerBoard } from './InteractivePlayerBoard';
import { StaticPlayerBoard } from './StaticPlayerBoard';
import { OpponentBoardDisplay } from './OpponentBoardDisplay';
import { GameInfo } from './GameInfo';
import { SQUARE_STATE } from '../utils/gameConfig';

// TODO: These child components will need significant refactoring or replacement.
// For now, we comment them out and will introduce new/refactored ones.
// import { PlayerFleet } from './PlayerFleet';
// import { PlayerBoard } from './PlayerBoard'; 
// import { AIBoard } from './AIBoard';
// import { PlayerInfo } from './PlayerInfo';

// Placeholder components until actual ones are refactored/created
/* // Comment out PlaceholderFleet as it's being replaced
const PlaceholderFleet = ({ chooseShip, availableShips, confirmPlacement }) => (
    <div className="p-3 my-2 border bg-light">
        <h4>Place Your Ships (Placeholder Fleet)</h4>
        <p>Ship selection UI will be here.</p>
        <button className="btn btn-primary" onClick={confirmPlacement} type="button">Confirm Placement</button>
    </div>
);
*/

// Comment out PlaceholderPlayerBoard as it's being replaced (at least for placement mode)
/*
const PlaceholderPlayerBoard = ({ boardLayout, onCellClick, isPlacementMode }) => (
    <div className="p-3 my-2 border">
        <h4>{isPlacementMode ? "Your Board (Click to Place)" : "Your Board"} (Placeholder)</h4>
        <p>Player's 10x10 grid will be rendered here.</p>
    </div>
);
*/

export const GameView = ({
    gameData,    // Object: contains all game state like status, winner, turn, player details, boards
    currentUser, // Object: current logged-in user { id, username }
    opponent,    // Object: opponent player details { _id, username } (can be null)
    currentPlayerIsPlayer1, // Boolean
    currentPlayerIsPlayer2, // Boolean (added for clarity)
    
    // --- Actions ---
    onAttack,    // (x, y) => void - now Game component handles opponent ID
    onSurrender, // () => void
    isLoading,   // Boolean - to show loading states
}) => {

    if (!gameData || !currentUser) {
        // This case should ideally be handled by Game.jsx (showing loading/error)
        // but as a fallback:
        return <p>Loading game view or essential data missing...</p>;
    }

    const { 
        status: gameStatus, 
        winner: gameWinner, // gameData.winner might be an object { _id, username } or just an ID/username
        turn: currentTurnPlayerId,
        player1, // Contains player1 info including their board state
        player2, // Contains player2 info
        board1_cells, 
        ships1, 
        board2_cells, 
        ships2
    } = gameData;

    const myUserId = currentUser.id;
    const isMyTurn = myUserId === currentTurnPlayerId;

    // 确定当前玩家的棋盘和对手的棋盘
    let myBoardCells = [];
    let myShips = [];
    let opponentBoardCellsForDisplay = [];
    
    if (currentPlayerIsPlayer1) {
        myBoardCells = board1_cells || [];
        myShips = ships1 || [];
        opponentBoardCellsForDisplay = board2_cells || [];
    } else if (currentPlayerIsPlayer2) {
        myBoardCells = board2_cells || [];
        myShips = ships2 || [];
        opponentBoardCellsForDisplay = board1_cells || [];
    }
    
    // 如果数据不可用，创建默认空棋盘
    if (!myBoardCells.length) {
        myBoardCells = Array(10).fill(null).map(() => Array(10).fill({ state: SQUARE_STATE.empty }));
    }
    if (!opponentBoardCellsForDisplay.length) {
        opponentBoardCellsForDisplay = Array(10).fill(null).map(() => Array(10).fill({ state: SQUARE_STATE.empty }));
    }

    // 准备对手棋盘的显示视图 - 隐藏未命中的船只
    const opponentViewCells = opponentBoardCellsForDisplay.map(row => 
        row.map(cell => {
            // 如果格子有船且未被命中，则在对手视图中显示为空
            if (cell.isShip && !cell.isHit) {
                return { state: SQUARE_STATE.empty };
            }
            // 如果格子有船且已被命中，则显示为命中
            if (cell.isShip && cell.isHit) {
                return { state: SQUARE_STATE.hit };
            }
            // 如果格子没有船但已被命中，则显示为未命中
            if (!cell.isShip && cell.isHit) {
                return { state: SQUARE_STATE.miss };
            }
            // 其他情况显示为空
            return { state: SQUARE_STATE.empty };
        })
    );
    
    // 准备我的棋盘的显示视图
    const myViewCells = myBoardCells.map(row => 
        row.map(cell => {
            // 如果格子有船且未被命中，则显示为船
            if (cell.isShip && !cell.isHit) {
                return { state: SQUARE_STATE.ship };
            }
            // 如果格子有船且已被命中，则显示为命中
            if (cell.isShip && cell.isHit) {
                return { state: SQUARE_STATE.hit };
            }
            // 如果格子没有船但已被命中，则显示为未命中
            if (!cell.isShip && cell.isHit) {
                return { state: SQUARE_STATE.miss };
            }
            // 其他情况显示为空
            return { state: SQUARE_STATE.empty };
        })
    );

    const handleOpponentBoardClick = (x, y) => {
        if (isMyTurn && gameStatus === 'Active' && opponent?._id) {
            onAttack(x, y);
        } else if (!isMyTurn) {
            alert("Not your turn!");
        } else if (gameStatus !== 'Active') {
            alert(`Game is ${gameStatus}. Cannot attack.`);
        }
    };
    
    const opponentUsername = opponent?.username || (gameStatus === 'Open' ? 'Waiting for opponent...' : 'Opponent');
    const winnerUsername = typeof gameWinner === 'object' ? gameWinner?.username : gameWinner;

    // 如果加载中且有游戏数据，显示轻量级加载指示器
    if (isLoading && gameData) {
        return (
            <section id="game-screen" className="container mt-3 position-relative">
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75" style={{ zIndex: 1000 }}>
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Updating game data...</span>
                        </div>
                        <p className="mt-2">Updating game...</p>
                    </div>
                </div>
                
                <GameInfo 
                    gameStatus={gameStatus}
                    winnerName={winnerUsername}
                    opponentUsername={opponentUsername}
                    isMyTurn={isMyTurn}
                    surrenderHandler={onSurrender}
                    currentTurnPlayerId={currentTurnPlayerId}
                    player1Id={player1?._id}
                    player1Username={player1?.username}
                    player2Id={player2?._id}
                    player2Username={player2?.username}
                />
                <div className="row mt-3">
                    <div className="col-md-6">
                        <h5 className="text-center">Your Board</h5>
                        <StaticPlayerBoard boardCells={myViewCells} />
                    </div>
                    <div className="col-md-6">
                        <h5 className="text-center">Opponent's Board ({opponentUsername})</h5>
                        <OpponentBoardDisplay 
                            opponentBoardCells={opponentViewCells}
                            attackHandler={handleOpponentBoardClick}
                            isMyTurn={isMyTurn}
                            gameStatus={gameStatus}
                        />
                    </div>
                </div>
            </section>
        );
    }

    // Main game view (ship placement is handled on a different page)
    return (
        <section id="game-screen" className="container mt-3">
            <GameInfo 
                gameStatus={gameStatus}
                winnerName={winnerUsername} // Pass the resolved winner name
                opponentUsername={opponentUsername}
                isMyTurn={isMyTurn}
                surrenderHandler={onSurrender}
                currentTurnPlayerId={currentTurnPlayerId}
                player1Id={player1?._id} // Pass player1Id for turn display
                player1Username={player1?.username}
                player2Id={player2?._id} // Pass player2Id for turn display
                player2Username={player2?.username}
            />
            <div className="row mt-3">
                <div className="col-md-6">
                    <h5 className="text-center">Your Board</h5>
                    <StaticPlayerBoard boardCells={myViewCells} />
                </div>
                <div className="col-md-6">
                    <h5 className="text-center">Opponent's Board ({opponentUsername})</h5>
                    {opponent?._id ? (
                        <OpponentBoardDisplay 
                            opponentBoardCells={opponentViewCells}
                            attackHandler={handleOpponentBoardClick}
                            isMyTurn={isMyTurn}
                            gameStatus={gameStatus}
                        />
                    ) : (
                        <div className="p-3 my-2 border text-center bg-light" style={{height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <p>{gameStatus === 'Open' ? 'Waiting for an opponent to join.' : (gameStatus === 'PendingSetup' && currentPlayerIsPlayer1 ? 'Waiting for opponent to place ships.' : 'Opponent not available.')}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {gameStatus === 'Completed' && winnerUsername && (
                <div className="alert alert-success text-center mt-4 py-3">
                    <h3>Game Over! Winner: {winnerUsername}</h3>
                </div>
            )}
             {gameStatus === 'PendingSetup' && ( // Status indicating waiting for other player's setup
                <div className="alert alert-info text-center mt-4 py-3">
                    <h3>
                        {currentPlayerIsPlayer1 ? 
                            `Waiting for ${opponent?.username || 'Player 2'} to place their ships.` :
                            `Waiting for ${player1?.username || 'Player 1'} to place their ships.`
                        }
                    </h3>
                </div>
            )}
        </section>
    );
};
