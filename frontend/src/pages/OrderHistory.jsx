import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/orders/');
        setOrders(res.data.results || res.data || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div>Loading order history...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1>Order History</h1>
        <Link to="/account" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Back to Account</Link>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-8) 0', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {orders.map(order => (
            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-1)' }}>Order #{order.id}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
                <div style={{ marginTop: 'var(--spacing-2)' }}>
                   <span style={{ 
                     display: 'inline-block', 
                     padding: '0.25rem 0.5rem', 
                     backgroundColor: order.status === 'delivered' ? '#dcfce7' : '#f3f4f6', 
                     color: order.status === 'delivered' ? '#166534' : '#374151',
                     borderRadius: 'var(--radius-sm)',
                     fontSize: '0.75rem',
                     fontWeight: 'bold',
                     textTransform: 'uppercase'
                   }}>
                     {order.status}
                   </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: 'var(--spacing-2)' }}>${parseFloat(order.total).toFixed(2)}</p>
                <Link to={`/account/orders/${order.id}`} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
