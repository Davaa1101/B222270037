import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import ItemCard from './ItemCard';
import SearchSection from './SearchSection';
import Alert from './Alert';

const Home = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [alert, setAlert] = useState(null);

  const loadItems = async (page = 1, sort = 'newest') => {
    try {
      setLoading(true);
      const data = await itemService.getAllItems({
        page,
        sort,
        limit: 16
      });
      setItems(data.items || []);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load items:', error);
      showAlert('Зар ачаалахад алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams) => {
    try {
      setLoading(true);
      const data = await itemService.searchItems(searchParams);
      setItems(data.items || []);
      setPagination(data.pagination);
      
      if (data.items && data.items.length > 0) {
        showAlert(`${data.items.length} зар олдлоо`, 'success');
      } else {
        showAlert('Хайлтын үр дүн олдсонгүй', 'info');
      }
    } catch (error) {
      console.error('Search error:', error);
      showAlert('Хайлт хийхэд алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    loadItems(1, newSort);
  };

  const handlePageChange = (page) => {
    loadItems(page, sortBy);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    // Previous button
    if (pagination.hasPrev) {
      pages.push(
        <li key="prev" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Өмнөх
          </button>
        </li>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === pagination.currentPage ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    // Next button
    if (pagination.hasNext) {
      pages.push(
        <li key="next" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Дараах
          </button>
        </li>
      );
    }

    return (
      <nav className="mt-4 d-flex justify-content-center">
        <ul className="pagination justify-content-center">
          {pages}
        </ul>
      </nav>
    );
  };

  return (
    <div className="container-fluid px-4 mt-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      {/* Hero Section */}
      <div className="hero-section mb-4 text-center" style={{ padding: '3rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '15px' }}>
        <div className="container">
          <h1 className="display-4 mb-3 text-white fw-bold">Онлайн Солилцооны Платформ</h1>
          <p className="lead mb-3 text-white opacity-90" style={{ fontSize: '1.1rem' }}>Өөрт хэрэггүй зүйлсээ хэрэгтэй зүйлсээр солилцоорой</p>
          {!user && (
            <div className="d-flex justify-content-center gap-3">
              <a href="/signup" className="btn btn-light btn-lg px-4 py-2" style={{ borderRadius: '25px', fontWeight: '600' }}>
                <i className="fas fa-user-plus me-2"></i>Бүртгүүлэх
              </a>
              <a href="/login" className="btn btn-outline-light btn-lg px-4 py-2" style={{ borderRadius: '25px', fontWeight: '600' }}>
                <i className="fas fa-sign-in-alt me-2"></i>Нэвтрэх
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div id="search-section">
        <SearchSection onSearch={handleSearch} onClear={() => loadItems()} />
      </div>

      {/* Items Section */}
      <div className="mb-5">
        <div className="row align-items-center mb-4">
          <div className="col-md-8">
            <h2 className="mb-2 fw-bold" style={{ color: '#2c3e50' }}>Бүх зарууд</h2>
            <p className="text-muted mb-0">Та хүссэн зүйлээ энд олж болно</p>
          </div>
          <div className="col-md-4 text-md-end">
            <div className="d-flex align-items-center gap-2 justify-content-md-end">
              <label className="form-label mb-0 text-muted">Эрэмблэх:</label>
              <select 
                className="form-select" 
                style={{ maxWidth: '200px', borderRadius: '10px' }}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="newest">Шинэ эхэндээ</option>
                <option value="oldest">Хуучин эхэндээ</option>
                <option value="views">Их үзсэн</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Ачааллаж байна...</span>
            </div>
            <h5 className="mt-4 text-muted">Зарууд ачааллаж байна...</h5>
            <p className="text-muted">Түр хүлээнэ үү</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <i className="fas fa-box-open text-muted mb-4" style={{ fontSize: '5rem', opacity: '0.5' }}></i>
            <h4 className="text-muted mb-3">Зар олдсонгүй</h4>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>Удахгүй шинэ зарууд нэмэгдэнэ эсвэл хайлтаа өөрчилнө үү</p>
            <button 
              className="btn btn-primary px-4 py-2" 
              style={{ borderRadius: '25px', maxWidth: '200px', margin: '0 auto' }}
              onClick={() => loadItems()}
            >
              <i className="fas fa-refresh me-2"></i>Дахин ачаалах
            </button>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {items.map(item => (
                <div key={item._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;