import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  usePageTitle('Login');

  // If a user tried to access a protected route, it might be in location.state.from
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Log In</h2>
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
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
          />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)' }}>Sign up</Link>
      </p>
    </div>
  );
}
