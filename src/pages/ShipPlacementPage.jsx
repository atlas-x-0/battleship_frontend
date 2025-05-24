import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';

import { Fleet } from '../components/Fleet';
import { InteractivePlayerBoard } from '../components/InteractivePlayerBoard';
import { AVAILABLE_SHIPS, SQUARE_STATE, BOARD_ROWS, BOARD_COLUMNS } from '../utils/gameConfig';
import { createGameAPI, joinGameAPI } from '../services/apiService';
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
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    // Get gameId from URL path parameters
    const { gameId } = useParams();

    // Determine mode and gameIdToJoin based on the presence of gameId from path params
    const mode = gameId ? 'join' : 'create';
    const gameIdToJoin = gameId;

    const [shipsToPlace, setShipsToPlace] = useState(
        AVAILABLE_SHIPS.map(s => ({ ...s, placed: false, position: null, orientation: 'horizontal', occupiedCells: [] }))
    );
    const [boardLayout, setBoardLayout] = useState(initialPlayerBoardLayout());
    const [currentlyPlacing, setCurrentlyPlacing] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            console.log("[ShipPlacementPage] User not authenticated, redirecting to login.");
            navigate('/login', { replace: true, state: { from: location } });
        }
    }, [isAuthenticated, isAuthLoading, navigate, location]);

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

        const layoutData = {
            ships: shipsToPlace.map(s => ({ 
                name: s.name,
                length: s.length,
                position: s.position,       // Position of the head of the ship
                orientation: s.orientation,
                occupiedCells: s.occupiedCells, // Array of {x, y} for all cells the ship occupies
                sunk: false
            })),
            boardCells: boardLayout.map(row =>
                row.map(cell => ({
                    isShip: cell.state === SQUARE_STATE.ship,
                }))
            )
        };

        console.log("[ShipPlacementPage] Layout data being sent to backend:", JSON.stringify(layoutData, null, 2));

        try {
            if (mode === 'create') {
                console.log("[ShipPlacementPage] Mode: create. Calling createGameAPI.");
                const newGame = await createGameAPI(layoutData); 
                if (!newGame || !newGame._id) {
                    throw new Error("Invalid response from server when creating game");
                }
                navigate(`/game/${newGame._id}`);
            } else if (mode === 'join' && gameIdToJoin) {
                console.log(`[ShipPlacementPage] Mode: join. Game ID: ${gameIdToJoin}. Calling joinGameAPI.`);
                const joinedGame = await joinGameAPI(gameIdToJoin, layoutData); 
                if (!joinedGame || !joinedGame._id) {
                    throw new Error("Invalid response from server when joining game");
                }
                navigate(`/game/${joinedGame._id}`);
            } else {
                console.error("[ShipPlacementPage] Invalid state: mode is 'join' but gameIdToJoin is missing, or mode is invalid.");
                throw new Error("Invalid operation mode or missing game ID for join.");
            }
        } catch (err) {
            console.error(`Error during ${mode} game:`, err);
            let errorMessage = "An unexpected error occurred.";
            
            if (err.response) {
                if (err.response.status === 400) {
                    errorMessage = err.response.data?.msg || "Invalid game data. Please check your ship placement.";
                } else if (err.response.status === 401) {
                    errorMessage = "You must be logged in to perform this action.";
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

    if (isAuthLoading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Loading authentication...</p>
            </Container>
        );
    }
    
    if (!isAuthenticated) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="warning">You need to be logged in to access this page.</Alert>
                <Button onClick={() => navigate('/login', { state: { from: location } })}>Go to Login</Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={10} lg={8}>
                    <h2 className="text-center mb-4">
                        {mode === 'create' ? 'Create Your Battlefield' : 'Prepare to Join Game'}
                        {gameIdToJoin && mode === 'join' && <small className="d-block text-muted">Joining Game ID: {gameIdToJoin.substring(0,8)}...</small>}
                    </h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Fleet 
                        availableShipsToPlace={shipsToPlace}
                        chooseShipToPlace={handleChooseShip}
                        currentlyPlacingShipObject={currentlyPlacing}
                        rotateShipHandler={handleRotateShip}
                        clearPlacementHandler={handleClearBoard}
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
