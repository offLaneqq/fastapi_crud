const AuthModal = ({
    showAuthModal,
    setShowAuthModal,
    handleLogin,
    handleRegister,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
}) => {
    if (!showAuthModal) return null;

    return (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>

                <div className="auth-tabs">
                    <button
                        className={authMode === 'login' ? 'active' : ''}
                        onClick={() => { setAuthMode('login'); setAuthError(""); }}
                    >
                        Login
                    </button>
                    <button
                        className={authMode === 'register' ? 'active' : ''}
                        onClick={() => { setAuthMode('register'); setAuthError(""); }}
                    >
                        Register
                    </button>
                </div>

                {authError && <div className="auth-error">{authError}</div>}

                {authMode === 'login' ? (
                    <form onSubmit={handleLogin} className="auth-form">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Login</button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password (min 8 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                        <button type="submit">Register</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;