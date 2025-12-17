import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import Alert from './Alert';

const AddItem = () => {
  const { itemId } = useParams(); // For editing existing item
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const isEditing = Boolean(itemId);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    location: {
      city: '',
      district: ''
    },
    lookingFor: '',
    images: []
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadCategories();
    
    if (isEditing) {
      loadItemForEdit();
    }
  }, [isAuthenticated, navigate, itemId, isEditing]);

  const loadCategories = async () => {
    try {
      const data = await itemService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setAlert({ message: 'Ангилал ачаалахад алдаа гарлаа', type: 'error' });
    }
  };

  const loadItemForEdit = async () => {
    try {
      const item = await itemService.getItem(itemId);
      
      // Check if user owns this item
      if (item.owner._id !== user.id && item.owner._id !== user._id) {
        setAlert({ message: 'Та зөвхөн өөрийн зарыг засах боломжтой', type: 'error' });
        setTimeout(() => navigate(`/profile/${user?.id || user?._id}`), 2000);
        return;
      }

      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        condition: item.condition || '',
        location: {
          city: item.location?.city || '',
          district: item.location?.district || ''
        },
        lookingFor: item.wantedItems?.description || '',
        images: item.images || []
      });

      if (item.images && item.images.length > 0) {
        setImagePreviewUrls(item.images);
      }
    } catch (error) {
      console.error('Error loading item:', error);
      setAlert({ message: 'Зар ачаалахад алдаа гарлаа', type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setAlert({ message: 'Хамгийн ихдээ 5 зураг оруулах боломжтой', type: 'warning' });
      return;
    }

    setImageFiles(files);

    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);
  };

  const removeImage = (index) => {
    if (isEditing && formData.images.length > 0) {
      // Remove from existing images
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
      setImagePreviewUrls(newImages);
    } else {
      // Remove from new files
      const newFiles = imageFiles.filter((_, i) => i !== index);
      const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
      
      setImageFiles(newFiles);
      setImagePreviewUrls(newPreviewUrls);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setAlert({ message: 'Барааны нэрийг оруулна уу', type: 'warning' });
      return false;
    }

    if (!formData.description.trim()) {
      setAlert({ message: 'Тайлбарыг оруулна уу', type: 'warning' });
      return false;
    }

    if (!formData.category) {
      setAlert({ message: 'Ангилал сонгоно уу', type: 'warning' });
      return false;
    }

    if (!formData.condition) {
      setAlert({ message: 'Барааны байдлыг сонгоно уу', type: 'warning' });
      return false;
    }

    if (!formData.location.city.trim()) {
      setAlert({ message: 'Хотыг оруулна уу', type: 'warning' });
      return false;
    }

    if (!formData.location.district.trim()) {
      setAlert({ message: 'Дүүргийг оруулна уу', type: 'warning' });
      return false;
    }

    if (!formData.lookingFor.trim()) {
      setAlert({ message: 'Хайж байгаа барааг оруулна уу', type: 'warning' });
      return false;
    }

    if (formData.title.length < 3 || formData.title.length > 100) {
      setAlert({ message: 'Барааны нэр 3-100 тэмдэгтийн хооронд байх ёстой', type: 'warning' });
      return false;
    }

    if (formData.description.length < 10 || formData.description.length > 1000) {
      setAlert({ message: 'Тайлбар 10-1000 тэмдэгтийн хооронд байх ёстой', type: 'warning' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        location: {
          city: formData.location.city.trim(),
          district: formData.location.district.trim()
        },
        wantedItems: {
          description: formData.lookingFor.trim(),
          categories: []
        }
      };

      let result;
      
      if (isEditing) {
        // Update existing item
        if (imageFiles.length > 0) {
          // Upload new images if provided
          result = await itemService.updateItemWithImages(itemId, itemData, imageFiles);
        } else {
          // Keep existing images
          result = await itemService.updateItem(itemId, itemData);
        }
        setAlert({ message: 'Зар амжилттай шинэчлэгдлээ!', type: 'success' });
      } else {
        // Create new item
        if (imageFiles.length > 0) {
          result = await itemService.createItemWithImages(itemData, imageFiles);
        } else {
          result = await itemService.createItem(itemData);
        }
        setAlert({ message: 'Зар амжилттай нэмэгдлээ!', type: 'success' });
      }

      // Redirect to item view or profile
      setTimeout(() => {
        if (result && result._id) {
          navigate(`/item/${result._id}`);
        } else {
          navigate(`/profile/${user?.id || user?._id}`);
        }
      }, 1500);

    } catch (error) {
      console.error('Error saving item:', error);
      const message = error.response?.data?.message || 
        (isEditing ? 'Зар шинэчлэхэд алдаа гарлаа' : 'Зар нэмэхэд алдаа гарлаа');
      setAlert({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container-fluid py-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="row justify-content-center">
        <div className="col-xl-10 col-lg-11">
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
          
          <div className="card border-0" style={{ boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="card-header border-0" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '2rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="me-3" style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus'} fa-2x`}></i>
                </div>
                <div>
                  <h3 className="mb-1 fw-bold">
                    {isEditing ? 'Зар засах' : 'Шинэ зар нэмэх'}
                  </h3>
                  <p className="mb-0 opacity-90">Барааны мэдээллийг бүрэн оруулна уу</p>
                </div>
              </div>
            </div>

            <div className="card-body" style={{ padding: '2.5rem' }}>
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-4">
                  <label htmlFor="title" className="form-label fw-bold" style={{ fontSize: '1.1rem' }}>
                    <i className="fas fa-tag me-2 text-primary"></i>Барааны нэр *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Барааны нэрийг оруулна уу..."
                    required
                    disabled={loading}
                    maxLength="100"
                    style={{ borderRadius: '12px', border: '2px solid #e9ecef', padding: '1rem' }}
                  />
                  <div className="form-text d-flex justify-content-between">
                    <span>Товч, тодорхой нэр оруулна уу</span>
                    <span>{formData.title.length}/100 тэмдэгт</span>
                  </div>
                </div>

                {/* Category and Location */}
                <div className="row g-4 mb-4">
                  <div className="col-lg-6 col-md-6">
                    <label htmlFor="category" className="form-label fw-bold" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-folder me-2 text-primary"></i>Ангилал *
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      style={{ borderRadius: '12px', border: '2px solid #e9ecef', padding: '1rem' }}
                    >
                      <option value="">Ангилал сонгоно уу</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-lg-6 col-md-6">
                    <label htmlFor="condition" className="form-label fw-bold" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-star me-2 text-warning"></i>Барааны байдал *
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      style={{ borderRadius: '12px', border: '2px solid #e9ecef', padding: '1rem' }}
                    >
                      <option value="">Барааны байдлыг сонгоно уу</option>
                      <option value="new">Шинэ</option>
                      <option value="like_new">Шинэ мэт</option>
                      <option value="good">Сайн</option>
                      <option value="fair">Хангалттай</option>
                      <option value="poor">Муу</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="location.city" className="form-label fw-bold">
                      <i className="fas fa-city me-2 text-info"></i>Хот *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="location.city"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      placeholder="Улаанбаатар"
                      required
                      disabled={loading}
                      maxLength="50"
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="location.district" className="form-label fw-bold">
                      <i className="fas fa-map-marker-alt me-2 text-danger"></i>Дүүрэг *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="location.district"
                      name="location.district"
                      value={formData.location.district}
                      onChange={handleInputChange}
                      placeholder="Сүхбаатар дүүрэг"
                      required
                      disabled={loading}
                      maxLength="50"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold">
                    <i className="fas fa-align-left me-2 text-primary"></i>Дэлгэрэнгүй тайлбар *
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Барааны дэлгэрэнгүй тайлбарыг бичнэ үү..."
                    required
                    disabled={loading}
                    maxLength="1000"
                  ></textarea>
                  <div className="form-text">
                    {formData.description.length}/1000 тэмдэгт
                  </div>
                </div>

                {/* Looking For */}
                <div className="mb-4">
                  <label htmlFor="lookingFor" className="form-label fw-bold">
                    <i className="fas fa-search me-2 text-success"></i>Хайж байгаа зүйл *
                  </label>
                  <textarea
                    className="form-control"
                    id="lookingFor"
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Ямар зүйлийн оронд солихыг хүсэж байгаагаа бичнэ үү..."
                    required
                    disabled={loading}
                    maxLength="500"
                  ></textarea>
                  <div className="form-text">
                    {formData.lookingFor.length}/500 тэмдэгт
                  </div>
                </div>

                {/* Images */}
                <div className="mb-4">
                  <label htmlFor="images" className="form-label fw-bold">
                    <i className="fas fa-images me-2 text-warning"></i>Зургууд
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="images"
                    name="images"
                    onChange={handleImageChange}
                    multiple
                    accept="image/*"
                    disabled={loading}
                  />
                  <div className="form-text">
                    Хамгийн ихдээ 5 зураг (JPG, PNG, GIF)
                  </div>

                  {/* Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-3">
                      <div className="row g-3">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="col-md-3">
                            <div className="position-relative">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="img-fluid rounded shadow-sm"
                                style={{ height: '150px', objectFit: 'cover', width: '100%' }}
                              />
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                onClick={() => removeImage(index)}
                                disabled={loading}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate(`/profile/${user?.id || user?._id}`)}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-2"></i>Цуцлах
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      minWidth: '150px'
                    }}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        {isEditing ? 'Шинэчилж байна...' : 'Нэмж байна...'}
                      </>
                    ) : (
                      <>
                        <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'} me-2`}></i>
                        {isEditing ? 'Шинэчлэх' : 'Зар нэмэх'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;