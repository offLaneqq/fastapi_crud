const Header = ({ isAuthenticated, currentUsername, onLogout, onLoginClick }) => {
    return (
<header className="app-header">
    <h1>Threads</h1>
    {isAuthenticated ? (
        <div className="user-section">
            <span>Welcome, {currentUsername}!</span>
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