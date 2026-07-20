import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

const FEATURES = [
  { icon: '✦', title: 'Die-Cut Precision', desc: 'Cut to the exact shape of your design — every edge perfect.' },
  { icon: '◈', title: 'Holographic Foil', desc: 'Rainbow glare shifts with every angle, impossible to ignore.' },
  { icon: '⬡', title: 'Weatherproof Vinyl', desc: 'UV-resistant ink on premium vinyl. Outdoor & waterproof.' },
  { icon: '⟐', title: 'Fast Dispatch', desc: 'Same-day processing on orders placed before 2PM.' },
];

const MARQUEE_ITEMS = [
  'DIE-CUT', 'HOLOGRAPHIC', 'VAPORWAVE', 'CYBERPUNK', 'VINYL', 'WEATHERPROOF',
  'DIE-CUT', 'HOLOGRAPHIC', 'VAPORWAVE', 'CYBERPUNK', 'VINYL', 'WEATHERPROOF',
];

const STATS = [
  { value: '50K+', label: 'Stickers Sold' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '120+', label: 'Unique Designs' },
  { value: '24h', label: 'Dispatch Time' },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories/'),
          apiClient.get('/products/')
        ]);
        setCategories(catRes.data.results || catRes.data || []);
        setFeaturedProducts((prodRes.data.results || prodRes.data || []).slice(0, 4));
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ── HERO ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: '6rem 1rem',
          marginBottom: 'var(--spacing-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Animated background blobs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
            filter: 'blur(60px)', zIndex: 0,
          }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
            filter: 'blur(60px)', zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-block',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '999px',
              padding: '0.35rem 1.2rem',
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#c4b5fd',
              marginBottom: '1.5rem',
            }}
          >
            ✦ New Drops Every Friday
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.1, marginBottom: '1.5rem' }}
          >
            Stickers That<br />
            <span style={{ background: 'var(--gradient-neon)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hit Different
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}
          >
            Holographic foil, die-cut precision, weatherproof vinyl. Stickers built for people who refuse to blend in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/products" className="btn" style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}>
              Shop Now →
            </Link>
            <Link
              to="/products?category=holographic"
              style={{
                fontSize: '1.05rem',
                padding: '0.9rem 2rem',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-color)',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              ◈ Holographic Collection
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow: 'hidden', marginBottom: 'var(--spacing-xl)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.8rem 0', background: 'rgba(255,255,255,0.02)' }}>
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          style={{ display: 'flex', gap: '3rem', whiteSpace: 'nowrap', width: 'max-content' }}
        >
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} style={{ fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 700, color: i % 2 === 0 ? '#a78bfa' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── STATS ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={itemVariants} className="glass-panel" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', background: 'var(--gradient-neon)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', letterSpacing: '0.05em' }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ margin: 0 }}>Featured Drops</h2>
          <Link to="/products" style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600 }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}
          >
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} prod={prod} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>Shop by Style</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.03 }}
            >
              <Link to={`/products?category=${cat.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {cat.name.toLowerCase().includes('holo') ? '◈' : '✦'}
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{cat.name}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
                    Explore collection →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Why StickerShop?</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)' }}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={itemVariants} className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#a78bfa' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA BANNER ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel"
        style={{ textAlign: 'center', padding: '4rem 2rem', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          style={{
            position: 'absolute', top: '-60%', right: '-10%',
            width: '400px', height: '400px',
            background: 'conic-gradient(from 0deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2), rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            filter: 'blur(40px)', zIndex: 0, borderRadius: '50%',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: '1rem' }}>
            Ready to <span style={{ background: 'var(--gradient-neon)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>stand out?</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Browse all 5 designs — free shipping on orders over $25.
          </p>
          <Link to="/products" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Browse All Stickers
          </Link>
        </div>
      </motion.section>

    </div>
  );
}
