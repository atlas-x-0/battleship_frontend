import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../css/AuthPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { login, isLoading, error: authError, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!username || !password) {
            setLocalError('Username and password cannot be empty');
            return;
        }

        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            console.error("Login page submission error:", err);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <div className="auth-card-body">
                    <h2 className="text-center auth-title">Login</h2>

                    {(localError || authError) && (
                        <div className="alert alert-danger">
                            {localError || authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                id="username"
                                className="form-control"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                id="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="form-button-wrapper">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p>Don't have an account yet? <Link to="/register">Register Now</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
