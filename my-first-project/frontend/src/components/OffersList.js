import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { offerService } from '../services/offerService';
import Alert from './Alert';

const OffersList = () => {
  const { itemId } = useParams(); // Optional: for viewing offers on a specific item
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOffers();
  }, [itemId, activeTab, isAuthenticated]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      let data;
      
      if (itemId) {
        data = await offerService.getItemOffers(itemId);
      } else if (activeTab === 'received') {
        data = await offerService.getReceivedOffers();
      } else {
        data = await offerService.getSentOffers();
      }
      
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
      setAlert({ message: 'Саналууд ачаалахад алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await offerService.acceptOffer(offerId, responseMessage);
      
      setAlert({ message: 'Санал амжилттай зөвшөөрөгдлөө! Чат нээгдэж байна...', type: 'success' });
      setSelectedOffer(null);
      setResponseMessage('');
      setTimeout(() => {
        navigate(`/chat/${offerId}`);
      }, 2000);
    } catch (error) {
      console.error('Error accepting offer:', error);
      setAlert({ message: 'Санал зөвшөөрөхөд алдаа гарлаа', type: 'error' });
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await offerService.rejectOffer(offerId, responseMessage || 'Баярлалаа, гэхдээ энэ удаад болохгүй байна.');
      
      setAlert({ message: 'Санал татгалзагдлаа', type: 'info' });
      setSelectedOffer(null);
      setResponseMessage('');
      loadOffers();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      setAlert({ message: 'Санал татгалзахад алдаа гарлаа', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">Хүлээгдэж байна</span>;
      case 'accepted':
        return <span className="badge bg-success">Зөвшөөрсөн</span>;
      case 'rejected':
        return <span className="badge bg-danger">Татгалзсан</span>;
      case 'withdrawn':
        return <span className="badge bg-secondary">Буцаасан</span>;
      case 'completed':
        return <span className="badge bg-info">Дууссан</span>;
      default:
        return <span className="badge bg-primary">{status}</span>;
    }
  };

  const getImageUrl = (image) => {
    if (typeof image === 'string') return image;
    if (image && image.url) return image.url;
    return null;
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

  return (
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
        <div className="card-header border-0" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 className="mb-0">
            <i className="fas fa-envelope me-2"></i>
            {itemId ? 'Зарын саналууд' : 'Миний саналууд'}
          </h3>
        </div>

        {!itemId && (
          <div className="card-body p-0">
            <ul className="nav nav-tabs nav-fill border-0">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'received' ? 'active' : ''}`}
                  onClick={() => setActiveTab('received')}
                  style={{
                    border: 'none',
                    borderBottom: activeTab === 'received' ? '3px solid #667eea' : 'none',
                    color: activeTab === 'received' ? '#667eea' : '#6c757d'
                  }}
                >
                  <i className="fas fa-inbox me-2"></i>Хүлээн авсан ({offers.filter(_o => activeTab === 'received').length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'sent' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sent')}
                  style={{
                    border: 'none',
                    borderBottom: activeTab === 'sent' ? '3px solid #667eea' : 'none',
                    color: activeTab === 'sent' ? '#667eea' : '#6c757d'
                  }}
                >
                  <i className="fas fa-paper-plane me-2"></i>Илгээсэн ({offers.filter(_o => activeTab === 'sent').length})
                </button>
              </li>
            </ul>
          </div>
        )}

        <div className="card-body p-4">
          {offers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <h5>Санал байхгүй байна</h5>
              <p>Та санал хүлээн авах эсвэл илгээхдээ энд харагдана</p>
            </div>
          ) : (
            <div className="row g-3">
              {offers.map(offer => (
                <div key={offer._id} className="col-12">
                  <div className="card border" style={{ borderRadius: '15px' }}>
                    <div className="card-body p-3">
                      <div className="row align-items-center">
                        {/* Item Info */}
                        <div className="col-md-3">
                          <div className="d-flex align-items-center">
                            {offer.item?.images?.[0] && (
                              <img
                                src={getImageUrl(offer.item.images[0])}
                                alt={offer.item.title}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '10px',
                                  marginRight: '1rem'
                                }}
                              />
                            )}
                            <div>
                              <h6 className="mb-1">{offer.item?.title}</h6>
                              <small className="text-muted">
                                {activeTab === 'received' ? 'Таны зар' : 'Сонирхож буй зар'}
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Offer Details */}
                        <div className="col-md-4">
                          <div>
                            <small className="text-muted d-block">Санал болгож буй:</small>
                            {offer.offeredItems?.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                <strong>{item.title}</strong>
                                <span className="badge bg-light text-dark ms-2">{item.condition}</span>
                              </div>
                            ))}
                            {offer.message && (
                              <small className="text-muted d-block mt-2">"{offer.message}"</small>
                            )}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="col-md-2">
                          <small className="text-muted d-block">
                            {activeTab === 'received' ? 'Илгээгч:' : 'Хүлээн авагч:'}
                          </small>
                          <strong>
                            {activeTab === 'received' ? offer.offeredBy?.name : offer.offeredTo?.name}
                          </strong>
                        </div>

                        {/* Status & Actions */}
                        <div className="col-md-3 text-end">
                          <div className="mb-2">
                            {getStatusBadge(offer.status)}
                          </div>
                          <small className="text-muted d-block mb-2">
                            {new Date(offer.createdAt).toLocaleDateString('mn-MN')}
                          </small>
                          
                          {activeTab === 'received' && offer.status === 'pending' && (
                            <div className="d-grid gap-2">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => setSelectedOffer(offer)}
                              >
                                <i className="fas fa-check me-1"></i>Хариулах
                              </button>
                            </div>
                          )}

                          {offer.status === 'accepted' && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/chat/${offer._id}`)}
                            >
                              <i className="fas fa-comments me-1"></i>Чат
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {selectedOffer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title">Санал дээр хариу өгөх</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setSelectedOffer(null);
                    setResponseMessage('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Хариу мессеж (заавал биш)</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Таны хариу..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    maxLength={500}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-success"
                  onClick={() => handleAcceptOffer(selectedOffer._id)}
                >
                  <i className="fas fa-check me-2"></i>Зөвшөөрөх
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRejectOffer(selectedOffer._id)}
                >
                  <i className="fas fa-times me-2"></i>Татгалзах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersList;
