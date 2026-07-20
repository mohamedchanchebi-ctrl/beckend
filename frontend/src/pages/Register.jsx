import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register the user via DRF
      await apiClient.post('/auth/register', { 
        first_name: firstName, 
        last_name: lastName, 
        email, 
        password 
      });
      
      // 2. Automatically log them in
      await login(email, password);
      
      // 3. Redirect to home
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        // Simple error parsing (assuming DRF dict response format)
        const messages = Object.values(err.response.data).flat();
        setError(messages[0] || 'Registration failed.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Sign Up</h2>
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              type="text"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              type="text"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
      </p>
    </div>
  );
}
