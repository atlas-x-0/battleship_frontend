import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Button, Alert, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import { getAllGamesAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const GameItem = ({ game, currentUserId, onJoin }) => {
    const isOpenGame = game.status === 'Open';
    const isCompletedGame = game.status === 'Completed';
    const userIsPlayer1 = currentUserId && game.player1 && (game.player1._id === currentUserId || game.player1 === currentUserId);
    const userIsPlayer2 = currentUserId && game.player2 && (game.player2._id === currentUserId || game.player2 === currentUserId);
    const userIsInGame = userIsPlayer1 || userIsPlayer2;
    const canJoin = isOpenGame && !userIsPlayer1 && currentUserId;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <ListGroup.Item className="mb-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div className="me-auto">
                    <h5 className="mb-1">
                        Game ID: {game._id.substring(0, 8)}...
                        <Badge 
                            bg={
                                isOpenGame ? 'success' : 
                                isCompletedGame ? 'secondary' : 
                                'primary'
                            }
                            className="ms-2"
                        >
                            {game.status}
                        </Badge>
                    </h5>
                    <p className="mb-1">
                        Player 1: {game.player1 ? (game.player1.username || 'Unknown') : 'N/A'} 
                        {userIsPlayer1 && <Badge bg="info" className="ms-1">(You)</Badge>}
                        <br />
                        Player 2: {game.player2 ? (game.player2.username || 'Unknown') : 
                            (isOpenGame ? <span className="text-success">Open Slot</span> : 'N/A')}
                        {userIsPlayer2 && <Badge bg="info" className="ms-1">(You)</Badge>}
                        {isCompletedGame && game.winner && (
                            <div className="mt-1">
                                Winner: <strong>{game.winner.username || 'Unknown'}</strong>
                                {currentUserId && game.winner && 
                                 (game.winner._id === currentUserId || game.winner === currentUserId) && 
                                 <Badge bg="warning" text="dark" className="ms-1">You Won!</Badge>}
                            </div>
                        )}
                    </p>
                    <small>
                        Created: {formatDate(game.createdAt)}
                        {isCompletedGame && game.endedAt && (
                            <> • Completed: {formatDate(game.endedAt)}</>
                        )}
                    </small>
                </div>
                <div className="d-flex mt-2 mt-md-0">
                    {canJoin && (
                        <Button 
                            variant="success" 
                            onClick={() => onJoin(game._id)}
                            size="sm"
                            className="me-2"
                        >
                            Join Game
                        </Button>
                    )}
                    {userIsInGame && game.status !== 'Open' && (
                        <Button 
                            as={Link} 
                            to={`/game/${game._id}`}
                            variant="primary"
                            size="sm"
                        >
                            {isCompletedGame ? 'View Game' : 'Play Game'}
                        </Button>
                    )}
                    {!userIsInGame && (
                        <Button 
                            as={Link} 
                            to={`/game/${game._id}`}
                            variant="outline-secondary"
                            size="sm"
                        >
                            View Game
                        </Button>
                    )}
                </div>
            </div>
        </ListGroup.Item>
    );
};

