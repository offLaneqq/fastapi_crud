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
          posts: old.posts.map(post => {
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
          }),
        };
      });

      return { previousProfile };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['profile', parseInt(userId)], (old) => {
        if (!old?.posts) return old;

        return {
          ...old,
          posts: old.posts.map(post => {
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
          }),
        };
      });

      queryClient.setQueryData(['posts'], (old) => {
        if (!Array.isArray(old)) return old;

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