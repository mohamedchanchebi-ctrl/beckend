import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiClient from '../api/client';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import usePageTitle from '../hooks/usePageTitle';

// Initialize Stripe (use a fake test key if not provided by env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

function CheckoutForm({ clientSecret, intentId, shippingAddress, discountCode }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const { isDark } = useContext(ThemeContext);
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
          payment_intent_id: intentId
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
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
      <div className="form-group" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)' }}>
        <CardElement options={{ style: { base: { fontSize: '16px', color: isDark ? '#F3F4F6' : '#111827', '::placeholder': { color: '#6b7280' } } } }} />
      </div>
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <button disabled={processing || !stripe} className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
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
  const [copied, setCopied] = useState(false);
  
  const [clientSecret, setClientSecret] = useState('');
  const [intentId, setIntentId] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Address Step -> Payment Step
  const [step, setStep] = useState(1);

  usePageTitle('Checkout');

  if (!cart || !cart.items || cart.items.length === 0) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Your cart is empty. Cannot checkout.</div>;
  }

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    setDiscountApplying(true);
    setDiscountError('');
    try {
      const res = await apiClient.post('/discounts/validate/', { code: discountCode });
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

  const copyCode = () => {
    if (discountCode) {
      navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Checkout</h1>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap-reverse' }}>
        <div style={{ flex: '1 1 60%' }}>
          {step === 1 && (
            <div className="clean-card" style={{ padding: '2.5rem' }}>
              <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '1.5rem' }}>1. Shipping Details</h2>
              <form onSubmit={handleProceedToPayment}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Full Shipping Address</label>
                  <textarea 
                    className="form-control" 
                    rows="5" 
                    value={shippingAddress} 
                    onChange={e => setShippingAddress(e.target.value)} 
                    required 
                    placeholder="123 Main St, Apt 4B&#10;New York, NY 10001"
                    style={{ fontSize: '1rem', padding: '1rem' }}
                  />
                </div>
                <button type="submit" className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loadingIntent}>
                  {loadingIntent ? 'Preparing Payment...' : 'Proceed to Payment'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && clientSecret && (
            <div className="clean-card" style={{ padding: '2.5rem' }}>
               <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '1.5rem' }}>2. Payment</h2>
               <div style={{ padding: '1rem', backgroundColor: 'var(--placeholder-bg)', borderRadius: '8px', marginBottom: '2rem' }}>
                 <p style={{ color: 'var(--text-muted)', margin: 0 }}><strong>Shipping to:</strong><br/>{shippingAddress}</p>
               </div>
               <Elements stripe={stripePromise} options={{ clientSecret }}>
                 <CheckoutForm 
                    clientSecret={clientSecret} 
                    intentId={intentId} 
                    shippingAddress={shippingAddress} 
                    discountCode={discountValue > 0 ? discountCode : null} 
                 />
               </Elements>
               <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                 <button 
                    onClick={() => setStep(1)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '1rem' }}
                 >
                   ← Back to Shipping
                 </button>
               </div>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 35%', minWidth: '320px' }}>
          <div className="clean-card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Order Summary</h3>
            <div style={{ marginBottom: '1.5rem' }}>
               {cart.items.map(item => {
                 const variant = item.variant_details;
                 const product = variant?.product_details;
                 const price = parseFloat(product?.base_price || 0) + parseFloat(variant?.price_modifier || 0);
                 return (
                   <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '0.75rem' }}>
                     <span>{item.quantity}x {product?.name}</span>
                     <span style={{ fontWeight: 600 }}>${(price * item.quantity).toFixed(2)}</span>
                   </div>
                 );
               })}
            </div>
            
            <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />
            
            {step === 1 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Discount Code" 
                    value={discountCode} 
                    onChange={e => setDiscountCode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {discountCode && (
                    <button 
                      onClick={copyCode}
                      title="Copy to clipboard"
                      style={{ padding: '0 0.75rem', background: 'var(--placeholder-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {copied ? <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600 }}>Copied!</span> : '📋'}
                    </button>
                  )}
                  <button className="btn" onClick={handleApplyDiscount} disabled={discountApplying || !discountCode} style={{ padding: '0.5rem 1rem' }}>Apply</button>
                </div>
                {discountError && <div className="form-error" style={{ fontSize: '0.875rem' }}>{discountError}</div>}
              </div>
            )}

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
