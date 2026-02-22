import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../utils/api';
import './Forum.css';

const Forum = ({ eventId, userRole, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/forum/${eventId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/forum/${eventId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          parentMessage: replyTo,
          isAnnouncement: isAnnouncement
        })
      });

      if (response.ok) {
        setNewMessage('');
        setReplyTo(null);
        setIsAnnouncement(false);
        fetchMessages();
        toast.success('Message posted!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to post message');
      }
    } catch (error) {
      console.error('Error posting message:', error);
      toast.error('Error posting message');
    }
  };

  const handleReact = async (messageId, reactionType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/forum/messages/${messageId}/react`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType })
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handlePin = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/forum/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMessages();
        toast.success('Message pinned/unpinned');
      }
    } catch (error) {
      console.error('Error pinning:', error);
      toast.error('Error pinning message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/forum/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMessages();
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error deleting message');
    }
  };

  const getReactionCount = (message, type) => {
    return message.reactions?.filter(r => r.type === type).length || 0;
  };

  const hasUserReacted = (message, type) => {
    return message.reactions?.some(r => r.user === userId && r.type === type);
  };

  const getReplies = (parentId) => {
    return messages.filter(m => m.parentMessage?._id === parentId);
  };

  const renderMessage = (message, isReply = false) => (
    <div key={message._id} className={`forum-message ${isReply ? 'reply' : ''} ${message.isAnnouncement ? 'announcement' : ''} ${message.isPinned ? 'pinned' : ''}`}>
      {message.isPinned && <span className="pin-badge">📌 Pinned</span>}
      {message.isAnnouncement && <span className="announcement-badge">📢 Announcement</span>}
      
      <div className="message-header">
        <div className="message-author">
          <strong>{message.author?.name || message.author?.clubName}</strong>
          {message.author?.rollNumber && <span className="roll-number">({message.author.rollNumber})</span>}
        </div>
        <span className="message-time">
          {new Date(message.createdAt).toLocaleString()}
        </span>
      </div>

      {message.parentMessage && (
        <div className="reply-context">
          Replying to <strong>{message.parentMessage.author?.name}</strong>
        </div>
      )}

      <div className="message-content">{message.message}</div>

      <div className="message-actions">
        <div className="reactions">
          <button 
            className={`reaction-btn ${hasUserReacted(message, 'like') ? 'active' : ''}`}
            onClick={() => handleReact(message._id, 'like')}
          >
            👍 {getReactionCount(message, 'like')}
          </button>
          <button 
            className={`reaction-btn ${hasUserReacted(message, 'love') ? 'active' : ''}`}
            onClick={() => handleReact(message._id, 'love')}
          >
            ❤️ {getReactionCount(message, 'love')}
          </button>
          <button 
            className={`reaction-btn ${hasUserReacted(message, 'helpful') ? 'active' : ''}`}
            onClick={() => handleReact(message._id, 'helpful')}
          >
            ✅ {getReactionCount(message, 'helpful')}
          </button>
          <button 
            className={`reaction-btn ${hasUserReacted(message, 'question') ? 'active' : ''}`}
            onClick={() => handleReact(message._id, 'question')}
          >
            ❓ {getReactionCount(message, 'question')}
          </button>
        </div>

        <div className="action-buttons">
          {!isReply && (
            <button className="btn-small" onClick={() => setReplyTo(message._id)}>
              Reply
            </button>
          )}
          
          {userRole === 'organizer' && (
            <>
              <button className="btn-small" onClick={() => handlePin(message._id)}>
                {message.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button className="btn-small btn-danger" onClick={() => handleDelete(message._id)}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Render replies */}
      {!isReply && getReplies(message._id).length > 0 && (
        <div className="replies">
          {getReplies(message._id).map(reply => renderMessage(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="forum-loading">Loading forum...</div>;
  }

  return (
    <div className="forum-container">
      <h3>💬 Discussion Forum</h3>

      {/* Post new message */}
      <form className="message-form" onSubmit={handlePostMessage}>
        {replyTo && (
          <div className="reply-indicator">
            Replying to a message
            <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={replyTo ? "Write your reply..." : "Start a discussion or ask a question..."}
          rows="3"
        />
        
        <div className="form-actions">
          {userRole === 'organizer' && !replyTo && (
            <label className="announcement-checkbox">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
              />
              Post as announcement
            </label>
          )}
          
          <button type="submit" className="btn-primary">
            {replyTo ? 'Reply' : 'Post Message'}
          </button>
        </div>
      </form>

      {/* Messages list */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the discussion!</p>
          </div>
        ) : (
          messages
            .filter(m => !m.parentMessage) // Only show top-level messages
            .map(message => renderMessage(message))
        )}
      </div>
    </div>
  );
};

export default Forum;
