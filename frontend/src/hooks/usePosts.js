import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = "http://localhost:8000";

export const usePosts = () => {
  const queryClient = useQueryClient();

  // States for editing posts
  const [showComments, setShowComments] = useState({});
  const [showMenu, setShowMenu] = useState({});

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await fetch(`${API_URL}/posts/`, { headers });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (text) => {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Error creating post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      const currentUserId = localStorage.getItem("user_id");
      if (currentUserId) {
        queryClient.invalidateQueries(['profile', parseInt(currentUserId)]);
      }
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, text }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/posts/${postId}?new_text=${encodeURIComponent(text)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error updating post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['profile', updatedPost.owner.id]);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!confirm("Are you sure you want to delete this post?")) {
        throw new Error('Cancelled');
      }
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) throw new Error('Error deleting post');
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries(['posts']);
      setShowMenu(prev => ({ ...prev, [postId]: false }));
      const currentUserId = localStorage.getItem("user_id");
      if (currentUserId) {
        queryClient.invalidateQueries(['profile', parseInt(currentUserId)]);
      }
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error toggling like');
      const data = await response.json();
      return { postId, ...data };
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries(['posts']);
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old) =>
        old?.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked_by_user: !post.is_liked_by_user,
                likes_count: post.is_liked_by_user 
                  ? post.likes_count - 1 
                  : post.likes_count + 1
              }
            : post
        )
      );

      return { previousPosts };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['posts'], (old) => {
        if (!Array.isArray(old)) return old;
        
        return old.map(post =>
          post.id === result.postId
            ? {
                ...post,
                is_liked_by_user: result.is_liked_by_user,
                likes_count: result.likes_count
              }
            : post
        );
      });
      
      // ✅ Invalidate тільки конкретний профіль
      const post = queryClient.getQueryData(['posts'])?.find(p => p.id === result.postId);
      if (post?.owner?.id) {
        queryClient.invalidateQueries(['profile', post.owner.id]);
      }
    },
    onError: (err, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      console.error('Error toggling like:', err);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, text }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Error creating comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);

      const posts = queryClient.getQueryData(['posts']);
      const post = posts?.find(p => p.id === data.postId);
      if (post) {
        queryClient.invalidateQueries(['profile', post.owner.id]);
      }
    }
  });

  const toggleCommentsVisibility = (postId) => {
    setShowComments((prev) => {
      if (prev[postId]) {
        return {};
      } else {
        return { [postId]: true };
      }
    });
  };

  const toggleMenu = (postId) => {
    setShowMenu(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return {
    posts,
    isLoading,
    showComments,
    showMenu,
    createPost: (text) => createPostMutation.mutateAsync(text),
    updatePost: ({ postId, text }) => updatePostMutation.mutateAsync({ postId, text }),
    deletePost: (postId) => deletePostMutation.mutateAsync(postId),
    toggleLike: (postId) => toggleLikeMutation.mutateAsync(postId),
    createComment: ({ postId, text }) => createCommentMutation.mutateAsync({ postId, text }),
    toggleCommentsVisibility,
    toggleMenu
  };
};