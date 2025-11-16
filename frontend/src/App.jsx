import { useState, useEffect } from "react";
import './App.css';
import Header from "./components/Header";
import PostForm from "./components/PostForm";
import AuthModal from "./components/AuthModal";

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
      <Header
        isAuthenticated={isAuthenticated}
        currentUsername={currentUsername}
        handleLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
      />

      <div className="content-column">
        {isAuthenticated && (
          <PostForm
            postText={postText}
            setPostText={setPostText}
            onSubmit={handleSubmitPost}
          />
        )}

        <ul className="message-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              commentText={commentText}
              setCommentText={setCommentText}
              showComments={showComments}
              toggleCommentsVisibility={toggleCommentsVisibility}
              toggleMenu={toggleMenu}
              showMenu={showMenu}
              onDeletePost={handleDeletePost}
              onEditPost={handleEditPost}
              onToggleLike={handleToggleLike}
              onSubmitComment={handleSubmitComment}
            />
          ))}
        </ul>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          authMode={authMode}
          setAuthMode={setAuthMode}
          authError={authError}
          setAuthError={setAuthError}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          username={username}
          setUsername={setUsername}
        />
      )}
    </div>
  );
}

export default App;