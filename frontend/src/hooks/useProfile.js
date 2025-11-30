import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = "http://localhost:8000";

export const useProfile = (userId) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', parseInt(userId)],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  const toggleLike = useMutation({
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
      await queryClient.cancelQueries(['profile', parseInt(userId)]);
      const previousProfile = queryClient.getQueryData(['profile', parseInt(userId)]);

      queryClient.setQueryData(['profile', parseInt(userId)], (old) => {
        if (!old?.posts) return old;

        return {
          ...old,
          posts: old.posts.map(post =>
            post.id === postId
              ? {
                ...post,
                is_liked_by_user: !post.is_liked_by_user,
                likes_count: post.is_liked_by_user
                  ? post.likes_count - 1
                  : post.likes_count + 1
              }
              : post
          ),
        };
      });

      return { previousProfile };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['profile', parseInt(userId)], (old) => {
        if (!old?.posts) return old;

        return {
          ...old,
          posts: old.posts.map(post =>
            post.id === result.postId
              ? {
                ...post,
                is_liked_by_user: result.is_liked_by_user,
                likes_count: result.likes_count
              }
              : post
          ),
        };
      });

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
    },
    onError: (err, postId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', parseInt(userId)], context.previousProfile);
      }
      console.error('Error toggling like:', err);
    },
  });

  return {
    profile,
    isLoading,
    error,
    toggleLike,
  };
};