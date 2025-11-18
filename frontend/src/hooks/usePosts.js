import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export const usePosts = () => {
  const [posts, setPosts] = useState([]);

  // States for editing posts
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

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

  // Create new post
  const createPost = async (text) => {
    if (!text.trim() || !isAuthenticated) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        fetchPosts();
        return { success: true };
      } else {
        console.error("Error creating post:", response.statusText);
        return { success: false };
      }
    } catch (error) {
      console.error("Error creating post:", error);
      return { success: false };
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

  const deletePost = async (postId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok || response.status === 204) {
        await fetchPosts();
        return { success: true };
      } else {
        console.error("Error deleting post:", response.statusText);
        return { success: false };
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      return { success: false };
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

  const updatePost = async (postId, text) => {
    e.preventDefault();
    if (!editingPost || !editText.trim()) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}?new_text=${encodeURIComponent(text)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchPosts();
        return { success: true };
      } else {
        console.error("Error updating post:", response.statusText);
        return { success: false };
      }
    } catch (error) {
      console.error("Error updating post:", error);
      return { success: false };
    }
  };

  return {
    posts,
    fetchPosts,
    createPost,
    handleSubmitComment,
    toggleCommentsVisibility,
    toggleMenu,
    deletePost,
    handleToggleLike,
    handleEditPost,
    updatePost
  };
}