import React from 'react';
import { Link } from 'react-router-dom';

const ItemCard = ({ item, currentUser, isOwner }) => {
  // Check if current user owns this item
  const isItemOwner = isOwner || (currentUser && (currentUser.id === item.owner?._id || currentUser._id === item.owner?._id));
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Өчигдөр';
    if (diffDays === 0) return 'Өнөөдөр';
    if (diffDays <= 7) return `${diffDays} хоногийн өмнө`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} долоо хоногийн өмнө`;
    
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'active':
        return <span className="badge bg-success">Идэвхтэй</span>;
      case 'traded':
        return <span className="badge bg-info">Солигдсон</span>;
      case 'inactive':
        return <span className="badge bg-secondary">Идэвхгүй</span>;
      default:
        return <span className="badge bg-primary">Шинэ</span>;
    }
  };

  const truncateDescription = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <Link to={`/item/${item._id}`} className="text-decoration-none">
      <div className="card h-100 border-0" style={{
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
      }}>
        
        {/* Item Image */}
        <div className="position-relative">
        {item.images && item.images.length > 0 ? (
          <div className="position-relative" style={{ height: '220px', overflow: 'hidden' }}>
            <img
              src={typeof item.images[0] === 'string' ? item.images[0] : (item.images[0].url || item.images[0])}
              alt={item.title}
              className="w-100 h-100"
              style={{
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"><div class="text-center text-white"><i class="fas fa-image fa-3x mb-2 opacity-50"></i><div class="small">Зураг ачаалагдсангүй</div></div></div>';
              }}
            />
            <div className="position-absolute top-0 start-0 w-100 h-100" 
                 style={{
                   background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 100%)'
                 }}></div>
          </div>
        ) : (
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '220px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <div className="text-center text-white">
              <i className="fas fa-camera fa-3x mb-2 opacity-50"></i>
              <div className="small">Зураг байхгүй</div>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="position-absolute top-0 end-0 m-3">
          <div style={{ backdropFilter: 'blur(10px)', borderRadius: '20px' }}>
            {getStatusBadge()}
          </div>
        </div>

        {/* Multiple Images Indicator */}
        {item.images && item.images.length > 1 && (
          <div className="position-absolute bottom-0 end-0 p-2">
            <span className="badge bg-dark bg-opacity-75">
              <i className="fas fa-images me-1"></i>
              {item.images.length}
            </span>
          </div>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        {/* Item Title */}
        <h6 className="card-title fw-bold mb-2" style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {item.title}
        </h6>

        {/* Item Description */}
        <p className="card-text text-muted small mb-3 flex-grow-1">
          {truncateDescription(item.description)}
        </p>

        {/* Item Details */}
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <span className="badge text-white me-2" 
                  style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem'
                  }}>
              <i className="fas fa-tags me-1"></i>
              {item.category}
            </span>
          </div>
          
          {item.location && (
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-map-marker-alt text-danger me-2"></i>
              <small className="text-muted">
                {typeof item.location === 'string' ? item.location : `${item.location.city}, ${item.location.district}`}
              </small>
            </div>
          )}

          <div className="d-flex align-items-center">
            <i className="fas fa-calendar text-info me-2"></i>
            <small className="text-muted">{formatDate(item.createdAt)}</small>
          </div>
        </div>

        {/* Looking For Section */}
        {(item.lookingFor || item.wantedItems?.description) && (
          <div className="mb-3 p-2 bg-light rounded">
            <small className="text-muted">
              <i className="fas fa-search me-1"></i>
              <strong>Хайж байна:</strong> {truncateDescription(item.lookingFor || item.wantedItems?.description, 60)}
            </small>
          </div>
        )}

        {/* User Info and Action Button */}
        <div className="mt-auto">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="me-2" style={{
                width: '36px', 
                height: '36px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-user text-white"></i>
              </div>
              <div>
                <div className="small text-muted">Зарласан</div>
                <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                  {item.owner?.name || item.owner?.username || 'Хэрэглэгч'}
                </div>
              </div>
            </div>

            <Link
              to={isItemOwner ? `/edit-item/${item._id}` : `/item/${item._id}`}
              className="btn btn-sm text-white"
              style={{ 
                background: isItemOwner ? 'linear-gradient(45deg, #28a745, #20c997)' : 'linear-gradient(45deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = isItemOwner ? '0 4px 15px rgba(40, 167, 69, 0.4)' : '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className={`fas ${isItemOwner ? 'fa-edit' : 'fa-eye'} me-1`}></i>
              {isItemOwner ? 'Засварлах' : 'Үзэх'}
            </Link>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default ItemCard;