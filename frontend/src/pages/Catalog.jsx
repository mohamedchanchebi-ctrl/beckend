import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';
import usePageTitle from '../hooks/usePageTitle';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Catalog');

  // Form states matching URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories/');
        setCategories(res.data.results || res.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(searchParams.entries());
        const res = await apiClient.get('/products/', { params });
        setProducts(res.data.results || res.data || []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort) params.sort = sort;
    
    setSearchParams(params);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
      {/* Sidebar Filters */}
      <aside style={{ width: '300px', flexShrink: 0 }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel" 
          style={{ position: 'sticky', top: '80px', padding: 'var(--spacing-lg)' }}
        >
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Filters</h2>
          <form onSubmit={handleApplyFilters}>
            <div className="form-group">
              <label>Search</label>
              <input 
                type="text" 
                className="form-control" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Keywords..."
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug || c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Min Price</label>
              <input 
                type="number" 
                className="form-control" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Max Price</label>
              <input 
                type="number" 
                className="form-control" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Sort By</label>
              <select className="form-control" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="">Relevance</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-created_at">Newest Arrivals</option>
              </select>
            </div>
            <button type="submit" className="btn" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>Apply Filters</button>
          </form>
        </motion.div>
      </aside>

      {/* Product Grid */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        <nav style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          {' > '}
          <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Catalog</span>
        </nav>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Catalog</h1>
        {loading ? (
          <div>Loading products...</div>
        ) : products.length === 0 ? (
          <div>No products found matching your filters.</div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}
          >
            {products.map(prod => (
              <ProductCard key={prod.id} prod={prod} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
