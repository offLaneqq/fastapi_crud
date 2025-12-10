// Utility functions to generate avatar colors and URLs based on username

const API_URL = "http://localhost:8000";

export const getAvatarColor = (username) => {

  if (!username) return '667eea'; // Fallback color

  // ✅ Fixed hash function (simpler and more reliable)
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colors = [
    '667eea', // Purple
    '764ba2', // Dark Purple
    'f093fb', // Pink
    'f5576c', // Red
    '4facfe', // Light Blue
    '00f2fe', // Turquoise
    'fa709a', // Coral
    'fee140', // Yellow
    '30cfd0', // Mint
    'a8edea', // Light Turquoise
    'ff9a9e', // Peach
    'fecfef', // Light Pink
    'ff6b6b', // Tomato
    '4ecdc4', // Tiffany
    '45b7d1', // Sky
    'f38181', // Powder
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const getAvatarUrl = (username, size = 40, avatarPath = null) => {
  if (avatarPath) {
    return `${API_URL}${avatarPath}`;
  }
  
  const color = getAvatarColor(username);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${color}&color=fff&size=${size}&bold=true`;
};