import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import Alert from './Alert';

const ItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const data = await itemService.getItem(itemId);
      setItem(data);
    } catch (error) {
      console.error('Error loading item:', error);
      setAlert({ message: 'Зар ачаалахад алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (typeof image === 'string') return image;
    if (image && image.url) return image.url;
    return null;
  };

  const isOwner = user && item && (user.id === item.owner?._id || user._id === item.owner?._id);

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      setAlert({ message: 'Санал илгээхийн тулд нэвтрэх шаардлагатай', type: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    navigate(`/make-offer/${itemId}`);
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setAlert({ message: 'Хадгалахын тулд нэвтрэх шаардлагатай', type: 'warning' });
      return;
    }
    try {
      await itemService.toggleFavorite(itemId);
      setAlert({ message: 'Зар хадгалагдлаа', type: 'success' });
      loadItem(); // Reload to update bookmark status
    } catch (error) {
      console.error('Error bookmarking item:', error);
      setAlert({ message: 'Алдаа гарлаа', type: 'error' });
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      setAlert({ message: 'Гомдол гаргахын тулд нэвтрэх шаардлагатай', type: 'warning' });
      return;
    }
    navigate(`/report/item/${itemId}`);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Уншиж байна...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-5 text-center">
        <h3>Зар олдсонгүй</h3>
        <Link to="/" className="btn btn-primary mt-3">Нүүр хуудас руу буцах</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1400px' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="row g-4">
        {/* Image Gallery */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            {item.images && item.images.length > 0 ? (
              <>
                <div style={{ height: '500px', background: '#f8f9fa', position: 'relative' }}>
                  <img
                    src={getImageUrl(item.images[currentImageIndex])}
                    alt={item.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><i class="fas fa-image fa-5x text-muted"></i></div>';
                    }}
                  />
                  
                  {/* Navigation Arrows */}
                  {item.images.length > 1 && (
                    <>
                      <button
                        className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3"
                        style={{ borderRadius: '50%', width: '50px', height: '50px' }}
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? item.images.length - 1 : prev - 1)}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3"
                        style={{ borderRadius: '50%', width: '50px', height: '50px' }}
                        onClick={() => setCurrentImageIndex(prev => prev === item.images.length - 1 ? 0 : prev + 1)}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {item.images.length > 1 && (
                  <div className="p-3 bg-white d-flex gap-2 overflow-auto">
                    {item.images.map((image, index) => (
                      <img
                        key={index}
                        src={getImageUrl(image)}
                        alt={`${item.title} ${index + 1}`}
                        className="cursor-pointer"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: currentImageIndex === index ? '3px solid #667eea' : '3px solid transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ height: '500px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="text-center text-white">
                  <i className="fas fa-image fa-5x mb-3 opacity-50"></i>
                  <h4>Зураг байхгүй</h4>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-body p-4">
              {/* Status Badge */}
              <div className="mb-3">
                {item.status === 'active' && <span className="badge bg-success fs-6">Идэвхтэй</span>}
                {item.status === 'traded' && <span className="badge bg-info fs-6">Солигдсон</span>}
                {item.status === 'inactive' && <span className="badge bg-secondary fs-6">Идэвхгүй</span>}
              </div>

              {/* Title */}
              <h2 className="fw-bold mb-3">{item.title}</h2>

              {/* Category & Condition */}
              <div className="d-flex gap-3 mb-4">
                <span className="badge bg-light text-dark fs-6">
                  <i className="fas fa-tag me-2"></i>{item.category}
                </span>
                <span className="badge bg-light text-dark fs-6">
                  <i className="fas fa-check-circle me-2"></i>{item.condition}
                </span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h5 className="fw-bold mb-2">Тайлбар</h5>
                <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>{item.description}</p>
              </div>

              {/* Location */}
              <div className="mb-4">
                <h5 className="fw-bold mb-2"><i className="fas fa-map-marker-alt me-2 text-danger"></i>Байршил</h5>
                <p className="text-muted mb-0">{item.location?.city}, {item.location?.district}</p>
              </div>

              {/* Looking For */}
              {item.wantedItems?.description && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h5 className="fw-bold mb-2"><i className="fas fa-exchange-alt me-2 text-primary"></i>Юутай солихыг хүсч байна</h5>
                  <p className="mb-0">{item.wantedItems.description}</p>
                </div>
              )}

              {/* Owner Info - Limited for guests */}
              <div className="mb-4 p-3 border rounded">
                <h5 className="fw-bold mb-2"><i className="fas fa-user me-2 text-success"></i>Зарын эзэмшигч</h5>
                {isAuthenticated ? (
                  <Link to={`/profile/${item.owner?._id}`} className="text-decoration-none">
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{
                        width: '50px',
                        height: '50px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className="fas fa-user fa-lg"></i>
                      </div>
                      <div>
                        <p className="mb-0 fw-bold">{item.owner?.name}</p>
                        <small className="text-muted">{item.owner?.location?.city}</small>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="text-muted">
                    <i className="fas fa-lock me-2"></i>
                    Холбоо барих мэдээллийг үзэхийн тулд <Link to="/login">нэвтрэх</Link> шаардлагатай
                  </div>
                )}
              </div>

              {/* Date Posted */}
              <div className="mb-4">
                <small className="text-muted">
                  <i className="fas fa-clock me-2"></i>
                  {new Date(item.createdAt).toLocaleDateString('mn-MN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {!isOwner && item.status === 'active' && (
                  <button
                    className="btn btn-lg text-white"
                    onClick={handleMakeOffer}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '15px'
                    }}
                  >
                    <i className="fas fa-handshake me-2"></i>
                    {isAuthenticated ? 'Санал илгээх' : 'Нэвтэрч санал илгээх'}
                  </button>
                )}

                {isOwner && (
                  <>
                    <Link
                      to={`/edit-item/${itemId}`}
                      className="btn btn-lg btn-outline-primary"
                      style={{ borderRadius: '15px' }}
                    >
                      <i className="fas fa-edit me-2"></i>Засах
                    </Link>
                    <Link
                      to={`/offers/${itemId}`}
                      className="btn btn-lg btn-outline-success"
                      style={{ borderRadius: '15px' }}
                    >
                      <i className="fas fa-envelope me-2"></i>Саналууд үзэх
                    </Link>
                  </>
                )}

                {isAuthenticated && !isOwner && (
                  <button
                    className="btn btn-lg btn-outline-secondary"
                    onClick={handleBookmark}
                    style={{ borderRadius: '15px' }}
                  >
                    <i className="far fa-bookmark me-2"></i>Хадгалах
                  </button>
                )}

                {/* Report Button */}
                {isAuthenticated && !isOwner && (
                  <button
                    className="btn btn-sm btn-link text-danger text-decoration-none"
                    onClick={handleReport}
                  >
                    <i className="fas fa-flag me-2"></i>Гомдол гаргах
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
