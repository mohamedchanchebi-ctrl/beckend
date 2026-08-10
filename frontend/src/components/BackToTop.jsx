import React, { useState, useEffect } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        backgroundColor: 'var(--primary-color)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        fontSize: '1.5rem',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
