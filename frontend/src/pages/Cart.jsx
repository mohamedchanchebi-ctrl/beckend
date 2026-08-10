import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import usePageTitle from '../hooks/usePageTitle';

export default function Cart() {
  const { cart, loading, cartTotal, updateQuantity, removeItem, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  usePageTitle('Cart');

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading cart...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '3rem' }}>Your Cart</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem' }}>Your cart is empty.</p>
        <Link to="/products" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Continue Shopping</Link>
      </div>
    );
  }

  const FREE_SHIPPING_THRESHOLD = 50;
  const progressPercent = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountAway = FREE_SHIPPING_THRESHOLD - cartTotal;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Your Cart</h1>
      
      {/* Free Shipping Progress */}
      <div className="clean-card" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--placeholder-bg)' }}>
        <p style={{ margin: '0 0 1rem 0', fontWeight: 600, fontSize: '1.05rem', textAlign: 'center' }}>
          {amountAway > 0 
            ? `You are $${amountAway.toFixed(2)} away from FREE shipping!` 
            : '🎉 You qualify for FREE shipping!'}
        </p>
        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            backgroundColor: amountAway > 0 ? 'var(--primary-color)' : 'var(--success-color)',
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        
        {/* Cart Items */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cart.items.map(item => {
            const variant = item.variant_details;
            const product = variant?.product_details;
            const price = parseFloat(product?.base_price || 0) + parseFloat(variant?.price_modifier || 0);

            return (
              <div key={item.id} className="clean-card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem' }}>
                <div style={{ width: '120px', height: '120px', backgroundColor: 'var(--placeholder-bg)', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', padding: '1rem' }}>
                  {product?.images?.[0] && <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Link to={`/products/${product?.id}`} style={{ fontWeight: '700', fontSize: '1.3rem', color: 'var(--text-color)' }}>{product?.name}</Link>
                    <span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '1.2rem' }}>${(price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    {variant?.size && <span>Size: {variant.size} </span>}
                    {variant?.material && <span>| Material: {variant.material} </span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '2px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                        style={{ padding: '0.25rem 0.75rem', background: 'var(--placeholder-bg)', border: 'none', borderRight: '2px solid var(--border-color)', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', fontSize: '1.2rem', fontWeight: 600, color: item.quantity <= 1 ? 'var(--text-muted)' : 'var(--text-color)' }}
                      >-</button>
                      <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ padding: '0.25rem 0.75rem', background: 'var(--placeholder-bg)', border: 'none', borderLeft: '2px solid var(--border-color)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-color)' }}
                      >+</button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      style={{ color: 'var(--error-color)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
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
        <div style={{ flex: '1 1 30%', minWidth: '320px' }}>
          <div className="clean-card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Order Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>{amountAway <= 0 ? 'Free' : 'Calculated at checkout'}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '2rem' }}>
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn" style={{ width: '100%', marginBottom: '1rem', padding: '1rem', fontSize: '1.1rem' }} onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
            <button style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500, padding: '0.5rem' }} onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
