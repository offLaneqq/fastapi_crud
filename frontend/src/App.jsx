import { useState, useEffect } from "react";
import './App.css';

const API_URL = "http://localhost:8000";

function App() {
  // States for messages and form inputs
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(1);

  // States for comments
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  // States for menu
  const [showMenu, setShowMenu] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // Create new post
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/posts/?owner_id=${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: postText }),
      });

      if (response.ok) {
        setPostText("");
        fetchPosts();
      } else {
        console.error("Error creating post:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // Handle Ctrl+Enter in textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmitPost(e);
    }
  };

  const handleSubmitComment = async (e, postId) => {
    e.preventDefault();

    const currentCommentText = commentText[postId];
    if (!currentCommentText || !currentCommentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/replies?owner_id=${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentCommentText }),
      });

      if (response.ok) {
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        fetchPosts();
      } else {
        console.error("Error creating comment:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const toggleCommentsVisibility = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleMenu = (postId) => {
    setShowMenu(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        fetchPosts();
        setShowMenu(prev => ({ ...prev, [postId]: false }));
      } else {
        console.error("Error deleting post:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like?user_id=${currentUserId}`, {
        method: "POST",
      });

      if (response.ok) {
        fetchPosts();
      } else {
        console.error("Error toggling like:", response.statusText);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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
        <form onSubmit={handleSubmitPost} className="message-form">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="What's on your mind?"
            rows="3"
          />
          <div className="form-actions">
            <button type="submit" disabled={!postText.trim()}>
              Post
            </button>
          </div>
        </form>

        <ul className="message-list">
          {posts.map((post) => (
            <li key={post.id} className="message-card">
              <div className="message-header">
                <img
                  src={post.owner.avatar_url || `https://ui-avatars.com/api/?name=${post.owner.username}&background=random`}
                  alt={`avatar for ${post.owner.username}`}
                  className="avatar"
                />
                <div className="user-info">
                  <strong>{post.owner.username}</strong>
                  <span className="timestamp">{formatDate(post.timestamp)}</span>
                </div>

                {/* Menu with three dots */}
                <div className="message-menu">
                  <button className="menu-btn" onClick={() => toggleMenu(post.id)}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {showMenu[post.id] && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleDeletePost(post.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="message-text">{post.text}</p>

              <div className="message-actions">
                {/* Button for likes */}
                <button 
                  className={`action-btn ${post.is_liked_by_user ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(post.id)}
                >
                  <svg viewBox="0 0 24 24" fill={post.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{post.likes_count}</span>
                </button>

                {/* Button for comments */}
                <button
                  className="action-btn"
                  onClick={() => toggleCommentsVisibility(post.id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span>{post.replies?.length || 0}</span>
                </button>
              </div>

              {showComments[post.id] && (
                <div className="comments-section">
                  <h3>Comments</h3>
                  {post.replies?.map((reply) => (
                    <div key={reply.id} className="comment">
                      <img
                        src={reply.owner.avatar_url || `https://ui-avatars.com/api/?name=${reply.owner.username}&background=random`}
                        alt={`avatar for ${reply.owner.username}`}
                        className="avatar-small"
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <strong>{reply.owner.username}</strong>
                          <span className="timestamp">{formatDate(reply.timestamp)}</span>
                        </div>
                        <p>{reply.text}</p>
                        <div className="comment-actions">
                          <button 
                            className={`comment-like-btn ${reply.is_liked_by_user ? 'liked' : ''}`}
                            onClick={() => handleToggleLike(reply.id)}
                          >
                            <svg viewBox="0 0 24 24" fill={reply.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="add-comment">
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitComment(e, post.id);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => handleSubmitComment(e, post.id)}
                      disabled={!commentText[post.id]?.trim()}
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