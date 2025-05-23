import React from 'react';
import { Button, ListGroup, Card, Stack } from 'react-bootstrap';

export const Fleet = ({
    availableShipsToPlace,      // Array of ship objects { name, size, placed, orientation, ... }
    chooseShipToPlace,          // (shipName) => void
    currentlyPlacingShipObject, // The ship object being placed, or null
    rotateShipHandler,          // () => void
    clearPlacementHandler,      // () => void
    confirmShipPlacementHandler // () => void
}) => {

    const allShipsPlaced = availableShipsToPlace.every(ship => ship.placed);

    return (
        <Card className="mb-3">
            <Card.Header as="h5">Place Your Fleet</Card.Header>
            <Card.Body>
                <ListGroup variant="flush" className="mb-3">
                    {availableShipsToPlace.map(ship => (
                        <ListGroup.Item 
                            key={ship.name} 
                            action 
                            onClick={() => !ship.placed && chooseShipToPlace(ship.name)}
                            active={currentlyPlacingShipObject?.name === ship.name && !ship.placed}
                            disabled={ship.placed}
                            variant={ship.placed ? 'success' : 'light'}
                            className="d-flex justify-content-between align-items-center"
                        >
                            {ship.name} (Size: {ship.size}) {ship.placed ? <span className="badge bg-success ms-2">Placed</span> : ''}
                            {currentlyPlacingShipObject?.name === ship.name && !ship.placed && 
                                <span className="badge bg-primary ms-2">Selected</span>
                            }
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                    <Button 
                        variant="info" 
                        onClick={rotateShipHandler} 
                        disabled={!currentlyPlacingShipObject || currentlyPlacingShipObject.placed}
                        className="mb-2"
                        title={!currentlyPlacingShipObject || currentlyPlacingShipObject.placed ? "Select an unplaced ship to rotate" : "Rotate Selected Ship"}
                    >
                        Rotate Ship (Current: {currentlyPlacingShipObject?.orientation || 'N/A'})
                    </Button>
                    <Button variant="warning" onClick={clearPlacementHandler} className="mb-2">Clear All Ships</Button>
                    <Button 
                        variant="success" 
                        onClick={confirmShipPlacementHandler} 
                        disabled={!allShipsPlaced} 
                        className="mb-2 ms-auto" // Push to the right
                        title={!allShipsPlaced ? "Place all ships to confirm" : "Confirm Ship Placement"}
                    >
                        Confirm Placement
                    </Button>
                </Stack>
            </Card.Body>
        </Card>
    );
}; 
