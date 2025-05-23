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

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (isAuthenticated && user) {
                // 已登录用户 - 获取分类游戏
                const [openGames, myOpenGames, myActiveGames, myCompletedGames, otherGames] = await Promise.all([
                    getAllGamesAPI({ type: 'open_for_others' }),
                    getAllGamesAPI({ type: 'my_open' }),
                    getAllGamesAPI({ type: 'my_active' }),
                    getAllGamesAPI({ type: 'my_completed' }),
                    getAllGamesAPI({ type: 'other_games' })
                ]);
                setGames({
                    openGames: openGames || [],
                    myOpenGames: myOpenGames || [],
                    myActiveGames: myActiveGames || [],
                    myCompletedGames: myCompletedGames || [],
                    otherGames: otherGames || [],
                    activeGames: [],
                    completedGames: []
                });
            } else {
                // 未登录用户 - 获取公开游戏
                const [activeGames, completedGames] = await Promise.all([
                    getAllGamesAPI({ status_filter: 'Active' }),
                    getAllGamesAPI({ status_filter: 'Completed' })
                ]);
                setGames({
                    openGames: [],
                    myOpenGames: [],
                    myActiveGames: [],
                    myCompletedGames: [],
                    otherGames: [],
                    activeGames: activeGames || [],
                    completedGames: completedGames || []
                });
            }
        } catch (err) {
            console.error("Failed to fetch games:", err);
            setError(err.response?.data?.msg || err.message || "Failed to load games.");
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleJoinGame = (gameId) => {
        if (!isAuthenticated) {
            alert("Please login to join a game.");
            navigate("/login", { state: { from: '/games' } });
            return;
        }
        navigate(`/ship-placement?mode=join&gameId=${gameId}`);
    };

    const handleCreateGame = () => {
        if (!isAuthenticated) {
            alert("Please login to create a game.");
            navigate("/login", { state: { from: '/ship-placement?mode=create' } });
            return;
        }
        navigate('/ship-placement?mode=create');
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
