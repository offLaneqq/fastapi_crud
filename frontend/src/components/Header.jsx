import { Link } from 'react-router-dom';

const Header = ({ isAuthenticated, currentUsername, currentUserId, onLogout, onLoginClick }) => {
    return (
        <header className="app-header">
            <Link to="/" className="logo">
                <h1>Threads</h1>
            </Link>
            {isAuthenticated ? (
                <div className="user-section">
                    <Link to={`/profile/${currentUserId}`} className="profile-link">
                        {currentUsername}
                    </Link>
                    <button onClick={onLogout} className="logout-btn">Logout</button>
                </div>
            ) : (
                <button onClick={onLoginClick} className="login-btn">
                    Login / Register
                </button>
            )}
        </header>
    );
};

export default Header;