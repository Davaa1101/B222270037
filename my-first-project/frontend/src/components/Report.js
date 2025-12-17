import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import Alert from './Alert';

const Report = () => {
  const { targetType, targetId } = useParams(); // targetType: 'item', 'user', 'offer'
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    reportType: '',
    description: '',
    chatHistory: ''
  });
  
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const reportTypes = [
    { value: 'fraudulent_behavior', label: 'Хууран мэхлэх оролдлого' },
    { value: 'inappropriate_content', label: 'Зохисгүй зураг эсвэл тайлбар' },
    { value: 'prohibited_items', label: 'Хориотой бараа' },
    { value: 'spam', label: 'Давтан зар нийтлэх (спам)' },
    { value: 'no_response', label: 'Хариу өгөхгүй байх' },
    { value: 'harassment', label: 'Доромжлол эсвэл заналхийлэл' },
    { value: 'other', label: 'Бусад' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setAlert({ message: '5 хүртэл файл оруулах боломжтой', type: 'warning' });
      return;
    }
    setEvidenceFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportType || !formData.description) {
      setAlert({ message: 'Бүх талбарыг бөглөнө үү', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        targetType,
        targetId,
        reportType: formData.reportType,
        description: formData.description,
        chatHistory: formData.chatHistory
      };

      await reportService.createReport(reportData, evidenceFiles);

      setAlert({ 
        message: 'Таны гомдол хүлээн авлаа. Бид 24-48 цагийн дотор шалгаж хариу өгнө', 
        type: 'success' 
      });
      
      setTimeout(() => navigate(-1), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setAlert({ message: 'Гомдол илгээхэд алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
        <div className="card-header border-0" style={{
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 className="mb-0">
            <i className="fas fa-flag me-2"></i>Гомдол гаргах
          </h3>
        </div>
        
        <div className="card-body p-4">
          <div className="alert alert-warning" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Таны гомдол нууцлалтай хэвээр үлдэх бөгөөд зөвхөн админ үзнэ. Хуурамч гомдол гаргасан тохиолдолд таны данс хаагдах эрсдэлтэй.
          </div>

          <form onSubmit={handleSubmit}>
            {/* Report Type */}
            <div className="mb-4">
              <label className="form-label fw-bold">Гомдлын төрөл *</label>
              <select
                className="form-select"
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
                required
              >
                <option value="">Сонгох...</option>
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="form-label fw-bold">Дэлгэрэнгүй тайлбар *</label>
              <textarea
                className="form-control"
                name="description"
                rows="6"
                placeholder="Юу болсон, хэзээ болсон, ямар асуудалтай тулгарсан талаар дэлгэрэнгүй бичнэ үү..."
                value={formData.description}
                onChange={handleInputChange}
                maxLength={1000}
                required
              ></textarea>
              <small className="text-muted">{formData.description.length}/1000</small>
            </div>

            {/* Chat History */}
            <div className="mb-4">
              <label className="form-label fw-bold">Чатын түүх (заавал биш)</label>
              <textarea
                className="form-control"
                name="chatHistory"
                rows="4"
                placeholder="Холбоотой чатын харилцаа байвал энд хуулж оруулна уу..."
                value={formData.chatHistory}
                onChange={handleInputChange}
                maxLength={5000}
              ></textarea>
              <small className="text-muted">{formData.chatHistory.length}/5000</small>
            </div>

            {/* Evidence Files */}
            <div className="mb-4">
              <label className="form-label fw-bold">Нотлох баримт (5 хүртэл зураг)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <small className="text-muted d-block mt-2">
                Скриншот, зураг зэрэг нотлох баримтаа оруулна уу
              </small>
              {evidenceFiles.length > 0 && (
                <div className="mt-2">
                  <strong>{evidenceFiles.length} файл сонгогдсон</strong>
                  <ul className="list-unstyled mt-2">
                    {Array.from(evidenceFiles).map((file, index) => (
                      <li key={index} className="text-muted">
                        <i className="fas fa-file-image me-2"></i>{file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
                style={{ borderRadius: '10px' }}
              >
                <i className="fas fa-times me-2"></i>Цуцлах
              </button>
              
              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading}
                style={{ borderRadius: '10px' }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Илгээж байна...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>Гомдол илгээх
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

export default Report;
