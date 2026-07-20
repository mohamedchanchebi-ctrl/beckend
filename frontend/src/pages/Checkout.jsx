import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiClient from '../api/client';
import { CartContext } from '../context/CartContext';

// Initialize Stripe (use a fake test key if not provided by env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

function CheckoutForm({ clientSecret, intentId, shippingAddress, discountCode }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Confirm the card payment
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          address: {
            line1: shippingAddress,
          }
        }
      }
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment succeeded, now confirm order on backend
      try {
        const res = await apiClient.post('/orders/', {
          shipping_address: shippingAddress,
          payment_ref: paymentIntent.id,
          discount_code: discountCode || null
        });
        
        await clearCart();
        navigate(`/orders/${res.data.id}/confirmation`);
      } catch (err) {
        setError('Payment succeeded, but order creation failed. Please contact support.');
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 'var(--spacing-6)' }}>
      <div className="form-group" style={{ padding: 'var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#111827', '::placeholder': { color: '#6b7280' } } } }} />
      </div>
      {error && <div className="form-error" style={{ marginBottom: 'var(--spacing-4)' }}>{error}</div>}
      <button disabled={processing || !stripe} className="btn" style={{ width: '100%' }}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { cart, cartTotal } = useContext(CartContext);
  const [shippingAddress, setShippingAddress] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountApplying, setDiscountApplying] = useState(false);
  
  const [clientSecret, setClientSecret] = useState('');
  const [intentId, setIntentId] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Address Step -> Payment Step
  const [step, setStep] = useState(1);

  if (!cart || !cart.items || cart.items.length === 0) {
    return <div>Your cart is empty. Cannot checkout.</div>;
  }

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    setDiscountApplying(true);
    setDiscountError('');
    try {
      const res = await apiClient.post('/discounts/validate/', { code: discountCode });
      // Assuming res.data gives { valid: true, discount: { type, value } } based on typical DRF validate logic
      // But we will just calculate it on the fly if the backend returns details
      if (res.data.is_active) {
         let value = 0;
         if (res.data.type === 'percentage') {
            value = cartTotal * (res.data.value / 100);
         } else {
            value = parseFloat(res.data.value);
         }
         setDiscountValue(Math.min(value, cartTotal));
      } else {
         setDiscountError('Invalid or expired discount code.');
         setDiscountValue(0);
      }
    } catch (e) {
      setDiscountError('Invalid or expired discount code.');
      setDiscountValue(0);
    } finally {
      setDiscountApplying(false);
    }
  };

  const finalTotal = Math.max(0, cartTotal - discountValue);

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setLoadingIntent(true);
    try {
      // Create payment intent
      const res = await apiClient.post('/checkout', {
        shipping_address: shippingAddress,
        discount_code: discountCode || null
      });
      // Expecting { clientSecret, paymentIntentId } from backend
      setClientSecret(res.data.clientSecret || res.data.client_secret);
      setIntentId(res.data.paymentIntentId || res.data.payment_intent_id);
      setStep(2);
    } catch (err) {
      alert("Failed to initialize checkout. Please check cart items and stock.");
    } finally {
      setLoadingIntent(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Checkout</h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap-reverse' }}>
        <div style={{ flex: '1 1 60%' }}>
          {step === 1 && (
            <div className="glass-panel" style={{ maxWidth: '100%', margin: 0, padding: 'var(--spacing-lg)' }}>
              <h2 style={{ textAlign: 'left', marginBottom: 'var(--spacing-md)' }}>1. Shipping Details</h2>
              <form onSubmit={handleProceedToPayment}>
                <div className="form-group">
                  <label>Full Shipping Address</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={shippingAddress} 
                    onChange={e => setShippingAddress(e.target.value)} 
                    required 
                    placeholder="123 Main St, Apt 4B&#10;New York, NY 10001"
                  />
                </div>
                <button type="submit" className="btn" style={{ width: '100%' }} disabled={loadingIntent}>
                  {loadingIntent ? 'Preparing Payment...' : 'Proceed to Payment'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && clientSecret && (
            <div className="glass-panel" style={{ maxWidth: '100%', margin: 0, padding: 'var(--spacing-lg)' }}>
               <h2 style={{ textAlign: 'left', marginBottom: 'var(--spacing-md)' }}>2. Payment</h2>
               <p style={{ color: 'var(--text-muted)' }}>Shipping to: {shippingAddress}</p>
               <Elements stripe={stripePromise} options={{ clientSecret }}>
                 <CheckoutForm 
                    clientSecret={clientSecret} 
                    intentId={intentId} 
                    shippingAddress={shippingAddress} 
                    discountCode={discountValue > 0 ? discountCode : null} 
                 />
               </Elements>
               <button 
                  onClick={() => setStep(1)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: 'var(--spacing-md)', textDecoration: 'underline' }}
               >
                 Back to Shipping
               </button>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 35%', minWidth: '250px' }}>
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Order Summary</h3>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
               {cart.items.map(item => {
                 const variant = item.variant_details;
                 const product = variant?.product_details;
                 const price = parseFloat(product?.base_price || 0) + parseFloat(variant?.price_modifier || 0);
                 return (
                   <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
                     <span>{item.quantity}x {product?.name}</span>
                     <span>${(price * item.quantity).toFixed(2)}</span>
                   </div>
                 );
               })}
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 'var(--spacing-md) 0' }} />
            
            {step === 1 && (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Discount Code" 
                  value={discountCode} 
                  onChange={e => setDiscountCode(e.target.value)} 
                />
                <button className="btn" onClick={handleApplyDiscount} disabled={discountApplying}>Apply</button>
              </div>
            )}
            {discountError && <div className="form-error" style={{ marginBottom: 'var(--spacing-md)' }}>{discountError}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)', color: 'var(--primary-color)' }}>
                <span>Discount</span>
                <span>-${discountValue.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', marginTop: 'var(--spacing-md)' }}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
