import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function AccountSettings() {
  const { user, setUser, logout } = useContext(AuthContext);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      // Depending on backend serialization, user might have first_name, last_name, or just name
      setFirstName(user.first_name || user.name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      const res = await apiClient.put('/auth/me', {
        first_name: firstName,
        last_name: lastName,
        email: email
      });
      setUser(res.data);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-6)' }}>My Account</h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        {/* Navigation Sidebar */}
        <aside style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            <Link to="/account" style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}>Profile Settings</Link>
            <Link to="/account/orders" style={{ padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-sm)' }}>Order History</Link>
            <Link to="/account/wishlist" style={{ padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-sm)' }}>Wishlist</Link>
            <button onClick={logout} style={{ textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--color-error)', padding: 'var(--spacing-2) var(--spacing-4)', cursor: 'pointer', marginTop: 'var(--spacing-4)' }}>Log Out</button>
          </div>
        </aside>

        {/* Profile Settings Form */}
        <div style={{ flex: '1 1 500px' }}>
          <div className="form-card" style={{ margin: 0, maxWidth: '100%' }}>
            <h2 style={{ textAlign: 'left', marginBottom: 'var(--spacing-4)' }}>Profile Settings</h2>
            
            {successMsg && <div style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-4)' }}>{successMsg}</div>}
            {errorMsg && <div className="form-error" style={{ marginBottom: 'var(--spacing-4)' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
