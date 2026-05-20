import React, { useState, useEffect } from 'react';
import { itemService } from '../services/itemService';

const SearchSection = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await itemService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const searchParams = {
      search: searchTerm,
      category: category === 'all' ? '' : category,
      location: location,
      sortBy: sortBy
    };
    onSearch(searchParams);
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategory('all');
    setLocation('');
    setSortBy('newest');
    onSearch({
      search: '',
      category: '',
      location: '',
      sortBy: 'newest'
    });
  };

  return (
    <div className="search-section mb-4">
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-1" style={{ color: 'white' }}>Зар хайх</h2>
        <p style={{ color: 'white', fontSize: '1rem' }}>Хүссэн зүйлээ хурдан олоорой</p>
      </div>
      <div className="row g-3">
        <div className="col-xl-10 mx-auto">
          <div className="card border-0" style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.06)', borderRadius: '15px', overflow: 'hidden' }}>
            <div className="card-header border-0" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem 1.5rem'
            }}>
              <h5 className="mb-0 text-center">
                <i className="fas fa-search me-2"></i>Хайлт
              </h5>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Search Term */}
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="searchTerm"
                        placeholder="Барааны нэр, тайлбар..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                      />
                      <label htmlFor="searchTerm">
                        <i className="fas fa-search me-2"></i>Хайх үг
                      </label>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        placeholder="Улаанбаатар, Дархан..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={loading}
                      />
                      <label htmlFor="location">
                        <i className="fas fa-map-marker-alt me-2"></i>Байршил
                      </label>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loading}
                      >
                        <option value="all">Бүх ангилал</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="category">
                        <i className="fas fa-tags me-2"></i>Ангилал
                      </label>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        disabled={loading}
                      >
                        <option value="newest">Шинэ эхэндээ</option>
                        <option value="oldest">Хуучин эхэндээ</option>
                        <option value="name_asc">Нэрээр (А-Я)</option>
                        <option value="name_desc">Нэрээр (Я-А)</option>
                      </select>
                      <label htmlFor="sortBy">
                        <i className="fas fa-sort me-2"></i>Эрэмбэлэх
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row mt-4">
                  <div className="col-md-8 mx-auto">
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          borderRadius: '25px'
                        }}
                      >
                        {loading ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-2"></i>Хайж байна...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-search me-2"></i>Хайх
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4"
                        onClick={handleReset}
                        disabled={loading}
                        style={{ borderRadius: '25px' }}
                      >
                        <i className="fas fa-undo me-2"></i>Цэвэрлэх
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Category Filters */}
      <div className="row mt-4">
        <div className="col-lg-10 mx-auto">
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <span className="me-3" style={{ color: 'white' }}>Түгээмэл ангилал:</span>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`btn btn-sm ${category === cat.value ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => {
                  setCategory(cat.value);
                  onSearch({
                    search: searchTerm,
                    category: cat.value,
                    location: location,
                    sortBy: sortBy
                  });
                }}
                disabled={loading}
                style={{ borderRadius: '15px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;