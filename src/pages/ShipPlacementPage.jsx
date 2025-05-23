import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';

import { Fleet } from '../components/Fleet';
import { InteractivePlayerBoard } from '../components/InteractivePlayerBoard';
import { AVAILABLE_SHIPS, SQUARE_STATE, BOARD_ROWS, BOARD_COLUMNS } from '../utils/gameConfig';
import { createGameAPI, joinGameAPI } from '../services/apiService'; // Assuming joinGameAPI will be added
import { useAuth } from '../contexts/AuthContext';

// Helper functions (can be moved to a utility file if used elsewhere)
// These will be similar to or moved from Game.jsx
const initialPlayerBoardLayout = () => 
    Array(BOARD_ROWS).fill(null).map(() => 
        Array(BOARD_COLUMNS).fill({ state: SQUARE_STATE.empty, ship: null })
    );

const getShipCells = (ship, startX, startY, orientation) => {
    const cells = [];
    for (let i = 0; i < ship.length; i++) {
        if (orientation === "horizontal") cells.push({ x: startX + i, y: startY });
        else cells.push({ x: startX, y: startY + i });
    }
    return cells;
};

const validatePlacement = (board, ship, startX, startY, orientation) => {
    const shipCells = getShipCells(ship, startX, startY, orientation);
    for (const cell of shipCells) {
        if (cell.x < 0 || cell.x >= BOARD_COLUMNS || cell.y < 0 || cell.y >= BOARD_ROWS || 
            (board[cell.y] && board[cell.y][cell.x] && board[cell.y][cell.x].state === SQUARE_STATE.ship))
            return false;
    }
    return true;
};

