import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { CartContext } from '../context/CartContext';
import usePageTitle from '../hooks/usePageTitle';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useContext(CartContext);
  const navigate = useNavigate();

  usePageTitle('My Wishlist');

  const fetchWishlist = async () => {
    try {
      const res = await apiClient.get('/wishlist/');
      setWishlist(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await apiClient.delete(`/wishlist/${productId}/`);
      await fetchWishlist(); // Refresh list
    } catch (e) {
      console.error(e);
      alert('Failed to remove from wishlist.');
    }
  };

  const handleAddToCart = async (product) => {
    // If it has variants, better to navigate to detail page to select size/material
    if (product.variants && product.variants.length > 0) {
       navigate(`/products/${product.id}`);
    } else {
       // If no variants, just generic fallback (unlikely per spec, but safe fallback)
       navigate(`/products/${product.id}`);
    }
  };

  if (loading) return <div>Loading wishlist...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1>My Wishlist</h1>
        <Link to="/account" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Back to Account</Link>
      </div>

      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>Your wishlist is empty.</p>
          <Link to="/products" className="btn">Explore Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--spacing-6)' }}>
          {wishlist.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item.id} style={{ backgroundColor: 'var(--surface-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column' }}>
                <Link to={`/products/${product.id}`} style={{ display: 'block', height: '200px', backgroundColor: 'var(--placeholder-bg)', flexShrink: 0 }}>
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>No Image</div>
                  )}
                </Link>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-1)' }}><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
                  <p style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: 'var(--spacing-4)' }}>${product.base_price}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 'var(--spacing-2)' }}>
                    <button className="btn" style={{ flex: 1, padding: '0.25rem' }} onClick={() => handleAddToCart(product)}>View & Add</button>
                    <button className="btn" style={{ flex: 1, padding: '0.25rem', backgroundColor: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error)' }} onClick={() => handleRemove(product.id)}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
