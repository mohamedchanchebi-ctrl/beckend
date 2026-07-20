import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProductCard({ prod }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-15deg to 15deg)
    const rX = -((y / rect.height) - 0.5) * 30;
    const rY = ((x / rect.width) - 0.5) * 30;
    
    // Calculate glare position
    const gX = (x / rect.width) * 100;
    const gY = (y / rect.height) * 100;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({ x: gX, y: gY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <Link to={`/products/${prod.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          perspective: 1000,
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          className="glass-panel"
          animate={{ rotateX, rotateY }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
          style={{
            height: '320px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Holographic Glare */}
          <motion.div
            animate={{ opacity: rotateX !== 0 || rotateY !== 0 ? 1 : 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 10,
              mixBlendMode: 'overlay',
            }}
          />

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', transform: 'translateZ(30px)' }}>
            {prod.images && prod.images.length > 0 ? (
              <img 
                src={prod.images[0]} 
                alt={prod.name} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))'
                }} 
              />
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No Image</span>
            )}
          </div>
          
          <div style={{ padding: 'var(--spacing-md)', background: 'rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-sm)', color: 'var(--text-color)' }}>{prod.name}</h3>
            <p style={{ fontWeight: '900', color: 'var(--primary-color)', fontSize: '1.1rem' }}>${prod.base_price}</p>
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}
