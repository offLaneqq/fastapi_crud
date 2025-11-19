const AuthModal = ({
    onClose,
    onLogin,
    onRegister,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

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
                    <form onSubmit={onLogin} className="auth-form">
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
                    <form onSubmit={onRegister} className="auth-form">
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