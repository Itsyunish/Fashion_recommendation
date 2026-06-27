import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';
import DetailModal from '../components/DetailModal';

export default function BrowsePage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detailRec, setDetailRec] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchProducts = useCallback(async (s, cat, p) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: s || '',
        category: cat || '',
        page: String(p),
        limit: String(limit),
      });
      const res = await fetch(`${API_BASE_URL}/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      if (data.categories) setCategories(data.categories);
    } catch {}
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchProducts('', '', 1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputValue);
    setCategory('');
    setPage(1);
    fetchProducts(inputValue, '', 1);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    setSearch('');
    setInputValue('');
    setPage(1);
    fetchProducts('', cat, 1);
    setShowSuggestions(false);
  };

  const handleInputChange = (val) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/suggestions?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {}
    }, 250);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.text);
    setSearch(suggestion.text);
    setCategory('');
    setPage(1);
    fetchProducts(suggestion.text, '', 1);
    setShowSuggestions(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="container">
          <h1>Browse Catalog</h1>
          <p className="browse-sub">{total.toLocaleString()} products</p>

          <form className="browse-search-form" onSubmit={handleSearch}>
            <div className="browse-search-wrap" ref={searchRef}>
              <svg className="browse-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="browse-search-input"
                placeholder="Search shirts, pants, shoes, brands..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button type="submit" className="browse-search-btn">Search</button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="browse-suggestions">
                {suggestions.map((s, i) => (
                  <div
                    key={s.id + i}
                    className="browse-suggestion-item"
                    onMouseDown={() => handleSuggestionClick(s)}
                  >
                    <span className="browse-suggestion-text">{s.text}</span>
                    <span className="browse-suggestion-type">{s.type}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="browse-categories">
            <button
              className={`browse-cat-chip ${category === '' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('')}
            >All</button>
            {categories.slice(0, 15).map((cat) => {
              const catImg = {
                Topwear: '/images/cat-topwear.svg',
                Bottomwear: '/images/cat-bottomwear.svg',
                Shoes: '/images/cat-footwear.svg',
                Footwear: '/images/cat-footwear.svg',
                Accessories: '/images/cat-accessories.svg',
                Dress: '/images/cat-dress.svg',
              }[cat] || null;
              return (
                <button
                  key={cat}
                  className={`browse-cat-chip ${category === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {catImg && <img src={catImg} alt="" className="browse-cat-icon" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container">
        {loading && (
          <div className="browse-loading">
            <div className="spinner lg"></div>
            <p>Searching products...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="browse-empty">
            <img src="/images/empty-state.svg" alt="" className="browse-empty-img" />
            <p>No products found. Try a different search.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <div className="browse-grid">
              {products.map((p) => (
                <div key={p.id} className="browse-card" onClick={() => setDetailRec(p)}>
                  <div className="browse-card-img">
                    <img src={API_BASE_URL + p.image_path} alt="" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="browse-card-body">
                    <div className="browse-card-title">{p.product_display_name || p.id}</div>
                    <div className="browse-card-meta">
                      {p.base_colour && <span>{p.base_colour}</span>}
                      {p.gender && <span>{p.gender}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="browse-pagination">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchProducts(search, category, page - 1); }}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchProducts(search, category, page + 1); }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {detailRec && (
        <DetailModal
          rec={{
            image_path: detailRec.image_path,
            product_display_name: detailRec.product_display_name,
            gender: detailRec.gender,
            master_category: detailRec.master_category,
            sub_category: detailRec.sub_category,
            article_type: detailRec.article_type,
            base_colour: detailRec.base_colour,
            usage: detailRec.usage,
            rating: detailRec.rating,
          }}
          onClose={() => setDetailRec(null)}
        />
      )}
    </div>
  );
}
