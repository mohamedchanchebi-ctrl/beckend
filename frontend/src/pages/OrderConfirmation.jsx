import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import apiClient from '../api/client';
import usePageTitle from '../hooks/usePageTitle';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageTitle('Order Confirmed');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}/`);
        setOrder(res.data);
        
        // Trigger confetti on successful load
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF5E00', '#0066FF', '#10B981', '#FBBF24']
        });
        
      } catch (err) {
        console.error('Failed to load order confirmation', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading order details...</div>;
  if (!order) return <div style={{ padding: '4rem', textAlign: 'center' }}>Order not found.</div>;

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem' }}>✓</div>
      <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Thank you for your order!</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        Your order #{order.id} has been placed successfully and is currently <strong>{order.status}</strong>.
      </p>
      
      <div className="clean-card" style={{ padding: '2rem', textAlign: 'left', marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Order Summary</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          {order.items?.map(item => (
             <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.05rem' }}>
               <span>{item.quantity}x {item.variant?.product?.name || `Variant ${item.variant_id}`}</span>
               <span style={{ fontWeight: 600 }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
             </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.3rem' }}>
          <span>Total Paid</span>
          <span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
        {order.discount_code && (
           <p style={{ fontSize: '0.95rem', color: 'var(--success-color)', marginTop: '1rem', fontWeight: 600 }}>
              Discount applied: {order.discount_code}
           </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/products" className="btn" style={{ backgroundColor: 'transparent', color: 'var(--text-color)', border: '2px solid var(--border-color)' }}>Continue Shopping</Link>
        <Link to={`/account/orders/${order.id}`} className="btn">View Order Status</Link>
      </div>
    </div>
  );
}
