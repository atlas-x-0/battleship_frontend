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
		
		// 只有在非加载状态时才设置加载状态，避免已有数据闪烁
		if (!gameData) setIsLoading(true);
		
		setError(null);
		try {
			const data = await getGameDetailsAPI(gameId);
			console.log("Fetched gameData from API:", JSON.stringify(data, null, 2)); // Log the entire game data
			if (data.ships1) {
                console.log("Fetched ships1 from API:", JSON.stringify(data.ships1, null, 2));
            }
            if (data.ships2) {
                console.log("Fetched ships2 from API:", JSON.stringify(data.ships2, null, 2));
            }
			setGameData(data);
			setLastUpdated(Date.now());
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
			// 只有当游戏活跃时才进行轮询
			if (gameData && (gameData.status === "Active" || gameData.status === "PendingSetup" || gameData.status === "Open")) {
				// 检查是否轮到当前用户，或者是否需要刷新游戏状态
				const isUserTurn = gameData.turn === user?.id;
				const needsRefresh = !isUserTurn || Date.now() - lastUpdated > 30000; // 如果不是用户回合或超过30秒未更新
				
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
			
			const targetPlayerId = 
				gameData.player1._id === user.id
					? gameData.player2._id
					: gameData.player1._id;
			
			const targetBoard = 
				gameData.player1._id === user.id
					? gameData.board2_cells // This is from backend, cells have { status: '...' }
					: gameData.board1_cells; // This is from backend, cells have { status: '...' }
			
			// Check if this cell has already been attacked based on its status
			const currentCellStatus = targetBoard[y][x].status;
			if (currentCellStatus === 'hit' || currentCellStatus === 'miss') {
				setError("This cell has already been attacked. Try another cell.");
				setIsLoading(false);
				return;
			}
			
			// Determine if the attack is a hit based on the original status of the cell
			// A hit occurs if the cell's status was 'ship' (an unattacked part of a ship)
			const hit = currentCellStatus === 'ship';
			
			const targetShips = 
				gameData.player1._id === user.id
					? gameData.ships2
					: gameData.ships1;
			
			let sunkShipName = null;
			let allPlayerShipsSunk = false;
			
			if (hit) {
				// Create a temporary copy of the board to simulate the hit for sunk ship calculation
				const boardCopy = JSON.parse(JSON.stringify(targetBoard)); 
				boardCopy[y][x].status = 'hit'; // Mark the current attack as a hit in the copy
				
				for (const ship of targetShips) {
					if (ship.sunk) continue; // Skip already sunk ships
					
					// occupiedCells should exist on each ship object from the backend if needed here
					// If not, this logic needs adjustment or ship.occupiedCells must be populated correctly from backend/initial placement
					const shipCells = ship.occupiedCells || []; // Fallback to empty array if not present
					const allCellsHit = shipCells.every(occupied_cell => {
						if (occupied_cell.x === x && occupied_cell.y === y) return true; // Current attack cell is a hit
						// Check the status in our temporary board copy
						return boardCopy[occupied_cell.y][occupied_cell.x].status === 'hit';
					});
					
					if (allCellsHit && shipCells.length > 0) { // Ensure ship has cells to be considered sunk
						sunkShipName = ship.name;
						// Simulate this ship being sunk for the allPlayerShipsSunk check
						const tempTargetShips = JSON.parse(JSON.stringify(targetShips));
						const shipInTemp = tempTargetShips.find(s => s.name === sunkShipName);
						if(shipInTemp) shipInTemp.sunk = true;
						allPlayerShipsSunk = tempTargetShips.every(s => s.sunk);
						break; // Found the sunk ship for this attack
					}
				}
				// If no specific ship was sunk by this hit, check if this hit completes sinking of all ships
				if (!sunkShipName) {
				    const tempTargetShips = JSON.parse(JSON.stringify(targetShips));
				    allPlayerShipsSunk = tempTargetShips.every(ship => {
				        if (ship.sunk) return true;
				        return (ship.occupiedCells || []).every(occupied_cell => {
				            if (occupied_cell.x === x && occupied_cell.y === y) return true;
				            return boardCopy[occupied_cell.y][occupied_cell.x].status === 'hit';
				        });
				    });
				}
			}
			
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
