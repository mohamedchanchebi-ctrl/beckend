import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import usePageTitle from '../hooks/usePageTitle';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { addItem } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  usePageTitle(product?.name || 'Product Details');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, revRes] = await Promise.all([
          apiClient.get(`/products/${id}/`),
          apiClient.get(`/products/${id}/reviews/`)
        ]);
        const prodData = prodRes.data;
        setProduct(prodData);
        setReviews(revRes.data.results || revRes.data || []);
        
        // Track recently viewed in localStorage
        const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const newRecent = [prodData.id, ...recent.filter(item => item !== prodData.id)].slice(0, 5);
        localStorage.setItem('recentlyViewed', JSON.stringify(newRecent));
        
        // Fetch related products (same category)
        if (prodData.category) {
          const relatedRes = await apiClient.get(`/products/?category=${prodData.category}`);
          const related = (relatedRes.data.results || relatedRes.data || [])
            .filter(p => p.id !== prodData.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }

        // Fetch recently viewed products data
        if (recent.length > 0) {
          const recentIds = recent.filter(recentId => recentId !== prodData.id).slice(0, 4);
          const recentPromises = recentIds.map(rid => apiClient.get(`/products/${rid}/`).catch(() => null));
          const recentData = await Promise.all(recentPromises);
          setRecentlyViewed(recentData.map(res => res?.data).filter(Boolean));
        }

      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Reset state when id changes
    setSelectedSize('');
    setSelectedMaterial('');
    setSelectedFinish('');
    setSelectedColor('');
    setQuantity(1);
    
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  if (!product) return <div style={{ padding: '4rem', textAlign: 'center' }}>Product not found.</div>;

  const variants = product.variants || [];
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const materials = [...new Set(variants.map(v => v.material).filter(Boolean))];
  const finishes = [...new Set(variants.map(v => v.finish).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];

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
      await addItem(selectedVariant.id, quantity);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      
      {/* Breadcrumbs */}
      <nav style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
        {' > '}
        <Link to={`/products?category=${product.category}`} style={{ color: 'var(--text-muted)' }}>
          {product.category_name || 'Category'}
        </Link>
        {' > '}
        <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Product Top Section */}
      <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
        
        {/* Image */}
        <div style={{ flex: '1 1 400px' }}>
          <div className="clean-card" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--placeholder-bg)' }}>
             {product.images && product.images.length > 0 ? (
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src={product.images[0]} 
                  alt={product.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }} 
                />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No Image Available</span>
              )}
          </div>
        </div>

        {/* Info & Cart Form */}
        <div style={{ flex: '1 1 400px' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>{product.name}</h1>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            ${parseFloat(finalPrice).toFixed(2)}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.7 }}>{product.description}</p>

          <div className="clean-card" style={{ padding: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {sizes.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Size</label>
                  <select className="form-control" value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
                    <option value="">Select Size</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {materials.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Material</label>
                  <select className="form-control" value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)}>
                    <option value="">Select Material</option>
                    {materials.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
              {finishes.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Finish</label>
                  <select className="form-control" value={selectedFinish} onChange={e => setSelectedFinish(e.target.value)}>
                    <option value="">Select Finish</option>
                    {finishes.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              {colors.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Color</label>
                  <select className="form-control" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
                    <option value="">Select Color</option>
                    {colors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Quantity Stepper */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Quantity</label>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '2px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.5rem 1rem', background: 'var(--placeholder-bg)', border: 'none', borderRight: '2px solid var(--border-color)', fontSize: '1.2rem', fontWeight: 600 }}>-</button>
                <div style={{ padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: '1.1rem' }}>{quantity}</div>
                <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '0.5rem 1rem', background: 'var(--placeholder-bg)', border: 'none', borderLeft: '2px solid var(--border-color)', fontSize: '1.2rem', fontWeight: 600 }}>+</button>
              </div>
            </div>

            <button className="btn" style={{ width: '100%', marginBottom: '1rem', padding: '1rem' }} onClick={handleAddToCart} disabled={addingToCart || (selectedVariant && selectedVariant.stock_qty <= 0)}>
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="btn" style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--text-color)', border: '2px solid var(--border-color)', padding: '1rem' }} onClick={handleAddToWishlist}>
              ♡ Add to Wishlist
            </button>

            {selectedVariant && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontWeight: 600, color: selectedVariant.stock_qty > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                {selectedVariant.stock_qty > 0 ? `In Stock (${selectedVariant.stock_qty})` : 'Out of Stock'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ borderTop: '2px solid var(--border-color)', paddingTop: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>You might also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
            {relatedProducts.map(prod => <ProductCard key={prod.id} prod={prod} />)}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section style={{ borderTop: '2px solid var(--border-color)', paddingTop: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Recently Viewed</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
            {recentlyViewed.map(prod => <ProductCard key={prod.id} prod={prod} />)}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section style={{ borderTop: '2px solid var(--border-color)', paddingTop: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Customer Reviews</h2>
        {reviews.length === 0 ? (
          <div className="clean-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reviews yet for this product. Be the first to review after purchasing!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {reviews.map(rev => (
              <div key={rev.id} className="clean-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.1rem' }}>User {rev.user_id}</strong>
                  <span style={{ color: 'var(--star-color)', fontSize: '1.2rem', letterSpacing: '2px' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