const AllGamesPage = () => {
    const [games, setGames] = useState({
        openGames: [],
        myOpenGames: [],
        myActiveGames: [],
        myCompletedGames: [],
        otherGames: [],
        activeGames: [],
        completedGames: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const categorizeGames = useCallback((gamesList, currentUserId) => {
        if (!gamesList || !Array.isArray(gamesList)) {
            console.warn("categorizeGames received invalid gamesList:", gamesList);
            return {
                myOpenGames: [],
                openGames: [],
                myActiveGames: [],
                myCompletedGames: [],
                otherGames: [],
                publicActiveGames: [],
                publicCompletedGames: []
            };
        }

        const categorized = {
            myOpenGames: [],
            openGames: [],      // Open for others
            myActiveGames: [],
            myCompletedGames: [],
            otherGames: [],     // Other people's active/completed games
            publicActiveGames: [],
            publicCompletedGames: []
        };

        console.log(`[CategorizeGames] Starting. Current User ID: ${currentUserId}. Games to process: ${gamesList.length}`);

        for (const game of gamesList) {
            if (!game || typeof game !== 'object' || !game.status || !game.player1 || typeof game.player1 !== 'object' || !game.player1._id) {
                console.warn("[CategorizeGames] Skipping invalid game object due to missing essential properties:", game);
                continue;
            }

            console.log(`[CategorizeGames] Processing game ID: ${game._id}, Status: ${game.status}, P1_ID: ${game.player1._id}, P2_ID: ${game.player2?._id ?? 'N/A'}`);

            const isP1Me = game.player1._id === currentUserId;
            const isP2Me = game.player2?._id === currentUserId; // Optional chaining for player2._id
            const isMyGame = isP1Me || isP2Me;

            if (currentUserId) { // User is logged in
                console.log(`[CategorizeGames] User is logged in. Game ID: ${game._id}, isP1Me: ${isP1Me}, isP2Me: ${isP2Me}, isMyGame: ${isMyGame}`);
                if (game.status === 'Open') {
                    if (isP1Me && !game.player2?._id) { // My open game (I am P1, P2 not present or P2 ID missing)
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as myOpenGames.`);
                        categorized.myOpenGames.push(game);
                    } else if (game.player1._id !== currentUserId && !game.player2?._id) { // Open for others (P1 is not me, P2 not present)
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as openGames.`);
                        categorized.openGames.push(game);
                    } else {
                         console.log(`[CategorizeGames] Game ID: ${game._id} (Status: Open) did not fit 'myOpenGames' or 'openGames' for logged-in user.`);
                    }
                } else if (game.status === 'Active') {
                    if (isMyGame) {
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as myActiveGames.`);
                        categorized.myActiveGames.push(game);
                    } else if (game.player2?._id) { // Active game, not mine, and P2 exists (implies it's an ongoing game between others)
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as otherGames (Active).`);
                        categorized.otherGames.push(game);
                    } else {
                        console.log(`[CategorizeGames] Game ID: ${game._id} (Status: Active) did not fit 'myActiveGames' or 'otherGames' for logged-in user.`);
                    }
                } else if (game.status === 'Completed') {
                    if (isMyGame) {
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as myCompletedGames.`);
                        categorized.myCompletedGames.push(game);
                    } else if (game.player2?._id) { // Completed game, not mine, and P2 exists
                        console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as otherGames (Completed).`);
                        categorized.otherGames.push(game);
                    } else {
                         console.log(`[CategorizeGames] Game ID: ${game._id} (Status: Completed) did not fit 'myCompletedGames' or 'otherGames' for logged-in user.`);
                    }
                } else {
                    console.log(`[CategorizeGames] Game ID: ${game._id} has unhandled status: ${game.status} for logged-in user.`);
                }
            } else { // User is not logged in
                console.log(`[CategorizeGames] User is not logged in. Processing game ID: ${game._id}`);
                if (game.status === 'Active' && game.player1?._id && game.player2?._id) {
                    console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as publicActiveGames.`);
                    categorized.publicActiveGames.push(game);
                } else if (game.status === 'Completed' && game.player1?._id && game.player2?._id) {
                    console.log(`[CategorizeGames] Game ID: ${game._id} categorizing as publicCompletedGames.`);
                    categorized.publicCompletedGames.push(game);
                } else {
                    console.log(`[CategorizeGames] Game ID: ${game._id} (Status: ${game.status}) did not fit public categories for anonymous user.`);
                }
            }
        }
        console.log("[CategorizeGames] Final categorized object:", JSON.parse(JSON.stringify(categorized))); // Deep copy for logging to avoid issues with mutable objects
        return categorized;
    }, []);

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch all games with a single API call
            console.log("[FetchGames] Attempting to fetch all games from API...");
            const allGamesList = await getAllGamesAPI(); // Assuming this now fetches all relevant games
            console.log(`[FetchGames] Received ${allGamesList ? allGamesList.length : 0} games from API.`);

            // 2. Get currentUserId (can be null if not authenticated)
            const currentUserId = isAuthenticated && user ? user.id : null;
            console.log(`[FetchGames] Current user ID for categorization: ${currentUserId}`);
            
            // 3. Use the categorizeGames function to process the list
            // Ensure categorizeGames is included in the dependency array of this useCallback
            const categorizedReturn = categorizeGames(allGamesList || [], currentUserId);
            
            console.log("[FetchGames] Games after categorization:", JSON.parse(JSON.stringify(categorizedReturn)));

            // 4. Set the state using the categorized lists
            setGames({
                openGames: categorizedReturn.openGames || [],
                myOpenGames: categorizedReturn.myOpenGames || [],
                myActiveGames: categorizedReturn.myActiveGames || [],
                myCompletedGames: categorizedReturn.myCompletedGames || [],
                otherGames: categorizedReturn.otherGames || [],
                activeGames: categorizedReturn.publicActiveGames || [], // Used for anonymous view
                completedGames: categorizedReturn.publicCompletedGames || [] // Used for anonymous view
            });

        } catch (err) {
            console.error("[FetchGames] Failed to fetch or process games:", err);
            setError(err.response?.data?.msg || err.message || "Failed to load games.");
        } finally {
            setIsLoading(false);
            console.log("[FetchGames] Finished fetching and processing games.");
        }
    }, [isAuthenticated, user, categorizeGames]); // Added categorizeGames as a dependency

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleJoinGame = (gameId) => {
        if (!isAuthenticated) {
            alert("Please login to join a game.");
            navigate("/login", { state: { from: '/games' } });
            return;
        }
        // Navigate to ship placement page for joining, pass gameId
        navigate(`/ship-placement/${gameId}`);
    };

    const handleCreateGame = () => {
        console.log("[AllGamesPage] Attempting to create a new game...");
        if (!isAuthenticated || !user) {
            console.log("[AllGamesPage] Create game attempt by unauthenticated user.");
            alert("Please login to create a game.");
            navigate("/login", { state: { from: '/games' } });
            return;
        }

        // Check for existing open or active games for the current user
        const hasMyOpenGames = games.myOpenGames && games.myOpenGames.length > 0;
        const hasMyActiveGames = games.myActiveGames && games.myActiveGames.length > 0;

        if (hasMyOpenGames || hasMyActiveGames) {
            console.log(`[AllGamesPage] Create game denied. User has existing games. MyOpen: ${hasMyOpenGames}, MyActive: ${hasMyActiveGames}`);
            let message = "You already have ";
            if (hasMyOpenGames && hasMyActiveGames) {
                message += "an open game and an active game.";
            } else if (hasMyOpenGames) {
                message += "an open game waiting for an opponent.";
            } else {
                message += "an active game in progress.";
            }
            message += " Please complete or manage it before creating a new one.";
            alert(message);
        } else {
            console.log("[AllGamesPage] No existing open/active games for user. Proceeding to ship placement.");
            navigate('/ship-placement');
        }
    };

    if (isLoading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border">
                    <span className="visually-hidden">Loading games...</span>
                </Spinner>
                <p>Loading available games...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-3">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <Button onClick={fetchGames} variant="outline-danger">Try Again</Button>
                </Alert>
            </Container>
        );
    }

    // 为已登录用户渲染游戏列表
    if (isAuthenticated && user) {
        return (
            <Container className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Games List</h2>
                    <Button variant="success" onClick={handleCreateGame}>Create New Game</Button>
                </div>

                <Tabs defaultActiveKey="openGames" className="mb-4">
                    <Tab eventKey="openGames" title={`Open Games (${games.openGames.length})`}>
                        <Card body>
                            {games.openGames.length === 0 ? (
                                <Alert variant="info">No open games available at the moment.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.openGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={user.id}
                                            onJoin={handleJoinGame} 
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card>
                    </Tab>

                    <Tab eventKey="myOpenGames" title={`My Open Games (${games.myOpenGames.length})`}>
                        <Card body>
                            {games.myOpenGames.length === 0 ? (
                                <Alert variant="info">
                                    You don't have any open games waiting for opponents.
                                    <Button 
                                        variant="success" 
                                        size="sm" 
                                        className="ms-3"
                                        onClick={handleCreateGame}
                                    >
                                        Create New Game
                                    </Button>
                                </Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.myOpenGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={user.id}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card>
                    </Tab>

                    <Tab eventKey="myActiveGames" title={`My Active Games (${games.myActiveGames.length})`}>
                        <Card body>
                            {games.myActiveGames.length === 0 ? (
                                <Alert variant="info">You don't have any active games.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.myActiveGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={user.id}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card>
                    </Tab>

                    <Tab eventKey="myCompletedGames" title={`My Completed Games (${games.myCompletedGames.length})`}>
                        <Card body>
                            {games.myCompletedGames.length === 0 ? (
                                <Alert variant="info">You don't have any completed games yet.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.myCompletedGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={user.id}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card>
                    </Tab>

                    <Tab eventKey="otherGames" title={`Other Games (${games.otherGames.length})`}>
                        <Card body>
                            {games.otherGames.length === 0 ? (
                                <Alert variant="info">No other games available to view.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.otherGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={user.id}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card>
                    </Tab>
                </Tabs>
            </Container>
        );
    }

    // 为未登录用户渲染游戏列表
    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Games List</h2>
                <Button variant="primary" onClick={() => navigate('/login')}>
                    Login to Play
                </Button>
            </div>

            <Row>
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Header as="h5">Active Games ({games.activeGames.length})</Card.Header>
                        <Card.Body>
                            {games.activeGames.length === 0 ? (
                                <Alert variant="info">No active games at the moment.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.activeGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={null}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Header as="h5">Completed Games ({games.completedGames.length})</Card.Header>
                        <Card.Body>
                            {games.completedGames.length === 0 ? (
                                <Alert variant="info">No completed games to display.</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {games.completedGames.map(game => (
                                        <GameItem 
                                            key={game._id} 
                                            game={game} 
                                            currentUserId={null}
                                            onJoin={handleJoinGame}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AllGamesPage; 
