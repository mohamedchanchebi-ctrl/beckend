import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading order details...</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1>Order #{order.id}</h1>
        <Link to="/account/orders" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Back to History</Link>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 60%' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--spacing-6)' }}>
             <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Items</h2>
             {order.items?.map(item => {
               const productId = item.variant?.product?.id;
               
               return (
                 <div key={item.id} style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
                   <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                     {item.variant?.product?.images?.[0] && <img src={item.variant.product.images[0]} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Link to={`/products/${productId}`} style={{ fontWeight: '600' }}>{item.variant?.product?.name || 'Unknown Product'}</Link>
                       <span style={{ fontWeight: 'bold' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                     </div>
                     <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                       Qty: {item.quantity} @ ${parseFloat(item.unit_price).toFixed(2)}
                     </div>
                     
                     {/* Show Review Button ONLY if order is delivered */}
                     {order.status === 'delivered' && productId && (
                       <div style={{ marginTop: 'var(--spacing-2)' }}>
                         {reviewFormOpenFor === productId ? (
                           <div style={{ marginTop: 'var(--spacing-2)', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-bg-page)', borderRadius: 'var(--radius-sm)' }}>
                             <h4 style={{ marginBottom: 'var(--spacing-2)' }}>Write a Review</h4>
                             {reviewError && <div className="form-error" style={{ marginBottom: 'var(--spacing-2)' }}>{reviewError}</div>}
                             <div className="form-group">
                               <label>Rating (1-5)</label>
                               <input type="number" min="1" max="5" className="form-control" value={rating} onChange={e => setRating(parseInt(e.target.value))} />
                             </div>
                             <div className="form-group">
                               <label>Comment</label>
                               <textarea className="form-control" rows="3" value={comment} onChange={e => setComment(e.target.value)}></textarea>
                             </div>
                             <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                               <button className="btn" onClick={() => submitReview(productId)} disabled={submittingReview}>Submit</button>
                               <button className="btn" style={{ background: 'transparent', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' }} onClick={() => setReviewFormOpenFor(null)}>Cancel</button>
                             </div>
                           </div>
                         ) : (
                           <button onClick={() => { setReviewFormOpenFor(productId); setReviewError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.875rem' }}>
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

        <div style={{ flex: '1 1 35%' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Summary</h3>
            <p><strong>Status:</strong> <span style={{ textTransform: 'uppercase' }}>{order.status}</span></p>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-4) 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <span>Total Paid</span>
              <span style={{ fontWeight: 'bold' }}>${parseFloat(order.total).toFixed(2)}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-4) 0' }} />
            
            <h4 style={{ marginBottom: 'var(--spacing-2)' }}>Shipping Address</h4>
            <pre style={{ fontFamily: 'inherit', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
              {order.shipping_address}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
