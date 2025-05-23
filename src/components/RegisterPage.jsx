import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../css/AuthPage.css';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { register, isLoading, error: authError, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!username || !password || !confirmPassword) {
            setLocalError('All fields are required');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }
        if (password.length < 3) {
            setLocalError('Password must be at least 3 characters long');
            return;
        }

        try {
            await register(username, password);
            navigate('/');
        } catch (err) {
            console.error("Registration page submission error:", err);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <div className="auth-card-body">
                    <h2 className="text-center auth-title">Register New Account</h2>

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
                                placeholder="Choose a username"
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
                                placeholder="Create password (at least 3 characters)"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Please re-enter your password"
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
                                {isLoading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p>Already have an account? <Link to="/login">Log In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
