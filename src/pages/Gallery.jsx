import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import TopBar from '../components/TopBar.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { DEFAULT_GALLERY_ITEMS, GALLERY_CATEGORIES } from '../lib/galleryItems.js';
import { listPublicGalleryItems } from '../ams/data/api.js';

function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index];

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length);
    },
    [index, items.length, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!item) return null;

  return (
    <div className="ois-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button
        className="ois-lightbox-nav left-4"
        aria-label="Previous image"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate((index - 1 + items.length) % items.length);
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={item.image} alt={item.alt} className="ois-lightbox-image" />
        <div className="text-center mt-4 px-4">
          <p className="text-white text-lg font-semibold">{item.lightboxTitle || item.title}</p>
          <p className="text-gray-400 text-sm mt-1">
            School Life {index + 1} of {items.length}
          </p>
        </div>
      </div>
      <button
        className="ois-lightbox-nav right-4"
        aria-label="Next image"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate((index + 1) % items.length);
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Gallery() {
  const gridRef = useRef(null);
  const [items, setItems] = useState(DEFAULT_GALLERY_ITEMS);
  const [filter, setFilter] = useState('*');
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listPublicGalleryItems()
      .then((managed) => {
        if (!cancelled && Array.isArray(managed) && managed.length > 0) {
          const existingIds = new Set(DEFAULT_GALLERY_ITEMS.map((item) => item.id));
          const extras = managed.filter((item) => !existingIds.has(item.id));
          setItems([...DEFAULT_GALLERY_ITEMS, ...extras]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Entrance animation once items render
  useEffect(() => {
    if (loading) return;
    const elements = gridRef.current?.querySelectorAll('.grid-item');
    if (elements?.length) {
      gsap.fromTo(
        elements,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: 'power4.out' }
      );
    }
  }, [loading]);

  const visibleItems = items.filter((item) => filter === '*' || item.category === filter);

  const applyFilter = (value) => {
    if (value === filter) return;
    const elements = gridRef.current?.querySelectorAll('.grid-item');
    if (!elements?.length) {
      setFilter(value);
      return;
    }
    gsap.to(elements, {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        setFilter(value);
        requestAnimationFrame(() => {
          const next = gridRef.current?.querySelectorAll('.grid-item');
          if (next?.length) {
            gsap.fromTo(
              next,
              { scale: 0.8, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }
            );
          }
        });
      },
    });
  };

  return (
    <div>
      <TopBar />
      <Header active="gallery" sticky />

      {/* Hero Section */}
      <header className="relative py-24 bg-white overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 100 L100 0 Z" fill="#2c64ac" />
          </svg>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-sm font-bold text-ois-light-blue uppercase tracking-widest mb-6">Capturing Moments</h1>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-ois-blue to-ois-green bg-clip-text text-transparent">
            The Official School Gallery
          </h2>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed font-medium">
            Step into the vibrant world of OrchardsWood. From academic milestones to sports excellence, here is our
            journey in frames.
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="py-12 bg-white sticky top-[80px] z-40 border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {GALLERY_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => applyFilter(category.value)}
                className={`filter-btn px-8 py-3 rounded-full text-sm font-bold tracking-wide uppercase glass-card${
                  filter === category.value ? ' active' : ''
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-6">
          <div ref={gridRef} className="flex flex-wrap justify-between">
            {visibleItems.map((item) => (
              <div key={item.id} className={`grid-item ${item.category}`}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setLightboxIndex(visibleItems.indexOf(item))}
                  aria-label={item.lightboxTitle || item.title}
                >
                  <div className="relative group overflow-hidden rounded-3xl glass-card">
                    {item.webp ? (
                      <picture>
                        <source srcSet={item.webp} type="image/webp" />
                        <img src={item.image} alt={item.alt} className="w-full transition-all duration-700" loading="lazy" />
                      </picture>
                    ) : (
                      <img src={item.image} alt={item.alt} className="w-full transition-all duration-700" loading="lazy" />
                    )}
                    <div className="item-overlay absolute inset-0 flex flex-col justify-end p-8 text-white">
                      <span className="text-ois-green font-bold text-xs uppercase tracking-widest mb-2 capitalize">
                        {item.category}
                      </span>
                      <h3 className="text-2xl font-bold font-righteous">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.showPlus && (
                      <div className="absolute top-6 right-6 w-12 h-12 rounded-full glass-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-5 h-5 text-ois-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ois-blue"></div>
            </div>
          )}
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          items={visibleItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      <Footer />
    </div>
  );
}
