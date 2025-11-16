const EditPostModal = ({
    editText,
    setEditText,
    handleUpdatePost,
    setShowEditModal
}) => (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            <h2>Edit Post</h2>

            <form onSubmit={handleUpdatePost} className="auth-form">
                <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="What's on your mind?"
                    rows="5"
                    required
                    autoFocus
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={!editText.trim()}>
                        Save Changes
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        style={{ background: '#737373' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default EditPostModal;