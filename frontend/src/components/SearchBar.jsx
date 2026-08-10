import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.get(`/products/?search=${encodeURIComponent(query)}`);
        const data = res.data.results || res.data || [];
        setResults(data.slice(0, 5)); // show top 5
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (productId) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/products/${productId}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '250px' }}>
      <input
        type="text"
        className="form-control"
        placeholder="Search stickers..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query) setIsOpen(true); }}
        style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', borderRadius: '20px' }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: 'var(--card-shadow)',
              zIndex: 50,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>
            ) : results.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => handleSelect(r.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        color: 'var(--text-color)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {r.images && r.images[0] && (
                        <img src={r.images[0]} alt="" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                      )}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No results found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
