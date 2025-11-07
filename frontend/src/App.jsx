import { useState, useEffect } from "react";
import './App.css';

const API_URL = "http://localhost:8000";

function App() {
  // States for messages and form inputs
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(1);

  // States for comments
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  // States for menu
  const [showMenu, setShowMenu] = useState({});

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Create new message
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/messages/?owner_id=${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      });

      if (response.ok) {
        setMessageText("");
        fetchMessages();
      } else {
        console.error("Error to create message:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating message:", error);
    }
  };

  // Handle Ctrl+Enter in textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmitMessage(e);
    }
  };

  const handleSubmitComment = async (e, messageId) => {
    e.preventDefault();

    const currentCommentText = commentText[messageId];
    if (!currentCommentText || !currentCommentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/messages/${messageId}/comments/?owner_id=${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentCommentText }),
      });

      if (response.ok) {
        setCommentText(prev => ({ ...prev, [messageId]: "" }));
        fetchMessages();
      } else {
        console.error("Error to create comment:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const toggleCommentsVisibility = (messageId) => {
    setShowComments(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const toggleMenu = (messageId) => {
    setShowMenu(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`${API_URL}/messages/${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMessages();
        setShowMenu(prev => ({ ...prev, [messageId]: false }));
      } else {
        console.error("Error deleting message:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 10) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {  // undefined = automatic locale
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="App">
      <h1>Threads</h1>

      <div className="content-column">
        <form onSubmit={handleSubmitMessage} className="message-form">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="What's on your mind?"
            rows="3"
          />
          <div className="form-actions">
            <button type="submit" disabled={!messageText.trim()}>
              Post
            </button>
          </div>
        </form>

        <ul className="message-list">
          {messages.map((message) => (
            <li key={message.id} className="message-card">
              <div className="message-header">
                <img
                  src={message.owner.avatar_url || `https://ui-avatars.com/api/?name=${message.owner.username}&background=random`}
                  alt={`avatar for ${message.owner.username}`}
                  className="avatar"
                />
                <div className="user-info">
                  <strong>{message.owner.username}</strong>
                  <span className="timestamp">{formatDate(message.timestamp)}</span>
                </div>

                {/* Menu with three dots */}
                <div className="message-menu">
                  <button className="menu-btn" onClick={() => toggleMenu(message.id)}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {showMenu[message.id] && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleDeleteMessage(message.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="message-text">{message.text}</p>

              <div className="message-actions">
                {/* Button for likes */}
                <button className="action-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>0</span>
                </button>

                {/* Button for comments */}
                <button
                  className="action-btn"
                  onClick={() => toggleCommentsVisibility(message.id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span>{message.comments.length}</span>
                </button>
              </div>

              {showComments[message.id] && (
                <div className="comments-section">
                  <h3>Comments</h3>
                  {message.comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <img
                        src={comment.owner.avatar_url || `https://ui-avatars.com/api/?name=${comment.owner.username}&background=random`}
                        alt={`avatar for ${comment.owner.username}`}
                        className="avatar-small"
                      />
                      <div className="comment-content">
                        <strong>{comment.owner.username}</strong>
                        <span className="timestamp">{formatDate(comment.timestamp)}</span>
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  <div className="add-comment">
                    <input
                      type="text"
                      value={commentText[message.id] || ""}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [message.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitComment(e, message.id);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => handleSubmitComment(e, message.id)}
                      disabled={!commentText[message.id]?.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;