import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  // States for editing posts
  const [showComments, setShowComments] = useState({});
  const [showMenu, setShowMenu] = useState({});

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
    if (!text.trim()) return;

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
        await fetchPosts();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error creating post:", error);
      return { success: false };
    }
  };

  const createComment = async (postId, text) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/replies`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        await fetchPosts();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error creating comment:", error);
      return { success: false };
    }
  };

  const updatePost = async (postId, text) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}?new_text=${encodeURIComponent(text)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchPosts();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error updating post:", error);
      return { success: false };
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return { success: false, cancelled: true };
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok || response.status === 204) {
        await fetchPosts();
        setShowMenu(prev => ({ ...prev, [postId]: false }));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error deleting post:", error);
      return { success: false };
    }
  };

  const toggleLike = async (postId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchPosts();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error toggling like:", error);
      return { success: false };
    }
  };

  const toggleCommentsVisibility = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleMenu = (postId) => {
    setShowMenu(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return {
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
  };
};