import React from 'react';
import { Card, Button, Badge, Stack, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export const GameInfo = ({
    gameStatus,
    winnerName,
    opponentUsername,
    isMyTurn,
    surrenderHandler,
    currentTurnPlayerId,
    player1Id,
    player1Username,
    player2Id,
    player2Username
}) => {
    const navigate = useNavigate();
    
    let statusMessage = `Status: ${gameStatus}`;
    let turnMessage = "";

    switch (gameStatus) {
        case 'Open':
            statusMessage = <><Badge bg="success">Open</Badge> - Waiting for an opponent to join.</>;
            break;
        case 'PendingSetup': {
            // 显示等待哪个玩家放置船只
            const pendingPlayerName = player2Id && !player2Username ? 'Player 2' : (player1Id && !player1Username ? 'Player 1' : 
                (currentTurnPlayerId === player1Id ? player1Username : player2Username));
            statusMessage = <><Badge bg="warning" text="dark">Setup</Badge> - Waiting for {pendingPlayerName} to place ships.</>;
            break;
        }
        case 'Active': {
            statusMessage = <Badge bg="primary">Active</Badge>;
            const currentTurnPlayerName = currentTurnPlayerId === player1Id ? 
                player1Username : player2Username;
            turnMessage = isMyTurn ? 
                <Badge bg="success">Your Turn</Badge> : 
                <Badge bg="secondary">{currentTurnPlayerName}'s Turn</Badge>;
            break;
        }
        case 'Completed':
            statusMessage = <Badge bg="info">Completed</Badge>;
            if (winnerName) {
                turnMessage = <h5><Badge bg="warning" text="dark">Winner: {winnerName}</Badge></h5>;
            } else {
                turnMessage = <Badge bg="secondary">Game Over (Draw)</Badge>;
            }
            break;
        default:
            statusMessage = `Status: ${gameStatus || 'Unknown'}`;
            break;
    }

    return (
        <Card className="mb-3">
            <Card.Header as="h5">Game Information</Card.Header>
            <Card.Body>
                <Stack gap={2}>
                    <div>{statusMessage}</div>
                    {turnMessage && <div>{turnMessage}</div>}
                    <div>
                        <div>Player 1: <Badge bg="dark">{player1Username || 'Unknown'}</Badge></div>
                        <div>Player 2: <Badge bg="dark">{player2Username || (gameStatus === 'Open' ? 'Waiting...' : 'Unknown')}</Badge></div>
                    </div>
                    
                    {gameStatus === 'Active' && (
                        <Button 
                            variant="danger" 
                            onClick={surrenderHandler} 
                            size="sm" 
                            className="mt-2"
                            type="button"
                        >
                            Surrender
                        </Button>
                    )}
                    {gameStatus === 'Completed' && (
                        <Alert variant="info" className="mt-2">
                            Game Over! {winnerName ? `Winner: ${winnerName}` : "Draw game."}
                            <div className="mt-2">
                                <Button 
                                    variant="primary" 
                                    onClick={() => navigate('/games')} 
                                    size="sm"
                                    type="button"
                                >
                                    Back to Games List
                                </Button>
                                <Button 
                                    variant="success" 
                                    onClick={() => navigate('/ship-placement?mode=create')} 
                                    size="sm" 
                                    className="ms-2"
                                    type="button"
                                >
                                    Start New Game
                                </Button>
                            </div>
                        </Alert>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    );
}; 
