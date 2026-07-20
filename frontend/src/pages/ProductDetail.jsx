import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { addItem } = useContext(CartContext);
  const [addingToCart, setAddingToCart] = useState(false);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          apiClient.get(`/products/${id}/`),
          apiClient.get(`/products/${id}/reviews/`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data.results || revRes.data || []);
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  // Extract unique options from variants
  const variants = product.variants || [];
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const materials = [...new Set(variants.map(v => v.material).filter(Boolean))];
  const finishes = [...new Set(variants.map(v => v.finish).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];

  // Find currently selected variant based on selections
  const selectedVariant = variants.find(v => 
    (!selectedSize || v.size === selectedSize) &&
    (!selectedMaterial || v.material === selectedMaterial) &&
    (!selectedFinish || v.finish === selectedFinish) &&
    (!selectedColor || v.color === selectedColor)
  );

  const finalPrice = selectedVariant 
    ? parseFloat(product.base_price) + parseFloat(selectedVariant.price_modifier || 0)
    : product.base_price;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Please log in to add items to cart.");
      navigate('/login');
      return;
    }
    if (!selectedVariant) {
      alert("Please select all options first.");
      return;
    }
    
    setAddingToCart(true);
    try {
      await addItem(selectedVariant.id, 1);
      alert("Item added to cart!");
    } catch (e) {
      alert("Failed to add to cart. It may be out of stock.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      alert("Please log in to add to wishlist.");
      navigate('/login');
      return;
    }
    try {
      await apiClient.post('/wishlist/', { product_id: product.id });
      alert('Added to wishlist!');
    } catch (e) {
      console.error(e);
      alert('Failed to add to wishlist.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      {/* Product Top Section */}
      <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        
        {/* Images */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>No Image Available</span>
              )}
          </div>
        </div>

        {/* Info & Cart Form */}
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ marginBottom: 'var(--spacing-2)' }}>{product.name}</h1>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--spacing-4)' }}>
            ${parseFloat(finalPrice).toFixed(2)}
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>{product.description}</p>

          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--spacing-4)' }}>
            
            {sizes.length > 0 && (
              <div className="form-group">
                <label>Size</label>
                <select className="form-control" value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
                  <option value="">Select Size</option>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            
            {materials.length > 0 && (
              <div className="form-group">
                <label>Material</label>
                <select className="form-control" value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)}>
                  <option value="">Select Material</option>
                  {materials.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {finishes.length > 0 && (
              <div className="form-group">
                <label>Finish</label>
                <select className="form-control" value={selectedFinish} onChange={e => setSelectedFinish(e.target.value)}>
                  <option value="">Select Finish</option>
                  {finishes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}

            {colors.length > 0 && (
              <div className="form-group">
                <label>Color</label>
                <select className="form-control" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
                  <option value="">Select Color</option>
                  {colors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <button className="btn" style={{ width: '100%', marginBottom: 'var(--spacing-2)' }} onClick={handleAddToCart} disabled={addingToCart}>
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="btn" style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }} onClick={handleAddToWishlist}>
              Add to Wishlist
            </button>

            {selectedVariant && (
              <div style={{ marginTop: 'var(--spacing-2)', fontSize: '0.875rem', color: selectedVariant.stock_qty > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {selectedVariant.stock_qty > 0 ? `In Stock (${selectedVariant.stock_qty})` : 'Out of Stock'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ backgroundColor: 'var(--color-bg-card)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {reviews.map(rev => (
              <div key={rev.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                  <strong>User {rev.user_id}</strong>
                  <span style={{ color: '#fbbf24' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                </div>
                <p>{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
