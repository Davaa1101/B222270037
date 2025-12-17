import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { itemService } from '../services/itemService';
import ItemCard from './ItemCard';
import Alert from './Alert';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });

  const isOwner = currentUser && (currentUser.id === userId || currentUser._id === userId);

  useEffect(() => {
    loadProfile();
    loadUserItems();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // If viewing own profile, get full data; otherwise get public data
      const user = await authService.getProfile(isOwner ? null : userId);
      setProfile(user);
      if (isOwner) {
        // Handle location object properly
        const locationString = user.location ? 
          (typeof user.location === 'string' ? 
            user.location : 
            `${user.location.city || ''}, ${user.location.district || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
          ) : '';
          
        setEditForm({
          username: user.username || user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          location: locationString,
          bio: user.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setAlert({ message: 'Профайл ачаалахад алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadUserItems = async () => {
    setItemsLoading(true);
    try {
      const data = await itemService.getUserItems(userId);
      setUserItems(data.items || []);
    } catch (error) {
      console.error('Error loading user items:', error);
      setUserItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Parse location string into city and district
      const locationParts = editForm.location.split(',').map(part => part.trim());
      const formattedData = {
        name: editForm.username,
        phone: editForm.phone,
        bio: editForm.bio
      };
      
      // Add location if provided
      if (editForm.location.trim()) {
        formattedData['location.city'] = locationParts[0] || '';
        formattedData['location.district'] = locationParts[1] || '';
      }
      
      const updatedUser = await authService.updateProfile(formattedData);
      setProfile(updatedUser.user);
      updateUser(updatedUser.user);
      setEditing(false);
      setAlert({ message: 'Профайл амжилттай шинэчлэгдлээ!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({ message: 'Профайл шинэчлэхэд алдаа гарлаа', type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
            <p className="text-muted">Профайл ачаалж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center" style={{ minHeight: '400px' }}>
          <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
          <h4>Хэрэглэгч олдсонгүй</h4>
          <Link to="/" className="btn btn-primary">Нүүр хуудас руу буцах</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="row g-4">
        {/* Profile Info Section */}
        <div className="col-xl-3 col-lg-4 mb-4">
          <div className="card border-0" style={{ boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="card-header border-0" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">
                  <i className="fas fa-user me-2"></i>Хэрэглэгчийн мэдээлэл
                </h5>
                {isOwner && !editing && (
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => setEditing(true)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {editing ? (
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Хэрэглэгчийн нэр</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={editForm.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">И-мэйл</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Утасны дугаар</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      maxLength="8"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Байршил</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={editForm.location}
                      onChange={handleInputChange}
                      placeholder="Улаанбаатар, Дархан..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Танилцуулга</label>
                    <textarea
                      className="form-control"
                      name="bio"
                      value={editForm.bio}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Өөрийгөө товч танилцуулна уу..."
                      maxLength="500"
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-fill">
                      <i className="fas fa-save me-2"></i>Хадгалах
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary flex-fill"
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          username: profile.username || '',
                          email: profile.email || '',
                          phone: profile.phone || '',
                          location: profile.location || '',
                          bio: profile.bio || ''
                        });
                      }}
                    >
                      Цуцлах
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {/* Profile Avatar */}
                  <div className="text-center mb-4 pt-3">
                    <div className="d-inline-flex align-items-center justify-content-center"
                         style={{ 
                           width: '120px', 
                           height: '120px',
                           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                           borderRadius: '50%',
                           boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                         }}>
                      <i className="fas fa-user fa-3x text-white"></i>
                    </div>
                    <h3 className="mt-4 mb-2 fw-bold">{profile.username}</h3>
                    <span className="badge bg-light text-muted px-3 py-2" style={{ fontSize: '0.85rem' }}>
                      <i className="fas fa-calendar-alt me-2"></i>Элссэн: {formatJoinDate(profile.createdAt)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-envelope text-primary me-3"></i>
                      <span>{profile.email}</span>
                    </div>
                    
                    {profile.phone && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-phone text-success me-3"></i>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    
                    {profile.location && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-map-marker-alt text-danger me-3"></i>
                        <span>
                          {typeof profile.location === 'string' ? 
                            profile.location : 
                            profile.location ? `${profile.location.city || ''}, ${profile.location.district || ''}` : 'Тодорхойлоогүй'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div className="mb-3">
                      <h6 className="text-muted">Танилцуулга</h6>
                      <p className="text-dark">{profile.bio}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="border-end">
                        <h5 className="text-primary mb-0">{userItems.length}</h5>
                        <small className="text-muted">Зарласан</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <h5 className="text-success mb-0">
                        {userItems.filter(item => item.status === 'traded').length}
                      </h5>
                      <small className="text-muted">Солигдсон</small>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isOwner && (
                    <div className="mt-4 d-grid">
                      <Link to="/add-item" className="btn btn-success">
                        <i className="fas fa-plus me-2"></i>Шинэ зар нэмэх
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Items Section */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <h5 className="mb-0">
                <i className="fas fa-boxes me-2"></i>
                {isOwner ? 'Миний зарууд' : `${profile.username}-ийн зарууд`} 
                <span className="badge bg-light text-dark ms-2">{userItems.length}</span>
              </h5>
            </div>

            <div className="card-body">
              {itemsLoading ? (
                <div className="text-center py-5">
                  <i className="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                  <p className="text-muted">Зарууд ачаалж байна...</p>
                </div>
              ) : userItems.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                  <h6>Одоогоор зар байхгүй байна</h6>
                  {isOwner && (
                    <Link to="/add-item" className="btn btn-success mt-3">
                      <i className="fas fa-plus me-2"></i>Эхний зараа нэмэх
                    </Link>
                  )}
                </div>
              ) : (
                <div className="row g-4">
                  {userItems.map(item => (
                    <div key={item._id} className="col-xl-6 col-lg-6 col-md-12">
                      <ItemCard item={item} currentUser={currentUser} isOwner={isOwner} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;