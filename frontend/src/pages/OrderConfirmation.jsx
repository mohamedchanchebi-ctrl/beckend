import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}/`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order confirmation', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div>Loading order details...</div>;

  if (!order) return <div>Order not found.</div>;

  return (
    <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: 'var(--spacing-4)' }}>✓</div>
      <h1 style={{ marginBottom: 'var(--spacing-4)' }}>Thank you for your order!</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
        Your order #{order.id} has been placed successfully and is currently <strong>{order.status}</strong>.
      </p>
      
      <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'left', marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Order Summary</h2>
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          {order.items?.map(item => (
             <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
               <span>{item.quantity}x {item.variant?.product?.name || `Variant ${item.variant_id}`}</span>
               <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
             </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-4) 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
          <span>Total Paid</span>
          <span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
        {order.discount_code && (
           <p style={{ fontSize: '0.875rem', color: 'var(--color-success)', marginTop: 'var(--spacing-2)' }}>
              Discount applied: {order.discount_code}
           </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center' }}>
        <Link to="/products" className="btn" style={{ backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Continue Shopping</Link>
        <Link to={`/account/orders/${order.id}`} className="btn">View Order Status</Link>
      </div>
    </div>
  );
}
