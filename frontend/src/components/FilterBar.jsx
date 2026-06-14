import { useState, useMemo, useEffect, useCallback } from 'react';

export default function FilterBar({ recommendations, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    brands: new Set(), colours: new Set(), categories: new Set(), genders: new Set(),
    minPrice: null, maxPrice: null,
  });

  useEffect(() => {
    if (onFilterChange) onFilterChange(activeFilters);
  }, [activeFilters, onFilterChange]);

  const filterData = useMemo(() => {
    const brands = new Set();
    const colours = new Set();
    const cats = new Set();
    const genders = new Set();
    recommendations.forEach(r => {
      if (r.brand_name) brands.add(r.brand_name);
      if (r.base_colour) colours.add(r.base_colour);
      if (r.master_category) cats.add(r.master_category);
      if (r.gender) genders.add(r.gender);
    });
    return {
      brands: [...brands].sort(),
      colours: [...colours].sort(),
      categories: [...cats].sort(),
      genders: [...genders].sort(),
    };
  }, [recommendations]);

  const toggleFilter = (key, value) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      next[key] = set;
      return next;
    });
  };

  const handlePriceChange = (field, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: value === '' ? null : parseFloat(value),
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      brands: new Set(), colours: new Set(), categories: new Set(), genders: new Set(),
      minPrice: null, maxPrice: null,
    });
  };

  const activeCount = useMemo(() => {
    let count = 0;
    count += activeFilters.brands.size;
    count += activeFilters.colours.size;
    count += activeFilters.categories.size;
    count += activeFilters.genders.size;
    if (activeFilters.minPrice !== null) count++;
    if (activeFilters.maxPrice !== null) count++;
    return count;
  }, [activeFilters]);

  return (
    <div className="filter-bar">
      <button className="filter-toggle" onClick={() => setOpen(!open)} type="button">
        ▼ Filters{' '}
        <span id="filterCount" style={{ fontWeight: 400, color: '#6c757d' }}>
          {activeCount > 0 ? `(${activeCount} active)` : ''}
        </span>
        {activeCount > 0 && (
          <span
            className="filter-clear"
            onClick={(e) => { e.stopPropagation(); clearFilters(); }}
            style={{ display: 'inline' }}
          >
            Clear
          </span>
        )}
      </button>
      <div className={`filter-body ${open ? 'open' : ''}`}>
        {Object.entries({
          brand: { label: 'Brand', items: filterData.brands },
          colour: { label: 'Colour', items: filterData.colours },
          category: { label: 'Category', items: filterData.categories },
          gender: { label: 'Gender', items: filterData.genders },
        }).map(([key, { label, items }]) => (
          items.length > 0 ? (
            <div className="filter-group" key={key}>
              <div className="filter-group-label">{label}</div>
              <div className="filter-chips">
                {items.map(v => (
                  <span
                    key={v}
                    className={`filter-chip ${activeFilters[key + 's']?.has(v) ? 'active' : ''}`}
                    onClick={() => toggleFilter(key + 's', v)}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        ))}
        <div className="filter-group">
          <div className="filter-group-label">Price Range</div>
          <div className="filter-price-row">
            <span>₹</span>
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={activeFilters.minPrice ?? ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
            <span>—</span>
            <span>₹</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={activeFilters.maxPrice ?? ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
