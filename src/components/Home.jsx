import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNavigate = (path) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  return (
    <Container className="text-center mt-5">
      <h1 className="mb-4">Welcome to Battleship!</h1>
      <div className="d-flex flex-column align-items-center gap-3" style={{ maxWidth: '300px', margin: '0 auto' }}>
        <Button
          variant="primary"
          size="lg"
          className="w-100"
          onClick={() => handleNavigate('/ship-placement?mode=create')}
        >
          Create New Game
        </Button>
        <Button
          variant="success"
          size="lg"
          className="w-100"
          onClick={() => handleNavigate('/games')}
        >
          Join Existing Game
        </Button>
        <Button
          variant="info"
          size="lg"
          className="w-100"
          onClick={() => navigate('/rules')}
        >
          Game Rules
        </Button>
      </div>
    </Container>
  );
};

export default Home;