export const ShipPlacementPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    // Determine mode and gameIdToJoin from URL query params or route state
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode') || 'create'; // 'create' or 'join'
    const gameIdToJoin = queryParams.get('gameId');

    const [shipsToPlace, setShipsToPlace] = useState(
        AVAILABLE_SHIPS.map(s => ({ ...s, placed: false, position: null, orientation: 'horizontal', occupiedCells: [] }))
    );
    const [boardLayout, setBoardLayout] = useState(initialPlayerBoardLayout());
    const [currentlyPlacing, setCurrentlyPlacing] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Ship Placement Logic (to be migrated/refined from Game.jsx) ---
    const handleChooseShip = useCallback((shipName) => {
        const shipToSelect = shipsToPlace.find(s => s.name === shipName && !s.placed);
        if (shipToSelect) {
            setCurrentlyPlacing({ ...shipToSelect, orientation: shipToSelect.orientation || 'horizontal', position: null });
        } else {
            setCurrentlyPlacing(null);
        }
    }, [shipsToPlace]);

    const handleRotateShip = useCallback(() => {
        if (!currentlyPlacing) return;
        setCurrentlyPlacing(prev => ({ ...prev, orientation: prev.orientation === 'horizontal' ? 'vertical' : 'horizontal' }));
    }, [currentlyPlacing]);

    const handlePlaceShip = useCallback((coords) => {
        if (!currentlyPlacing) {
            setError("Please select a ship to place first.");
            return;
        }
        const { x, y } = coords;
        if (validatePlacement(boardLayout, currentlyPlacing, x, y, currentlyPlacing.orientation)) {
            const newBoard = boardLayout.map(row => row.map(cell => ({...cell})));
            const cellsOccupied = getShipCells(currentlyPlacing, x, y, currentlyPlacing.orientation);
            for (const cell of cellsOccupied) {
                newBoard[cell.y][cell.x] = { state: SQUARE_STATE.ship, shipName: currentlyPlacing.name };
            }
            
            setBoardLayout(newBoard);
            setShipsToPlace(prev => prev.map(s => s.name === currentlyPlacing.name ? 
                { ...s, placed: true, position: {x,y}, orientation: currentlyPlacing.orientation, occupiedCells: cellsOccupied } : s
            ));
            setCurrentlyPlacing(null);
            setError(null);
        } else {
            setError("Invalid placement. Ship is out of bounds or overlaps.");
        }
    }, [currentlyPlacing, boardLayout]);

    const handleClearBoard = useCallback(() => {
        setBoardLayout(initialPlayerBoardLayout());
        setShipsToPlace(AVAILABLE_SHIPS.map(s => ({ ...s, placed: false, position: null, orientation: 'horizontal', occupiedCells: [] })));
        setCurrentlyPlacing(null);
        setError(null);
    }, []);

    const handleConfirmPlacement = async () => {
        const allShipsPlaced = shipsToPlace.every(ship => ship.placed);
        if (!allShipsPlaced) {
            setError("Please place all your ships before proceeding.");
            return;
        }
        setError(null);
        setIsLoading(true);

        // 将数据格式调整为后端期望的格式：包含 ships 和 boardCells
        const layoutData = {
            ships: shipsToPlace.map(s => ({ 
                name: s.name,
                length: s.length,
                position: s.position,
                orientation: s.orientation,
                occupiedCells: s.occupiedCells, 
                sunk: false
            })),
            boardCells: boardLayout // 添加棋盘状态数据
        };

        try {
            if (mode === 'create') {
                const newGame = await createGameAPI(layoutData); 
                if (!newGame || !newGame._id) {
                    throw new Error("Invalid response from server when creating game");
                }
                navigate(`/game/${newGame._id}`);
            } else if (mode === 'join' && gameIdToJoin) {
                const joinedGame = await joinGameAPI(gameIdToJoin, layoutData); 
                if (!joinedGame || !joinedGame._id) {
                    throw new Error("Invalid response from server when joining game");
                }
                navigate(`/game/${joinedGame._id}`);
            } else {
                throw new Error("Invalid mode or missing gameId for join operation.");
            }
        } catch (err) {
            console.error(`Error during ${mode} game:`, err);
            let errorMessage = "An unexpected error occurred.";
            
            // 处理特定类型的错误
            if (err.response) {
                if (err.response.status === 400) {
                    errorMessage = err.response.data?.msg || "Invalid game data. Please check your ship placement.";
                } else if (err.response.status === 401) {
                    errorMessage = "You must be logged in to perform this action.";
                    // 重定向到登录页面
                    setTimeout(() => navigate('/login', { state: { from: location } }), 2000);
                } else if (err.response.status === 404) {
                    errorMessage = "Game not found. It may have been deleted or never existed.";
                } else {
                    errorMessage = err.response.data?.msg || errorMessage;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    useEffect(() => { // Redirect if not authenticated
        if (!isAuthenticated) {
            navigate('/login', { replace: true, state: { from: location } });
        }
    }, [isAuthenticated, navigate, location]);


    if (!user && !isAuthenticated && !isLoading) { // If not authenticated and not loading, should have been redirected
        return null; // Or a message, but useEffect should handle redirect
    } 
    // Initial loading state or if user is null but auth is still loading
    if (isLoading && !user && !isAuthenticated) { 
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Loading authentication...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={10} lg={8}>
                    <h2 className="text-center mb-4">
                        {mode === 'create' ? 'Create Your Battlefield' : 'Prepare to Join Game'}
                        {gameIdToJoin && mode === 'join' && <small className="d-block text-muted">Joining Game ID: {gameIdToJoin}</small>}
                    </h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Fleet 
                        availableShipsToPlace={shipsToPlace}
                        chooseShipToPlace={handleChooseShip}
                        currentlyPlacingShipObject={currentlyPlacing}
                        rotateShipHandler={handleRotateShip}
                        clearPlacementHandler={handleClearBoard}
                        // confirmShipPlacementHandler is NOT passed to Fleet, it's a separate button below.
                    />
                    <InteractivePlayerBoard 
                        playerPlacementBoardLayout={boardLayout}
                        placeShipOnBoardHandler={handlePlaceShip}
                        currentlyPlacingShipObject={currentlyPlacing}
                    />
                    <div className="text-center mt-3 d-grid gap-2">
                        <Button variant="success" size="lg" onClick={handleConfirmPlacement} disabled={isLoading || !shipsToPlace.every(s => s.placed)}>
                            {isLoading ? 
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Processing...</> : 
                                (mode === 'create' ? 'Confirm & Create Game' : 'Confirm & Join Game')}
                        </Button>
                         <Button variant="outline-secondary" onClick={handleClearBoard} disabled={isLoading}>
                            Clear Board & Reset Ships
                        </Button>
                        <Button variant="outline-primary" onClick={() => navigate('/games')} disabled={isLoading}>
                            Back to Games List
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}; 
