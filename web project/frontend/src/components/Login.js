import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Alert from './Alert';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setAlert({ message: 'Бүх талбарыг бөглөнө үү', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(formData.email, formData.password);
      
      if (data.user && data.token) {
        login(data.user, data.token);
        setAlert({ message: 'Амжилттай нэвтэрлээ!', type: 'success' });
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Нэвтрэх үед алдаа гарлаа';
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
        maxWidth: '480px', 
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
            <i className="fas fa-exchange-alt fa-2x"></i>
          </div>
          <h2 className="mb-2 fw-bold">Нэвтрэх</h2>
          <p className="mb-0 opacity-90">Солилцооны платформ-д тавтай морилно уу</p>
        </div>
        
        <div className="card-body" style={{ padding: '2.5rem' }}>
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
          
          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-4">
              <input
                type="email"
                className="form-control form-control-lg"
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
            
            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                name="password"
                placeholder="Нууц үг"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
              />
              <label htmlFor="password">
                <i className="fas fa-lock me-2"></i>Нууц үг
              </label>
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
                  <i className="fas fa-spinner fa-spin me-2"></i>Нэвтэрч байна...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>Нэвтрэх
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="mb-0">
              Бүртгэлгүй юу? 
              <Link to="/signup" className="text-primary fw-bold ms-1">Бүртгүүлэх</Link>
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

export default Login;