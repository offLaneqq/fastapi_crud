import { useState, useEffect } from "react";
import './App.css';

const API_URL = "http://localhost:8000";

function App() {
  // States for messages and form inputs
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");

  // States for editing posts
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"

  // Auth form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // States for comments
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [showMenu, setShowMenu] = useState({});
  const [currentUsername, setCurrentUsername] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser(token);
    }
    fetchPosts();
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUserId(user.id);
        setCurrentUsername(user.username);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      localStorage.removeItem("token");
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await fetch(`${API_URL}/posts/`, { headers });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        await fetchCurrentUser(data.access_token);
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        fetchPosts();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === "string") {
          setAuthError(errorData.detail);
        } else {
          setAuthError("Login failed");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setAuthError("Network error. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const formData = new URLSearchParams();
        formData.append("email", email);
        formData.append("password", password);

        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          localStorage.setItem("token", data.access_token);
          await fetchCurrentUser(data.access_token);
          setShowAuthModal(false);
          setUsername("");
          setEmail("");
          setPassword("");
          fetchPosts();
        } else {
          const error = await loginResponse.json();
          if (typeof error.detail === "string") {
            setAuthError(error.detail);
          } else {
            setAuthError("Login after registration failed");
          }
        }
      } else {
        const error = await response.json();
        if (typeof error.detail === "string") {
          setAuthError(error.detail);
        } else {
          setAuthError("Registration failed");
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setAuthError("Network error. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentUsername("");
    setCurrentUserId(null);
    fetchPosts();
  }

  // Create new post
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim() || !isAuthenticated) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      handleSubmitPost(e);
    }
  };

  const handleSubmitComment = async (e, postId) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const currentCommentText = commentText[postId];
    if (!currentCommentText || !currentCommentText.trim()) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
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

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
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

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditText(post.text);
    setShowEditModal(true);
    setShowMenu(prev => ({ ...prev, [post.id]: false })); // Close menu
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost || !editText.trim()) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${editingPost.id}?new_text=${encodeURIComponent(editText)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingPost(null);
        setEditText("");
        fetchPosts();
      } else {
        console.error("Error updating post:", response.statusText);
        alert("Error updating post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Threads</h1>
        {isAuthenticated ? (
          <div className="user-section">
            <span>Welcome, {currentUsername}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className="login-btn">
            Login / Register
          </button>
        )}
      </header>

      <div className="content-column">
        {isAuthenticated && (
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
        )}

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

                {isAuthenticated && currentUserId === post.owner.id && (
                  <div className="message-menu">
                    <button className="menu-btn" onClick={() => toggleMenu(post.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {showMenu[post.id] && (
                      <div className="dropdown-menu">
                        <button onClick={() => handleEditPost(post)}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                          Edit
                        </button>
                        <button onClick={() => handleDeletePost(post.id)}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {showEditModal && (
                  <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>

                      <h2>Edit Post</h2>

                      <form onSubmit={handleUpdatePost} className="auth-form">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="What's on your mind?"
                          rows="5"
                          required
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" disabled={!editText.trim()}>
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            style={{ background: '#737373' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <p className="message-text">{post.text}</p>

              <div className="message-actions">
                <button
                  className={`action-btn ${post.is_liked_by_user ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(post.id)}
                >
                  <svg viewBox="0 0 24 24" fill={post.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{post.likes_count}</span>
                </button>

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

                  {isAuthenticated && (
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
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>

            <div className="auth-tabs">
              <button
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => { setAuthMode('login'); setAuthError(""); }}
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => { setAuthMode('register'); setAuthError(""); }}
              >
                Register
              </button>
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="auth-form">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Login</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="auth-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button type="submit">Register</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;