import { useQuery } from '@tanstack/react-query';

const API_URL = "http://localhost:8000";

export const useProfile = (userId) => {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: !!userId, // Виконати тільки якщо є userId
  });

  return {
    profile,
    isLoading,
    error
  };
};