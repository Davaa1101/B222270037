import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white" style={{ boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)', minHeight: '70px' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <Link className="navbar-brand" to={getUserHomeUrl()} style={{
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          <i className="fas fa-exchange-alt me-2" style={{ color: '#667eea' }}></i>Солилцоо
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto ms-4">
            <li className="nav-item">
              <Link className="nav-link px-3 py-2" to={getUserHomeUrl()} style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}>
                <i className="fas fa-home me-2"></i>Нүүр хуудас
              </Link>
            </li>
          </ul>
          
          {!user ? (
            <ul className="navbar-nav">
              <li className="nav-item me-2">
                <Link className="btn btn-outline-primary px-4 py-2" to="/login" style={{
                  borderRadius: '25px',
                  fontWeight: '500',
                  border: '2px solid #667eea',
                  color: '#667eea'
                }}>
                  <i className="fas fa-sign-in-alt me-2"></i>Нэвтрэх
                </Link>
              </li>
              <li className="nav-item">
                <Link className="btn text-white px-4 py-2" to="/signup" style={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '500'
                }}>
                  <i className="fas fa-user-plus me-2"></i>Бүртгүүлэх
                </Link>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav">
              <li className="nav-item dropdown me-2">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center px-3 py-2"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: unreadCount > 0 ? '#fff3cd' : 'rgba(102, 126, 234, 0.08)',
                    color: '#333',
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
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
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
                      <i className="fas fa-plus me-3 text-success"></i>Зар нийтлэх
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
    </nav>
  );
};

export default Navbar;