import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import { Game } from './components/Game';
import Rules from './components/Rules';
import Navbar from './components/Navbar';
import Scores from './components/Scores';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { useAuth } from './contexts/AuthContext';
import { ShipPlacementPage } from './pages/ShipPlacementPage';
import AllGamesPage from './pages/AllGamesPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="container text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="container text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-3 app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/high-scores" element={<Scores />} />
          <Route path="/games" element={<ProtectedRoute><AllGamesPage /></ProtectedRoute>} />
          <Route 
            path="/game/:gameId" 
            element={ 
              <ProtectedRoute>
                <Game /> 
              </ProtectedRoute>
            }
          />
          <Route 
            path="/ship-placement/:gameId"
            element={<ProtectedRoute><ShipPlacementPage /></ProtectedRoute>} 
          />
          <Route 
            path="/ship-placement"
            element={<ProtectedRoute><ShipPlacementPage /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
