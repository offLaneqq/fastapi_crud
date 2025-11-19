import { useState } from "react";
import './App.css';
import Header from "./components/Header";
import PostForm from "./components/PostForm";
import AuthModal from "./components/AuthModal";
import PostCard from "./components/PostCard";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";
import EditPostModal from "./components/EditPostModal";

function App() {
  const { isAuthenticated, currentUserId, currentUsername, login, register, logout } = useAuth();
  const {
    posts,
    showComments,
    showMenu,
    fetchPosts,
    createPost,
    createComment,
    updatePost,
    deletePost,
    toggleLike,
    toggleCommentsVisibility,
    toggleMenu
  } = usePosts();

  // UI states
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

  // Handlers
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const result = await createPost(postText);
    if (result.success) {
      setPostText("");
    }
  };

  const handleSubmitComment = async (e, postId) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const currentCommentText = commentText[postId];
    if (!currentCommentText?.trim()) return;

    const result = await createComment(postId, currentCommentText);
    if (result.success) {
      setCommentText(prev => ({ ...prev, [postId]: "" }));
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditText(post.text);
    setShowEditModal(true);
    toggleMenu(post.id); // Close menu
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost || !editText.trim()) return;

    const result = await updatePost(editingPost.id, editText);
    if (result.success) {
      setShowEditModal(false);
      setEditingPost(null);
      setEditText("");
    } else {
      alert("Error updating post");
    }
  };

  const handleDeletePost = async (postId) => {
    await deletePost(postId);
  };

  const handleToggleLike = async (postId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    await toggleLike(postId);
  };

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
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
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
              showMenu={showMenu}
              onToggleComments={toggleCommentsVisibility}
              onToggleMenu={toggleMenu}
              onDeletePost={handleDeletePost}
              onEditPost={handleEditPost}
              onToggleLike={handleToggleLike}
              onSubmitComment={handleSubmitComment}
            />
          ))}
        </ul>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
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

      {showEditModal && (
        <EditPostModal
          onClose={() => setShowEditModal(false)}
          editText={editText}
          setEditText={setEditText}
          onUpdate={handleUpdatePost}
        />
      )}
    </div>
  );
}

export default App;