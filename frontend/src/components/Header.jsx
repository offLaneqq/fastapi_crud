import { Link } from 'react-router-dom';
import { getAvatarUrl } from '../utils/avatarColor';
import { useQuery } from '@tanstack/react-query';

const API_URL = "http://localhost:8000";

const Header = ({ isAuthenticated, currentUsername, currentUserId, onLogout, onLoginClick }) => {
    
    const {data: currentUser} = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) return null;

            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) return null;
            return response.json();
        },
        enabled: isAuthenticated
    })

    const avatarUrl = getAvatarUrl(currentUsername, 40, currentUser?.avatar_url);

    return (
        <header className="app-header">
            <div className='header-left'>
                <Link to="/" className="logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="logo-icon">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient1)"/>
                        <path d="M2 17L12 22L22 17V7L12 12V22" fill="url(#gradient2)"/>
                        <defs>
                            <linearGradient id="gradient1" x1="2" y1="7" x2="22" y2="7">
                                <stop offset="0%" stopColor="#667eea"/>
                                <stop offset="100%" stopColor="#764ba2"/>
                            </linearGradient>
                            <linearGradient id="gradient2" x1="12" y1="12" x2="12" y2="22">
                                <stop offset="0%" stopColor="#f093fb"/>
                                <stop offset="100%" stopColor="#f5576c"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1 className="logo-text">Threads</h1>
                </Link>
            </div>

            <div className='header-right'>
                {isAuthenticated ? (
                    <div className="user-section">
                        <Link to={`/profile/${currentUserId}`} className="profile-link">
                            <img
                                src={avatarUrl}
                                alt={currentUsername}
                                className="user-avatar"
                            />
                            <span className="username">{currentUsername}</span>
                        </Link>
                        <button onClick={onLogout} className="logout-btn">Logout</button>
                    </div>
                ) : (
                    <button onClick={onLoginClick} className="login-btn">
                        Login
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;