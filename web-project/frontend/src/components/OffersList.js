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

  const truncateText = (text, maxLength = 140) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case 'new':
        return 'Шинэ';
      case 'like_new':
        return 'Шинэ шиг';
      case 'good':
        return 'Сайн';
      case 'fair':
        return 'Дунд';
      case 'poor':
        return 'Муу';
      default:
        return condition || 'Тодорхойгүй';
    }
  };

  const renderPrimaryImage = (images, title) => {
    const image = images?.[0];
    const imageUrl = image ? getImageUrl(image) : null;

    if (!imageUrl) {
      return (
        <div
          className="d-flex align-items-center justify-content-center bg-light"
          style={{ width: '88px', height: '88px', borderRadius: '14px' }}
        >
          <i className="fas fa-image text-muted fa-lg"></i>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={title}
        style={{
          width: '88px',
          height: '88px',
          objectFit: 'cover',
          borderRadius: '14px'
        }}
      />
    );
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
                  <div className="card border-0 shadow-sm" style={{ borderRadius: '18px', overflow: 'hidden' }}>
                    <div className="card-body p-4">
                      <div className="row g-4 align-items-start">
                        <div className="col-lg-4">
                          <div className="d-flex gap-3">
                            {renderPrimaryImage(offer.item?.images, offer.item?.title)}
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                <h6 className="mb-0 fw-bold">{offer.item?.title}</h6>
                                {getStatusBadge(offer.status)}
                              </div>
                              <small className="text-muted d-block mb-2">
                                {activeTab === 'received' ? 'Таны зар' : 'Сонирхож буй зар'}
                              </small>
                              <p className="text-muted small mb-2">
                                {truncateText(offer.item?.description || 'Зарын дэлгэрэнгүй тайлбар нэмэгдээгүй байна.', 120)}
                              </p>
                              <small className="text-muted d-block">
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {offer.item?.location?.city || 'Байршилгүй'}
                                {offer.item?.location?.district ? `, ${offer.item.location.district}` : ''}
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-5">
                          <div className="bg-light rounded-4 p-3 h-100">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div>
                                <small className="text-muted d-block">Санал болгож буй зүйлс</small>
                                <strong>{offer.offeredItems?.length || 0} бүтээгдэхүүн</strong>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedOffer(offer)}
                              >
                                <i className="fas fa-eye me-1"></i>Дэлгэрэнгүй
                              </button>
                            </div>

                            <div className="d-flex flex-column gap-3">
                              {offer.offeredItems?.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="d-flex gap-3 bg-white rounded-4 p-3 border">
                                  {renderPrimaryImage(item.images, item.title)}
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                      <strong>{item.title}</strong>
                                      <span className="badge bg-light text-dark">{getConditionLabel(item.condition)}</span>
                                    </div>
                                    <p className="small text-muted mb-1">{truncateText(item.description, 110)}</p>
                                    {item.estimatedValue ? (
                                      <small className="text-muted d-block">
                                        <i className="fas fa-tag me-1"></i>
                                        {Number(item.estimatedValue).toLocaleString('en-US')} ₮
                                      </small>
                                    ) : null}
                                  </div>
                                </div>
                              ))}

                              {offer.offeredItems?.length > 2 && (
                                <small className="text-muted">+{offer.offeredItems.length - 2} бүтээгдэхүүн нэмэлтээр байна</small>
                              )}

                              {offer.message && (
                                <div className="border-start border-4 border-primary ps-3">
                                  <small className="text-muted d-block mb-1">Саналын тайлбар</small>
                                  <p className="mb-0">“{truncateText(offer.message, 160)}”</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-3">
                          <div className="d-flex flex-column gap-3 h-100">
                            <div>
                              <small className="text-muted d-block">
                                {activeTab === 'received' ? 'Илгээгч' : 'Хүлээн авагч'}
                              </small>
                              <strong>
                                {activeTab === 'received' ? offer.offeredBy?.name : offer.offeredTo?.name}
                              </strong>
                              {(activeTab === 'received' ? offer.offeredBy?.profile : offer.offeredTo?.profile) && (
                                <small className="text-muted d-block mt-1">
                                  <i className="fas fa-star text-warning me-1"></i>
                                  {(activeTab === 'received' ? offer.offeredBy?.profile?.rating : offer.offeredTo?.profile?.rating) || '0.0'}
                                  <span className="mx-1">•</span>
                                  {(activeTab === 'received' ? offer.offeredBy?.profile?.totalTrades : offer.offeredTo?.profile?.totalTrades) || 0} солилцоо
                                </small>
                              )}
                            </div>

                            <small className="text-muted d-block">
                              <i className="fas fa-calendar me-1"></i>
                              {new Date(offer.createdAt).toLocaleDateString('mn-MN')}
                            </small>

                            {offer.responseMessage && (
                              <div className="bg-light rounded-4 p-3">
                                <small className="text-muted d-block mb-1">Хариу</small>
                                <p className="small mb-0">{truncateText(offer.responseMessage, 120)}</p>
                              </div>
                            )}

                            <div className="mt-auto d-grid gap-2">
                              {activeTab === 'received' && offer.status === 'pending' && (
                                <button
                                  className="btn btn-success"
                                  onClick={() => setSelectedOffer(offer)}
                                >
                                  <i className="fas fa-reply me-1"></i>Хариулах
                                </button>
                              )}

                              {offer.status === 'accepted' && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => navigate(`/chat/${offer._id}`)}
                                >
                                  <i className="fas fa-comments me-1"></i>Чат
                                </button>
                              )}

                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => setSelectedOffer(offer)}
                              >
                                <i className="fas fa-info-circle me-1"></i>Мэдээлэл
                              </button>
                            </div>
                          </div>
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
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '22px', overflow: 'hidden' }}>
              <div className="modal-header border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div>
                  <h5 className="modal-title mb-1">Саналын дэлгэрэнгүй</h5>
                  <small className="opacity-75">{selectedOffer.item?.title}</small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setSelectedOffer(null);
                    setResponseMessage('');
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-4 mb-4">
                  <div className="col-lg-5">
                    <div className="border rounded-4 p-3 h-100">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0 fw-bold">Санал авсан зар</h6>
                        {getStatusBadge(selectedOffer.status)}
                      </div>
                      {selectedOffer.item?.images?.length > 0 ? (
                        <div className="row g-2 mb-3">
                          {selectedOffer.item.images.slice(0, 4).map((image, index) => {
                            const imageUrl = getImageUrl(image);
                            return (
                              <div key={index} className="col-6">
                                <img
                                  src={imageUrl}
                                  alt={selectedOffer.item.title}
                                  className="w-100"
                                  style={{ height: '120px', objectFit: 'cover', borderRadius: '14px' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-light rounded-4 d-flex align-items-center justify-content-center mb-3" style={{ height: '220px' }}>
                          <i className="fas fa-image fa-3x text-muted"></i>
                        </div>
                      )}
                      <h5 className="fw-bold mb-2">{selectedOffer.item?.title}</h5>
                      <p className="text-muted mb-2">{selectedOffer.item?.description || 'Дэлгэрэнгүй тайлбар байхгүй байна.'}</p>
                      <small className="text-muted d-block mb-1">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {selectedOffer.item?.location?.city || 'Байршилгүй'}
                        {selectedOffer.item?.location?.district ? `, ${selectedOffer.item.location.district}` : ''}
                      </small>
                      <small className="text-muted d-block">
                        <i className="fas fa-calendar me-1"></i>
                        {new Date(selectedOffer.createdAt).toLocaleDateString('mn-MN')}
                      </small>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="border rounded-4 p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0 fw-bold">Санал болгосон бүтээгдэхүүнүүд</h6>
                        <small className="text-muted">{selectedOffer.offeredItems?.length || 0} ширхэг</small>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {selectedOffer.offeredItems?.map((item, index) => (
                          <div key={index} className="border rounded-4 p-3">
                            <div className="row g-3 align-items-start">
                              <div className="col-md-3">
                                {renderPrimaryImage(item.images, item.title)}
                              </div>
                              <div className="col-md-9">
                                <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
                                  <h6 className="fw-bold mb-0">{item.title}</h6>
                                  <span className="badge bg-light text-dark">{getConditionLabel(item.condition)}</span>
                                </div>
                                <p className="text-muted mb-2">{item.description}</p>
                                <div className="d-flex flex-wrap gap-3">
                                  {item.estimatedValue ? (
                                    <small className="text-muted">
                                      <i className="fas fa-tag me-1"></i>
                                      {Number(item.estimatedValue).toLocaleString('en-US')} ₮
                                    </small>
                                  ) : null}
                                  <small className="text-muted">
                                    <i className="fas fa-images me-1"></i>
                                    {item.images?.length || 0} зураг
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-4 p-3 mb-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1">Санал илгээгч</small>
                          <strong>{selectedOffer.offeredBy?.name || 'Тодорхойгүй'}</strong>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1">Хүлээн авагч</small>
                          <strong>{selectedOffer.offeredTo?.name || 'Тодорхойгүй'}</strong>
                        </div>
                      </div>
                      {(selectedOffer.offeredBy?.profile || selectedOffer.offeredTo?.profile) && (
                        <div className="row g-3 mt-1">
                          <div className="col-md-6">
                            <small className="text-muted d-block">Үнэлгээ</small>
                            <strong>{selectedOffer.offeredBy?.profile?.rating || '0.0'}</strong>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">Нийт солилцоо</small>
                            <strong>{selectedOffer.offeredBy?.profile?.totalTrades || 0}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedOffer.message && (
                      <div className="border-start border-4 border-primary ps-3 mb-4">
                        <small className="text-muted d-block mb-1">Нэмэлт тайлбар</small>
                        <p className="mb-0">{selectedOffer.message}</p>
                      </div>
                    )}

                    {selectedOffer.responseMessage && (
                      <div className="alert alert-info mb-0">
                        <strong className="d-block mb-1">Хариу</strong>
                        {selectedOffer.responseMessage}
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === 'received' && selectedOffer.status === 'pending' && (
                  <div className="border rounded-4 p-3 bg-light">
                    <label className="form-label fw-bold">Хариу мессеж (заавал биш)</label>
                    <textarea
                      className="form-control mb-3"
                      rows="4"
                      placeholder="Саналд өгөх хариу..."
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      maxLength={500}
                    ></textarea>
                    <div className="d-flex gap-2 flex-wrap justify-content-end">
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleRejectOffer(selectedOffer._id)}
                      >
                        <i className="fas fa-times me-2"></i>Татгалзах
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleAcceptOffer(selectedOffer._id)}
                      >
                        <i className="fas fa-check me-2"></i>Зөвшөөрөх
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 bg-light">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSelectedOffer(null);
                    setResponseMessage('');
                  }}
                >
                  Хаах
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
