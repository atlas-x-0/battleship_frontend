import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CustomNavbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateGame = () => {
    if (!isAuthenticated) {
        alert("Please login to create a game.");
        navigate("/login");
        return;
    }
    navigate('/ship-placement?mode=create');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Battleship Online</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {isAuthenticated && (
              <Nav.Link as={Link} to="/games">All Games</Nav.Link>
            )}
            <Nav.Link as={Link} to="/rules">Rules</Nav.Link>
            <Nav.Link as={Link} to="/high-scores">High Scores</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            {isLoading ? (
              <Nav.Link disabled>Loading...</Nav.Link>
            ) : isAuthenticated && user ? (
              <>
                <Button 
                    variant="outline-success" 
                    onClick={handleCreateGame} 
                    className="me-2"
                >
                    Create New Game
                </Button>
                <NavDropdown title={`Logged in as: ${user.username}`} id="user-nav-dropdown">
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
