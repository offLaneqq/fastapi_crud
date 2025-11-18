import { useState, useEffect } from "react";
import './App.css';
import Header from "./components/Header";
import PostForm from "./components/PostForm";
import AuthModal from "./components/AuthModal";

const API_URL = "http://localhost:8000";

function App() {

  const { isAuthenticated, currentUserId, currentUsername, login, register, logout } = useAuth();
  const {
    posts,
    fetchPosts,
    createPost,
    toggleCommentsVisibility,
    toggleMenu,
    deletePost,
    handleEditPost,
    handleToggleLike,
    handleSubmitComment,
    updatePost
  } = usePosts();

  const [postText, setPostText] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [showMenu, setShowMenu] = useState({});


  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    const result = await login(email, password);
    if (result.success) {
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
      fetchPosts();
    } else {
      setAuthError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");

    const result = await register(username, email, password);
    if (result.success) {
      setShowAuthModal(false);
      setUsername("");
      setEmail("");
      setPassword("");
      fetchPosts();
    } else {
      setAuthError(result.error);
    }

  };

  const handleLogout = () => {
    logout();
    fetchPosts();
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