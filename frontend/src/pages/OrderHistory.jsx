import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageTitle from '../hooks/usePageTitle';

export const OrderStatusBadge = ({ status }) => {
  let badgeClass = 'badge-default';
  
  switch(status?.toLowerCase()) {
    case 'pending': badgeClass = 'badge-pending'; break;
    case 'paid': badgeClass = 'badge-paid'; break;
    case 'shipped': badgeClass = 'badge-shipped'; break;
    case 'delivered': badgeClass = 'badge-delivered'; break;
    case 'cancelled': badgeClass = 'badge-cancelled'; break;
  }

  return (
    <span className={badgeClass} style={{ 
      display: 'inline-block', 
      padding: '0.3rem 0.75rem', 
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {status}
    </span>
  );
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Order History');

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

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading order history...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Order History</h1>
        <Link to="/account" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontWeight: 500 }}>Back to Account</Link>
      </div>

      {orders.length === 0 ? (
        <div className="clean-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} className="clean-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>Order #{order.id}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
                <div>
                   <OrderStatusBadge status={order.status} />
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
