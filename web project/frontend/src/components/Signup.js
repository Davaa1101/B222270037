import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Alert from './Alert';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
      setAlert({ message: 'Бүх талбарыг бөглөнө үү', type: 'warning' });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ message: 'Нууц үг таарахгүй байна', type: 'error' });
      return false;
    }

    if (formData.password.length < 6) {
      setAlert({ message: 'Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой', type: 'warning' });
      return false;
    }

    // Phone number validation (Mongolian format)
    const phoneRegex = /^[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setAlert({ message: 'Утасны дугаар буруу байна (8 орон)', type: 'warning' });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlert({ message: 'И-мэйл хаяг буруу байна', type: 'warning' });
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
      const signupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      };

      const data = await authService.signup(signupData);
      
      if (data.user && data.token) {
        login(data.user, data.token);
        setAlert({ message: 'Амжилттай бүртгэгдлээ!', type: 'success' });
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || 'Бүртгэл үүсгэх үед алдаа гарлаа';
      setAlert({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div className="card border-0" style={{ 
        maxWidth: '520px', 
        width: '100%',
        borderRadius: '25px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
      }}>
        <div className="card-header text-center border-0" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '25px 25px 0 0',
          padding: '2.5rem 2rem'
        }}>
          <div className="mb-3" style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-user-plus fa-2x"></i>
          </div>
          <h2 className="mb-2 fw-bold">Бүртгүүлэх</h2>
          <p className="mb-0 opacity-90">Солилцооны платформ-д нэгдээрэй</p>
        </div>
        
        <div className="card-body" style={{ padding: '2.5rem' }}>
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    placeholder="Хэрэглэгчийн нэр"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                  />
                  <label htmlFor="username">
                    <i className="fas fa-user me-2 text-primary"></i>Нэр
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    placeholder="Утасны дугаар"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    maxLength="8"
                    style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                  />
                  <label htmlFor="phone">
                    <i className="fas fa-phone me-2 text-primary"></i>Утас (8 орон)
                  </label>
                </div>
              </div>
            </div>

            <div className="form-floating my-3">
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                placeholder="И-мэйл"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
              <label htmlFor="email">
                <i className="fas fa-envelope me-2 text-primary"></i>И-мэйл хаяг
              </label>
            </div>
            
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Нууц үг"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    minLength="6"
                    style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                  />
                  <label htmlFor="password">
                    <i className="fas fa-lock me-2 text-primary"></i>Нууц үг
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Нууц үг баталгаажуулах"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                  />
                  <label htmlFor="confirmPassword">
                    <i className="fas fa-lock me-2 text-primary"></i>Баталгаажуулах
                  </label>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '25px',
                height: '50px',
                fontWeight: 500
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>Бүртгүүлж байна...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>Бүртгүүлэх
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="mb-0">
              Бүртгэлтэй юу? 
              <Link to="/login" className="text-primary fw-bold ms-1">Нэвтрэх</Link>
            </p>
          </div>

          <div className="text-center mt-3">
            <Link to="/" className="text-muted">
              <i className="fas fa-arrow-left me-1"></i>Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;