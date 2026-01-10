import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const usePosts = () => {
  const queryClient = useQueryClient();

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
    mutationFn: async ({ text, image }) => {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("text", text);
      if (image) {
        formData.append("image", image);
      }

      console.log('Sending post:', { text, hasImage: !!image }); // Debug log

      const response = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', JSON.stringify(errorData, null, 2)); // Better logging
        
        // Extract error message
        let errorMessage = 'Error creating post';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        }
        
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Post created!', { icon: '✨' });
      queryClient.invalidateQueries(['posts']);
      const currentUserId = localStorage.getItem("user_id");
      if (currentUserId) {
        queryClient.invalidateQueries(['profile', parseInt(currentUserId)]);
      }
    },
    onError: (error) => {
      console.error('Create post error:', error.message);
      toast.error(error.message || 'Failed to create post');
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
    onSuccess: (updatedPost) => {
      toast.success('Post updated!', { icon: '✏️' });
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
      toast.success('Post deleted', { icon: '🗑️' });
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
        old?.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked_by_user: !post.is_liked_by_user,
              likes_count: post.is_liked_by_user
                ? post.likes_count - 1
                : post.likes_count + 1
            };
          }


          if (post.replies?.length > 0) {
            const updatedReplies = post.replies.map(reply =>
              reply.id === postId
                ? {
                    ...reply,
                    is_liked_by_user: !reply.is_liked_by_user,
                    likes_count: reply.is_liked_by_user
                      ? reply.likes_count - 1
                      : reply.likes_count + 1
                  }
                : reply
            );

            if (updatedReplies.some((r, i) => r !== post.replies[i])) {
              return { ...post, replies: updatedReplies };
            }
          }

          return post;
        })
      );

      return { previousPosts };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['posts'], (old) => {
        if (!Array.isArray(old)) return old;

        if (result.is_liked_by_user) {
          toast.success('Liked!', {
            icon: '❤️',
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #ef4444',
            },
          });
        } else {
          toast('Unliked', {
            icon: '💔',
            style: {
              background: '#1a1a1a',
              color: '#888',
              border: '1px solid #333',
            },
          });
        }

        return old.map(post => {
          if (post.id === result.postId) {
            return {
              ...post,
              is_liked_by_user: result.is_liked_by_user,
              likes_count: result.likes_count
            };
          }

          if (post.replies?.length > 0) {
            const updatedReplies = post.replies.map(reply =>
              reply.id === result.postId
                ? {
                    ...reply,
                    is_liked_by_user: result.is_liked_by_user,
                    likes_count: result.likes_count
                  }
                : reply
            );

            if (updatedReplies.some((r, i) => r !== post.replies[i])) {
              return { ...post, replies: updatedReplies };
            }
          }

          return post;
        });
      });

      const post = queryClient.getQueryData(['posts'])?.find(p => p.id === result.postId);

      if (post?.owner?.id) {
        queryClient.setQueryData(['profile', post.owner.id], (old) => {
          if (!old?.posts) return old;

          return {
            ...old,
            posts: old.posts.map(p => {
              if (p.id === result.postId) {
                return {
                  ...p,
                  is_liked_by_user: result.is_liked_by_user,
                  likes_count: result.likes_count
                };
              }


              if (p.replies?.length > 0) {
                const updatedReplies = p.replies.map(reply =>
                  reply.id === result.postId
                    ? {
                        ...reply,
                        is_liked_by_user: result.is_liked_by_user,
                        likes_count: result.likes_count
                      }
                    : reply
                );

                if (updatedReplies.some((r, i) => r !== p.replies[i])) {
                  return { ...p, replies: updatedReplies };
                }
              }

              return p;
            })
          };
        });
      }
    },
    onError: (err, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      console.error('Error toggling like:', err);
      toast.error('Failed to toggle like', {
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #ef4444',
        },
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, text, image }) => {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("text", text);
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`${API_URL}/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Error creating comment');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Comment added!', { icon: '💬' });
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
    createPost: async (text, image) => {
      await createPostMutation.mutateAsync({ text, image });
      return { success: true };
    },
    updatePost: ({ postId, text }) => updatePostMutation.mutateAsync({ postId, text }),
    deletePost: (postId) => deletePostMutation.mutateAsync(postId),
    toggleLike: (postId) => toggleLikeMutation.mutateAsync(postId),
    createComment: async ({ postId, text, image }) => {
      try {
        await createCommentMutation.mutateAsync({ postId, text, image });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    toggleCommentsVisibility,
    toggleMenu
  };
};