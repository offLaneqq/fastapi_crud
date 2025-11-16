const Header = ({ isAuthenticated, currentUsername, handleLogout, setShowAuthModal }) => {
    return (
<header className="app-header">
    <h1>Threads</h1>
    {isAuthenticated ? (
        <div className="user-section">
            <span>Welcome, {currentUsername}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
    ) : (
        <button onClick={() => setShowAuthModal(true)} className="login-btn">
            Login / Register
        </button>
    )}
</header>
    );
};

export default Header;