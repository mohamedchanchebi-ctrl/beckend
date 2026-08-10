import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

/* ── Static Data ── */

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Browse', desc: 'Explore our curated collection of premium stickers and prints.' },
  { step: '02', icon: '🎨', title: 'Pick Your Style', desc: 'Choose from holographic, matte, glossy, and die-cut finishes.' },
  { step: '03', icon: '💳', title: 'Checkout', desc: 'Secure payment powered by Stripe. Fast and easy.' },
  { step: '04', icon: '📦', title: 'Enjoy', desc: 'Same-day dispatch. Stick them everywhere.' },
];

const TRUST_ITEMS = [
  { icon: '🚚', label: 'Fast Shipping' },
  { icon: '🎨', label: 'Custom Designs' },
  { icon: '🔒', label: 'Secure Checkout' },
  { icon: '💎', label: 'Quality Materials' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', rating: 5, text: 'The holographic stickers are INSANE. The quality blew me away — they look even better in person. Already ordered more!', product: 'Holographic Skull' },
  { name: 'Alex R.', rating: 5, text: 'Super fast shipping and the die-cut precision is perfect. These stickers survived a whole winter on my laptop. Incredible.', product: 'Cyberpunk Cat' },
  { name: 'Jordan K.', rating: 5, text: 'Best sticker shop online, period. The vaporwave sunset design is my favorite thing I own. Will be back for every drop.', product: 'Vaporwave Sunset' },
];

const MARQUEE_ITEMS = [
  'CUSTOM STICKERS', 'DIE-CUT', 'HOLOGRAPHIC', 'WEATHERPROOF', 'VINYL',
  'CUSTOM STICKERS', 'DIE-CUT', 'HOLOGRAPHIC', 'WEATHERPROOF', 'VINYL',
];

const STATS = [
  { value: '50K+', label: 'Stickers Sold' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '120+', label: 'Unique Designs' },
  { value: '24h', label: 'Dispatch Time' },
];

/* ── Helpers ── */

const Stars = ({ count }) => (
  <span style={{ color: 'var(--star-color)', fontSize: '1.1rem', letterSpacing: '2px' }}>
    {'★'.repeat(count)}{'☆'.repeat(5 - count)}
  </span>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-lg)' }}>
    <div>
      <h2 style={{ margin: 0, fontSize: '2.2rem' }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0', fontSize: '1.05rem' }}>{subtitle}</p>}
    </div>
    {action && <Link to="/products" style={{ color: 'var(--accent-color)', fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{action}</Link>}
  </div>
);

/* ── Component ── */

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories/'),
          apiClient.get('/products/')
        ]);
        setCategories(catRes.data.results || catRes.data || []);
        setAllProducts(prodRes.data.results || prodRes.data || []);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredProducts = allProducts.slice(0, 4);
  const newArrivals = [...allProducts].reverse().slice(0, 4);
  const heroStickers = allProducts.filter(p => p.images && p.images.length > 0).slice(0, 4);

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };
  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

  // Floating configurations for up to 4 stickers
  const stickerConfigs = [
    { top: '10%', left: '15%', rotate: -12, width: '120px', delay: 0 },
    { top: '25%', right: '15%', rotate: 15, width: '150px', delay: 1 },
    { bottom: '15%', left: '20%', rotate: -8, width: '140px', delay: 2 },
    { bottom: '20%', right: '20%', rotate: 22, width: '110px', delay: 0.5 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const LoadingSpinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
      />
    </div>
  );

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative', textAlign: 'center', padding: '7rem 1rem',
          marginBottom: 'var(--spacing-xl)', backgroundColor: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
          perspective: '1000px',
          overflow: 'hidden'
        }}
      >
        {/* Floating 3D Background Layer */}
        <motion.div 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}
          animate={{ x: mousePos.x * -40, y: mousePos.y * -40 }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        >
          {heroStickers.map((prod, i) => {
            if (i >= stickerConfigs.length) return null;
            const config = stickerConfigs[i];
            return (
              <motion.img
                key={prod.id}
                src={prod.images[0]}
                alt=""
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: [0, -15, 0], 
                  rotate: config.rotate
                }}
                transition={{ 
                  opacity: { delay: 0.2 + config.delay * 0.2, duration: 0.5 },
                  scale: { delay: 0.2 + config.delay * 0.2, type: 'spring' },
                  y: { repeat: Infinity, duration: 3 + i, ease: 'easeInOut', delay: config.delay },
                  rotate: { duration: 0 } 
                }}
                style={{
                  position: 'absolute',
                  top: config.top,
                  left: config.left,
                  right: config.right,
                  bottom: config.bottom,
                  width: config.width,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))',
                  zIndex: 0
                }}
              />
            );
          })}
        </motion.div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-block', background: 'rgba(255,94,0,0.1)', borderRadius: '999px', padding: '0.4rem 1.2rem', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
            🔥 New Drops Every Friday
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            Stickers That <br /><span style={{ color: 'var(--primary-color)' }}>Hit Different.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Premium die-cut stickers and holographic foil prints. Built for creators, brands, and people who refuse to blend in.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>Shop Now</Link>
            <Link to="/products" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', border: '2px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', backgroundColor: 'transparent', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'border-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-color)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              ✨ Explore All
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ══════════════════════ MARQUEE ══════════════════════ */}
      <div style={{ overflow: 'hidden', marginBottom: 'var(--spacing-xl)', borderTop: '2px solid var(--text-color)', borderBottom: '2px solid var(--text-color)', padding: '1rem 0', background: 'var(--surface-color)' }}>
        <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          style={{ display: 'flex', gap: '4rem', whiteSpace: 'nowrap', width: 'max-content' }}>
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} style={{ fontSize: '1.2rem', fontWeight: 700, color: i % 2 === 0 ? 'var(--primary-color)' : 'var(--text-color)', textTransform: 'uppercase' }}>{item}</span>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════ TRUST STRIP ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', textAlign: 'center' }}>
          {TRUST_ITEMS.map((t) => (
            <div key={t.label} style={{ padding: 'var(--spacing-md) 0' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>{t.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ FEATURED PRODUCTS ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-md)' }}>
        <SectionHeader title="Featured Drops" subtitle="Hand-picked favorites from our collection" action="View all →" />
        {loading ? <LoadingSpinner /> : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {featuredProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '4rem var(--spacing-md)', backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.2rem' }}>How It Works</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xl)', fontSize: '1.05rem' }}>From browsing to unboxing in four simple steps.</p>
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)', maxWidth: '1000px', margin: '0 auto' }}>
          {HOW_IT_WORKS.map((s, i) => (
            <motion.div key={s.step} variants={itemVariants} style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>STEP {s.step}</div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{s.icon}</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={{ position: 'absolute', top: '4rem', right: '-1.5rem', fontSize: '1.5rem', color: 'var(--border-color)', display: 'none' }}>→</div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════ CATEGORY SHOWCASE ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-md)' }}>
        <SectionHeader title="Shop by Style" subtitle="Find your aesthetic" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {categories.map((cat, i) => (
            <motion.div key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}>
              <Link to={`/products?category=${cat.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="clean-card" style={{ padding: '2.5rem var(--spacing-lg)', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {cat.name.toLowerCase().includes('holo') ? '✨' : cat.name.toLowerCase().includes('cyber') ? '🤖' : cat.name.toLowerCase().includes('vapor') ? '🌅' : '🔥'}
                  </div>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--text-color)', display: 'block' }}>{cat.name}</strong>
                  <p style={{ fontSize: '1rem', color: 'var(--accent-color)', marginTop: '0.5rem', fontWeight: 600 }}>Explore →</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ NEW ARRIVALS ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-md)' }}>
        <SectionHeader title="New Arrivals" subtitle="The latest additions to our lineup" action="See more →" />
        {loading ? <LoadingSpinner /> : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {newArrivals.map((prod) => <ProductCard key={`new-${prod.id}`} prod={prod} />)}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-md)' }}>
        {STATS.map((s) => (
          <motion.div key={s.label} variants={itemVariants} className="clean-card" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-color)' }}>{s.value}</div>
            <div style={{ color: 'var(--text-color)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 600 }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
      <section style={{ marginBottom: 'var(--spacing-xl)', padding: '4rem var(--spacing-md)', backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.2rem' }}>What Our Customers Say</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xl)', fontSize: '1.05rem' }}>Don't just take our word for it.</p>
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)', maxWidth: '1000px', margin: '0 auto' }}>
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={itemVariants} className="clean-card" style={{ padding: 'var(--spacing-lg)' }}>
              <Stars count={t.rating} />
              <p style={{ fontSize: '1.05rem', color: 'var(--text-color)', lineHeight: 1.7, margin: '1rem 0', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--text-color)' }}>{t.name}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>on {t.product}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════ CTA BANNER ══════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ textAlign: 'center', padding: '5rem 2rem', marginBottom: '0', backgroundColor: 'var(--primary-color)', color: '#FFFFFF', borderRadius: '0' }}>
        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', color: '#FFFFFF' }}>Ready to stand out?</h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', fontSize: '1.2rem', fontWeight: 500 }}>
          Free shipping on orders over $25. Same-day dispatch on all orders.
        </p>
        <Link to="/products" className="btn" style={{ fontSize: '1.2rem', padding: '1rem 3rem', backgroundColor: '#FFFFFF', color: 'var(--primary-color)' }}>
          Shop Collection
        </Link>
      </motion.section>

    </div>
  );
}
