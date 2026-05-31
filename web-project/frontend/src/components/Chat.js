import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { offerService } from '../services/offerService';
import Alert from './Alert';

const Chat = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const messagesEndRef = useRef(null);
  const isFetchingRef = useRef(false);
  const pollingRef = useRef(null);
  
  const [offer, setOffer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadOfferAndMessages();

    pollingRef.current = setInterval(() => {
      loadMessages({ silent: true });
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [offerId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOfferAndMessages = async () => {
    try {
      setLoading(true);
      
      // Load offer details
      const offerData = await offerService.getOffer(offerId);
      
      if (offerData.status !== 'accepted' && offerData.status !== 'completed') {
        setAlert({ message: 'Зөвхөн зөвшөөрөгдсөн санал дээр чат хийх боломжтой', type: 'warning' });
        setTimeout(() => navigate('/offers'), 2000);
        return;
      }
      
      setOffer(offerData);
      
      // Load messages
      await loadMessages();
    } catch (error) {
      console.error('Error loading offer:', error);
      setAlert({ message: 'Мэдээлэл ачаалахад алдаа гарлаа', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const normalizeMessage = (msg) => ({
    id: msg._id || msg.id,
    senderId: msg.sender?._id || msg.sender,
    senderName: msg.sender?.name || msg.senderName || '',
    content: msg.content || msg.message || '',
    timestamp: msg.timestamp || msg.createdAt || msg.sentAt
  });

  const areMessagesSame = (prevMessages, nextMessages) => {
    if (prevMessages.length !== nextMessages.length) return false;
    const prevLast = prevMessages[prevMessages.length - 1];
    const nextLast = nextMessages[nextMessages.length - 1];
    if (!prevLast && !nextLast) return true;
    if (!prevLast || !nextLast) return false;
    return (
      prevLast.senderId === nextLast.senderId &&
      prevLast.content === nextLast.content &&
      String(prevLast.timestamp) === String(nextLast.timestamp)
    );
  };

  const loadMessages = async ({ silent = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await chatService.getMessages(offerId);
      const normalized = Array.isArray(data) ? data.map(normalizeMessage) : [];
      setMessages((prev) => (areMessagesSame(prev, normalized) ? prev : normalized));
      await chatService.markAsRead(offerId);
    } catch (error) {
      if (!silent) {
        console.error('Error loading messages:', error);
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        senderId: user.id || user._id,
        senderName: user.name || '',
        content: newMessage,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      await chatService.sendMessage(offerId, newMessage);

      setNewMessage('');
      await loadMessages({ silent: true });
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert({ message: 'Мессеж илгээхэд алдаа гарлаа', type: 'error' });
      await loadMessages({ silent: true });
    } finally {
      setSending(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm('Та солилцоо дууссан гэж батлах уу?')) return;
    
    try {
      await offerService.completeOffer(offerId);
      
      setAlert({ message: 'Солилцоо амжилттай дууслаа!', type: 'success' });
      setTimeout(() => navigate('/offers'), 2000);
    } catch (error) {
      console.error('Error marking complete:', error);
      setAlert({ message: 'Алдаа гарлаа', type: 'error' });
    }
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

  if (!offer) return null;

  const otherUser = offer.offeredBy._id === (user.id || user._id) ? offer.offeredTo : offer.offeredBy;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1000px', height: 'calc(100vh - 100px)' }}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: '20px' }}>
        {/* Chat Header */}
        <div className="card-header border-0" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="me-3" style={{
                width: '45px',
                height: '45px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-user fa-lg"></i>
              </div>
              <div>
                <h5 className="mb-0">{otherUser.name}</h5>
                <small>Зарлалын талаар: {offer.item.title}</small>
              </div>
            </div>
            <div>
              <button
                className="btn btn-light btn-sm me-2"
                onClick={() => navigate('/offers')}
              >
                <i className="fas fa-arrow-left me-2"></i>Буцах
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={handleMarkComplete}
              >
                <i className="fas fa-check me-2"></i>Дуусгах
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="card-body flex-grow-1 overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="fas fa-comments fa-3x mb-3"></i>
              <h5>Анхны мессежээ илгээнэ үү</h5>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMyMessage = msg.senderId === (user.id || user._id);
              return (
                <div
                  key={msg.id || index}
                  className={`d-flex mb-3 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div style={{ maxWidth: '70%' }}>
                    {!isMyMessage && (
                      <small className="text-muted d-block mb-1">{msg.senderName}</small>
                    )}
                    <div
                      className={`p-3 rounded ${isMyMessage ? 'bg-primary text-white' : 'bg-light'}`}
                      style={{
                        borderRadius: isMyMessage ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                      }}
                    >
                      <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                      <small className={`d-block mt-2 ${isMyMessage ? 'text-white-50' : 'text-muted'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('mn-MN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="card-footer border-0 bg-white" style={{ borderRadius: '0 0 20px 20px', padding: '1rem 1.5rem' }}>
          <form onSubmit={handleSendMessage}>
            <div className="input-group">
              <textarea
                className="form-control"
                placeholder="Мессеж бичих..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows="2"
                disabled={sending}
                style={{ resize: 'none', borderRadius: '15px' }}
              />
              <button
                type="submit"
                className="btn text-white ms-2"
                disabled={sending || !newMessage.trim()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '15px',
                  minWidth: '100px'
                }}
              >
                {sending ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>Илгээх
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

export default Chat;
