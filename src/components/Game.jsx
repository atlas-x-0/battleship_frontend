import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
	getGameDetailsAPI,
	attackAPI,
	surrenderAPI,
} from "../services/apiService";
import { GameView } from "./GameView";
import { SQUARE_STATE } from "../utils/gameConfig";

export const Game = () => {
	const { gameId } = useParams();
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const [gameData, setGameData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(Date.now());

	// Polling interval for game updates (in milliseconds)
	const POLLING_INTERVAL = 5000; // 5 seconds

	const fetchGameDetails = useCallback(async () => {
		if (!gameId) return;
		
		// Only set loading state when not already loading to avoid flickering with existing data
		if (!gameData) setIsLoading(true);
		
		setError(null);
		try {
			const data = await getGameDetailsAPI(gameId);
			setGameData(data);
			setLastUpdated(Date.now());
			console.log("Fetched gameData:", data);
		} catch (err) {
			console.error("Failed to fetch game details:", err);
			setError(err.response?.data?.msg || err.message || "Failed to load game data.");
			// Optionally navigate away if game not found or access denied
			if (err.response?.status === 404) {
				navigate('/games', { replace: true });
			}
		} finally {
			setIsLoading(false);
		}
	}, [gameId, navigate, gameData]);

	useEffect(() => {
		if (!isAuthenticated) { // Redirect if not authenticated
			navigate('/login', { replace: true, state: { from: `/game/${gameId}` } });
			return;
		}
		
		fetchGameDetails();
		
		// Set up polling for game updates
		const pollingId = setInterval(() => {
			// Only poll when game is active
			if (gameData && (gameData.status === "Active" || gameData.status === "PendingSetup" || gameData.status === "Open")) {
				// Check if it's current user's turn or if game state needs refreshing
				const isUserTurn = gameData.turn === user?.id;
				const needsRefresh = !isUserTurn || Date.now() - lastUpdated > 30000; // If not user's turn or no updates for over 30 seconds
				
				if (needsRefresh) {
					fetchGameDetails();
				}
			}
		}, POLLING_INTERVAL);
		
		// Clean up the interval when component unmounts
		return () => clearInterval(pollingId);
	}, [fetchGameDetails, isAuthenticated, navigate, gameId, gameData, user, lastUpdated]);

	const handleAttack = async (x, y) => {
		if (
			!gameData ||
			gameData.status !== "Active" ||
			!user ||
			gameData.turn !== user.id
		) {
			alert("Cannot attack now. Not your turn, or game is not active.");
			return;
		}

		try {
			setIsLoading(true);
			
			// Determine target player
			const targetPlayerId = 
				gameData.player1._id === user.id
					? gameData.player2._id
					: gameData.player1._id;
			
			// Check if target cell has a ship (calculate hit result on frontend)
			const targetBoard = 
				gameData.player1._id === user.id
					? gameData.board2_cells
					: gameData.board1_cells;
			
			// Check if this position has already been attacked
			if (targetBoard[y][x].isHit) {
				setError("This cell has already been attacked. Try another cell.");
				setIsLoading(false);
				return;
			}
			
			// 判断是否命中
			const hit = targetBoard[y][x].isShip;
			
			// 获取目标玩家的船只列表
			const targetShips = 
				gameData.player1._id === user.id
					? gameData.ships2
					: gameData.ships1;
			
			// 检查是否击沉船只
			let sunkShipName = null;
			let allPlayerShipsSunk = false;
			
			if (hit) {
				// 创建一个包含攻击后状态的棋盘副本
				const boardCopy = JSON.parse(JSON.stringify(targetBoard));
				boardCopy[y][x].isHit = true;
				
				// 检查每艘船是否被击沉
				for (const ship of targetShips) {
					if (ship.sunk) continue;
					
					// 检查该船所有格子是否都被命中
					const allCellsHit = ship.occupiedCells.every(cell => {
						// 当前攻击的格子
						if (cell.x === x && cell.y === y) return true;
						// 检查棋盘上的格子是否被命中
						return boardCopy[cell.y][cell.x].isHit;
					});
					
					if (allCellsHit) {
						sunkShipName = ship.name;
						break;
					}
				}
				
				// 检查是否所有船只都被击沉
				const sunkShipsAfterThisAttack = [...targetShips]
					.map(ship => {
						if (ship.name === sunkShipName) return {...ship, sunk: true};
						return ship;
					});
				
				allPlayerShipsSunk = sunkShipsAfterThisAttack.every(ship => ship.sunk);
			}
			
			// 准备发送到服务器的数据
			const attackDataPayload = {
				targetPlayerId,
				coordinates: { x, y },
				hit,
				sunkShipName,
				allPlayerShipsSunk
			};
			
			const updatedGame = await attackAPI(gameId, attackDataPayload);
			setGameData(updatedGame);
			setLastUpdated(Date.now());
			setError(null);
		} catch (err) {
			console.error("Attack failed:", err);
			setError(err.response?.data?.msg || err.message || "Attack failed.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSurrenderGame = async () => {
		if (!gameData || !user || gameData.status === "Completed") {
			alert("Game not active or already completed.");
			return;
		}
		const confirmSurrender = window.confirm("Are you sure you want to surrender?");
		if (!confirmSurrender) return;

		try {
			setIsLoading(true);
			const updatedGame = await surrenderAPI(gameId);
			setGameData(updatedGame);
			setLastUpdated(Date.now());
			alert("You have surrendered the game.");
		} catch (error) {
			console.error("Error surrendering game:", error);
			setError(error.response?.data?.msg || error.message || "Failed to surrender.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading && !gameData) return (
		<div className="container text-center mt-5">
			<div className="spinner-border" role="status">
				<span className="visually-hidden">Loading game data...</span>
			</div>
			<p className="mt-2">Loading game...</p>
		</div>
	);
	
	if (error) return (
		<div className="container mt-5">
			<div className="alert alert-danger" role="alert">
				<h4 className="alert-heading">Error!</h4>
				<p>{error}</p>
				<hr />
				<div className="d-flex justify-content-between">
					<button className="btn btn-secondary" type="button" onClick={() => navigate('/games')}>
						Back to Games
					</button>
					<button className="btn btn-primary" type="button" onClick={fetchGameDetails}>
						Try Again
					</button>
				</div>
			</div>
		</div>
	);
	
	if (!gameData) return (
		<div className="container mt-5">
			<div className="alert alert-warning" role="alert">
				<h4 className="alert-heading">Game Not Found</h4>
				<p>The requested game could not be loaded.</p>
				<hr />
				<button className="btn btn-primary" type="button" onClick={() => navigate('/games')}>
					Back to Games
				</button>
			</div>
		</div>
	);

	// Determine player roles and opponent
    const currentPlayerIsPlayer1 = gameData.player1 && user && gameData.player1._id === user.id;
    const currentPlayerIsPlayer2 = gameData.player2 && user && gameData.player2._id === user.id;
    let opponent = null;
    
    if (currentPlayerIsPlayer1 && gameData.player2) {
        opponent = gameData.player2;
    } else if (currentPlayerIsPlayer2 && gameData.player1) {
        opponent = gameData.player1;
    }

	return (
		<GameView
			gameData={gameData}
			currentUser={user}
			onAttack={handleAttack}
			onSurrender={handleSurrenderGame}
            opponent={opponent}
            currentPlayerIsPlayer1={currentPlayerIsPlayer1}
            currentPlayerIsPlayer2={currentPlayerIsPlayer2}
			isLoading={isLoading}
		/>
	);
};
