const PostForm = ({ postText, setPostText, onSubmit }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
            e.preventDefault();
            onSubmit(e);
        }
    };
    return (
        <form onSubmit={onSubmit} className="message-form">
            <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                rows="3"
            />
            <div className="form-actions">
                <button type="submit" disabled={!postText.trim()}>
                    Post
                </button>
            </div>
        </form>
    );
};

export default PostForm;