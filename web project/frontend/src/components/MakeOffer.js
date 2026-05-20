import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { offerService } from '../services/offerService';
import Alert from './Alert';

const MakeOffer = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [offeredItems, setOfferedItems] = useState([{
    title: '',
    description: '',
    condition: 'good',
    estimatedValue: '',
    images: []
  }]);
  
  const [message, setMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([[]]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadItem();
  }, [itemId, isAuthenticated]);

  const loadItem = async () => {
    try {
      const data = await itemService.getItem(itemId);
      if (data.owner._id === user.id || data.owner._id === user._id) {
        setAlert({ message: 'Өөрийн зар дээр санал илгээх боломжгүй', type: 'error' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      setItem(data);
    } catch (error) {
      console.error('Error loading item:', error);
      setAlert({ message: 'Зар ачаалахад алдаа гарлаа', type: 'error' });
    }
  };

  const addOfferedItem = () => {
    setOfferedItems([...offeredItems, {
      title: '',
      description: '',
      condition: 'good',
      estimatedValue: '',
      images: []
    }]);
    setImageFiles([...imageFiles, []]);
  };

  const removeOfferedItem = (index) => {
    setOfferedItems(offeredItems.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const updateOfferedItem = (index, field, value) => {
    const updated = [...offeredItems];
    updated[index] = { ...updated[index], [field]: value };
    setOfferedItems(updated);
  };

  const handleImageChange = (itemIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setAlert({ message: 'Нэг бүтээгдэхүүнд 3 хүртэл зураг оруулах боломжтой', type: 'warning' });
      return;
    }
    
    const updatedFiles = [...imageFiles];
    updatedFiles[itemIndex] = files;
    setImageFiles(updatedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (offeredItems.some(item => !item.title || !item.description)) {
      setAlert({ message: 'Бүх талбарыг бөглөнө үү', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const offerData = {
        itemId,
        message,
        offeredItems
      };

      await offerService.createOffer(offerData, imageFiles);
      
      setAlert({ message: 'Санал амжилттай илгээгдлээ!', type: 'success' });
      setTimeout(() => navigate(`/item/${itemId}`), 2000);
    } catch (error) {
      console.error('Error creating offer:', error);
      setAlert({ message: 'Санал илгээхэд алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Уншиж байна...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
        <div className="card-header border-0" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 className="mb-0">
            <i className="fas fa-handshake me-2"></i>Санал илгээх
          </h3>
        </div>
        
        <div className="card-body p-4">
          {/* Original Item Info */}
          <div className="mb-4 p-3 bg-light rounded">
            <h5 className="fw-bold mb-2">Солилцох зар</h5>
            <div className="d-flex align-items-center">
              {item.images && item.images.length > 0 && (
                <img
                  src={typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url}
                  alt={item.title}
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
                <h6 className="mb-0">{item.title}</h6>
                <small className="text-muted">{item.location?.city}</small>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Offered Items */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Таны санал болгож буй бүтээгдэхүүн</h5>
              
              {offeredItems.map((offeredItem, index) => (
                <div key={index} className="card mb-3 border">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Бүтээгдэхүүн #{index + 1}</h6>
                      {offeredItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeOfferedItem(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Нэр *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Бүтээгдэхүүний нэр"
                        value={offeredItem.title}
                        onChange={(e) => updateOfferedItem(index, 'title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Тайлбар *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Дэлгэрэнгүй тайлбар"
                        value={offeredItem.description}
                        onChange={(e) => updateOfferedItem(index, 'description', e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Байдал *</label>
                        <select
                          className="form-select"
                          value={offeredItem.condition}
                          onChange={(e) => updateOfferedItem(index, 'condition', e.target.value)}
                        >
                          <option value="new">Шинэ</option>
                          <option value="like_new">Шинэ шиг</option>
                          <option value="good">Сайн</option>
                          <option value="fair">Дунд</option>
                          <option value="poor">Муу</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Үнэлэмж (₮)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Тоймлох үнэ"
                          value={offeredItem.estimatedValue}
                          onChange={(e) => updateOfferedItem(index, 'estimatedValue', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Зургууд (3 хүртэл)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageChange(index, e)}
                      />
                      <small className="text-muted">
                        {imageFiles[index]?.length || 0} зураг сонгогдсон
                      </small>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addOfferedItem}
                style={{ borderRadius: '10px' }}
              >
                <i className="fas fa-plus me-2"></i>Бүтээгдэхүүн нэмэх
              </button>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="form-label fw-bold">Нэмэлт мэдээлэл</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Таны санал болон нэмэлт тайлбар..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              ></textarea>
              <small className="text-muted">{message.length}/500</small>
            </div>

            {/* Submit Buttons */}
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/item/${itemId}`)}
                disabled={loading}
                style={{ borderRadius: '10px' }}
              >
                <i className="fas fa-times me-2"></i>Цуцлах
              </button>
              
              <button
                type="submit"
                className="btn text-white"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Илгээж байна...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>Санал илгээх
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MakeOffer;
