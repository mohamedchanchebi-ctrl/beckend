import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Cart() {
  const { cart, loading, cartTotal, updateQuantity, removeItem, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  if (loading) return <div>Loading cart...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0' }}>
        <h1 style={{ marginBottom: 'var(--spacing-4)' }}>Your Cart</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>Your cart is empty.</p>
        <Link to="/products" className="btn">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--spacing-6)' }}>Your Cart</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        
        {/* Cart Items */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {cart.items.map(item => {
            const variant = item.variant_details;
            const product = variant?.product_details;
            const price = parseFloat(product?.base_price || 0) + parseFloat(variant?.price_modifier || 0);

            return (
              <div key={item.id} className="glass-panel" style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ width: '100px', height: '100px', backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0, borderRadius: 'var(--border-radius)', overflow: 'hidden', padding: 'var(--spacing-sm)' }}>
                  {product?.images?.[0] && <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                    <Link to={`/products/${product?.id}`} style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-color)' }}>{product?.name}</Link>
                    <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>${(price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--spacing-md)' }}>
                    {variant?.size && <span>Size: {variant.size} </span>}
                    {variant?.material && <span>| Material: {variant.material} </span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}
                      >-</button>
                      <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}
                      >+</button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div style={{ flex: '1 1 30%', minWidth: '300px' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', position: 'sticky', top: '80px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-6)' }}>Order Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-4) 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: 'var(--spacing-6)' }}>
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn" style={{ width: '100%', marginBottom: 'var(--spacing-2)' }} onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
            <button style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
