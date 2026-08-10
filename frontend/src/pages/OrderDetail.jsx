import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageTitle from '../hooks/usePageTitle';
import { OrderStatusBadge } from './OrderHistory';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(order ? `Order #${order.id}` : 'Order Detail');

  // Review state
  const [reviewFormOpenFor, setReviewFormOpenFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}/`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const submitReview = async (productId) => {
    setSubmittingReview(true);
    setReviewError('');
    try {
      await apiClient.post(`/products/${productId}/reviews/`, {
        rating,
        comment
      });
      alert('Review submitted successfully!');
      setReviewFormOpenFor(null);
      setRating(5);
      setComment('');
    } catch (e) {
       // If it fails, maybe they already reviewed it or order isn't delivered.
       if (e.response?.data?.detail) {
         setReviewError(e.response.data.detail);
       } else if (e.response?.data?.non_field_errors) {
         setReviewError(e.response.data.non_field_errors[0]);
       } else {
         setReviewError('Failed to submit review.');
       }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading order details...</div>;
  if (!order) return <div style={{ padding: '4rem', textAlign: 'center' }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Order #{order.id}</h1>
        <Link to="/account/orders" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontWeight: 500 }}>Back to History</Link>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap-reverse' }}>
        
        <div style={{ flex: '1 1 60%' }}>
          <div className="clean-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
             <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Items</h2>
             {order.items?.map(item => {
               const productDetails = item.variant_details?.product_details;
               const productId = productDetails?.id;
               
               return (
                 <div key={item.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                   <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--placeholder-bg)', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', padding: '0.5rem' }}>
                     {productDetails?.images?.[0] && <img src={productDetails.images[0]} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                       <Link to={`/products/${productId}`} style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-color)' }}>{productDetails?.name || 'Unknown Product'}</Link>
                       <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                     </div>
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                       Qty: {item.quantity} @ ${parseFloat(item.unit_price).toFixed(2)}
                     </div>
                     
                     {/* Show Review Button ONLY if order is delivered */}
                     {order.status === 'delivered' && productId && (
                       <div style={{ marginTop: '1rem' }}>
                         {reviewFormOpenFor === productId ? (
                           <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'var(--placeholder-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                             <h4 style={{ marginBottom: '1rem' }}>Write a Review</h4>
                             {reviewError && <div className="form-error" style={{ marginBottom: '1rem' }}>{reviewError}</div>}
                             <div className="form-group">
                               <label>Rating (1-5)</label>
                               <input type="number" min="1" max="5" className="form-control" value={rating} onChange={e => setRating(parseInt(e.target.value))} />
                             </div>
                             <div className="form-group">
                               <label>Comment</label>
                               <textarea className="form-control" rows="3" value={comment} onChange={e => setComment(e.target.value)}></textarea>
                             </div>
                             <div style={{ display: 'flex', gap: '1rem' }}>
                               <button className="btn" onClick={() => submitReview(productId)} disabled={submittingReview}>Submit Review</button>
                               <button className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }} onClick={() => setReviewFormOpenFor(null)}>Cancel</button>
                             </div>
                           </div>
                         ) : (
                           <button onClick={() => { setReviewFormOpenFor(productId); setReviewError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.95rem', padding: 0 }}>
                             Write a Review
                           </button>
                         )}
                       </div>
                     )}
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

        <div style={{ flex: '1 1 35%', minWidth: '300px' }}>
          <div className="clean-card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <strong>Status:</strong> 
              <OrderStatusBadge status={order.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong>Date:</strong> 
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <span>Total Paid</span>
              <span style={{ fontWeight: 'bold' }}>${parseFloat(order.total).toFixed(2)}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />
            
            <h4 style={{ marginBottom: '0.5rem' }}>Shipping Address</h4>
            <pre style={{ fontFamily: 'inherit', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
              {order.shipping_address}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
