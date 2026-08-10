import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProductCard({ prod }) {
  return (
    <Link to={`/products/${prod.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        className="clean-card"
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-color)',
          position: 'relative'
        }}
      >
        {prod.created_at && (new Date() - new Date(prod.created_at)) / (1000 * 60 * 60 * 24) <= 14 && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'var(--primary-color)',
            color: '#FFFFFF',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(255,94,0,0.3)'
          }}>
            New
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--placeholder-bg)' }}>
          {prod.images && prod.images.length > 0 ? (
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              src={prod.images[0]} 
              alt={prod.name} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '220px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
              }} 
            />
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No Image</span>
          )}
        </div>
        
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-color)', fontWeight: 700 }}>{prod.name}</h3>
          <p style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.1rem', margin: 0 }}>${prod.base_price}</p>
        </div>
      </motion.div>
    </Link>
  );
}
