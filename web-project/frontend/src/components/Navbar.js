import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import SearchSection from './SearchSection';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const data = await notificationService.getNotifications({ limit: 5 });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, [user]);

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error('Failed to open notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserHomeUrl = () => {
    return '/';
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleOverlaySearch = (searchParams) => {
    const query = new URLSearchParams();

    if (searchParams.search) query.set('search', searchParams.search);
    if (searchParams.category) query.set('category', searchParams.category);
    if (searchParams.location) query.set('location', searchParams.location);
    if (searchParams.sortBy) query.set('sortBy', searchParams.sortBy);

    setIsSearchOpen(false);
    navigate(query.toString() ? `/?${query.toString()}` : '/');
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white" style={{ boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)', minHeight: '70px' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <Link className="navbar-brand" to={getUserHomeUrl()} style={{
          background: 'linear-gradient(135deg, #1f6f43 0%, #2c7a7b 62%, #c79a2a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          <i className="fas fa-exchange-alt me-2" style={{ color: '#1f6f43' }}></i>Солилцоо
        </Link>
        <div className="navbar-title-block d-none d-lg-flex flex-column text-center">
          <span className="navbar-title-text">Онлайн Солилцооны Платформ</span>
          <small className="navbar-subtitle-text">Өөрт хэрэггүй зүйлсээ хэрэгтэй зүйлсээр солилцоорой</small>
        </div>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* search button (moved to right for layout) */}
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-0">
            <li className="nav-item">
              <Link className="nav-link px-3 py-2 text-white" to={getUserHomeUrl()} style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #1f6f43 0%, #2c7a7b 62%, #c79a2a 100%)',
                color: 'white',
                padding: '0.45rem 1rem'
              }}>
                <i className="fas fa-home me-2"></i>Нүүр хуудас
              </Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-2 ms-auto">
          {!user ? (
            <ul className="navbar-nav flex-row align-items-center">
              <li className="nav-item me-2">
                <Link className="btn btn-outline-primary px-4 py-2" to="/login" style={{
                  borderRadius: '25px',
                  fontWeight: '500',
                  border: '2px solid #1f6f43',
                  color: '#1f6f43'
                }}>
                  <i className="fas fa-sign-in-alt me-2"></i>Нэвтрэх
                </Link>
              </li>
              <li className="nav-item">
                <Link className="btn text-white px-4 py-2" to="/signup" style={{
                  background: 'linear-gradient(135deg, #1f6f43 0%, #2c7a7b 62%, #c79a2a 100%)',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '500'
                }}>
                  <i className="fas fa-user-plus me-2"></i>Бүртгүүлэх
                </Link>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav flex-row align-items-center">
              <li className="nav-item dropdown me-2">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center px-3 py-2"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: unreadCount > 0 ? '#fff3cd' : 'rgba(31, 111, 67, 0.08)',
                    color: 'white',
                    borderRadius: '25px',
                    fontWeight: '500'
                  }}
                >
                  <i className="fas fa-bell me-2"></i>Мэдэгдэл
                  {unreadCount > 0 && (
                    <span className="badge bg-danger ms-2">{unreadCount}</span>
                  )}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" style={{
                  borderRadius: '15px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  minWidth: '320px',
                  maxWidth: '380px'
                }}>
                  <li className="px-3 pt-2 pb-1 d-flex justify-content-between align-items-center">
                    <strong>Сүүлийн мэдэгдлүүд</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-sm btn-link p-0" onClick={handleMarkAllRead}>
                        Бүгдийг уншсан
                      </button>
                    )}
                  </li>
                  <li><hr className="dropdown-divider my-2" /></li>
                  {notifications.length === 0 ? (
                    <li className="px-3 py-2 text-muted">Мэдэгдэл алга</li>
                  ) : (
                    notifications.map((notification) => (
                      <li key={notification._id}>
                        <button
                          className={`dropdown-item py-3 px-4 text-start ${notification.read ? '' : 'fw-bold'}`}
                          onClick={() => handleOpenNotification(notification)}
                          style={{ whiteSpace: 'normal' }}
                        >
                          <div>{notification.title}</div>
                          <small className="text-muted">{notification.message}</small>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </li>

              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle d-flex align-items-center px-3 py-2" 
                  href="#" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: 'linear-gradient(135deg, #1f6f43 0%, #2c7a7b 62%, #c79a2a 100%)',
                    color: 'white',
                    borderRadius: '25px',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  <div className="me-2" style={{
                    width: '32px', 
                    height: '32px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-user"></i>
                  </div>
                  {user.name || 'Хэрэглэгч'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" style={{
                  borderRadius: '15px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  minWidth: '220px'
                }}>
                  <li>
                    <Link 
                      className="dropdown-item py-3 px-4" 
                      to={`/profile/${user.id || user._id}`}
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-user me-3 text-primary"></i>Профайл
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item py-3 px-4" 
                      to="/add-item"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-plus me-3 text-success"></i>Зарлал нийтлэх
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item py-3 px-4" 
                      to="/offers"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-envelope me-3 text-info"></i>Миний саналууд
                    </Link>
                  </li>
                  {user.role === 'admin' && (
                    <>
                      <li>
                        <Link 
                          className="dropdown-item py-3 px-4" 
                          to="/admin/reports"
                          style={{ borderRadius: '10px' }}
                        >
                          <i className="fas fa-flag me-3 text-warning"></i>Админ тайлан
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider my-2" /></li>
                    </>
                  )}
                  <li><hr className="dropdown-divider my-2" /></li>
                  <li>
                    <button 
                      className="dropdown-item py-3 px-4 text-danger" 
                      onClick={handleLogout}
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-sign-out-alt me-3"></i>Гарах
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 ms-3">
          <button
            type="button"
            className="btn btn-outline-primary px-4 py-2"
            onClick={handleOpenSearch}
            aria-label="Хайх"
            style={{
              borderRadius: '25px',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-search me-2"></i>Хайх
          </button>
        </div>
      </div>

      {isSearchOpen && createPortal(
        <div className="search-overlay" onClick={handleCloseSearch} role="dialog" aria-modal="true" aria-label="Хайлт">
          <div className="search-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-1 fw-bold">Хайлт</h4>
                <small className="text-muted">Зарлалыг ангилал, байршил, түлхүүр үгээр шүүнэ</small>
              </div>
              <button type="button" className="btn btn-sm btn-light" onClick={handleCloseSearch}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <SearchSection onSearch={handleOverlaySearch} onClear={handleCloseSearch} compact />
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;