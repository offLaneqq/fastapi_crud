import { formatDate } from '../utils/dateFormatter';

const CommentSection = ({
    post,
    isAuthenticated,
    commentText,
    setCommentText,
    onToggleLike,
    onSubmitComment,
}) => {
    return (
        <div className="comments-section">
            <h3>Comments</h3>
            {post.replies?.map((reply) => (
                <div key={reply.id} className="comment">
                    <img
                        src={reply.owner.avatar_url || `https://ui-avatars.com/api/?name=${reply.owner.username}&background=random`}
                        alt={`avatar for ${reply.owner.username}`}
                        className="avatar-small"
                    />
                    <div className="comment-content">
                        <div className="comment-header">
                            <strong>{reply.owner.username}</strong>
                            <span className="timestamp">{formatDate(reply.timestamp)}</span>
                        </div>
                        <p>{reply.text}</p>
                        <div className="comment-actions">
                            <button
                                className={`comment-like-btn ${reply.is_liked_by_user ? 'liked' : ''}`}
                                onClick={() => onToggleLike(reply.id)}
                            >
                                <svg viewBox="0 0 24 24" fill={reply.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {isAuthenticated && (
                <div className="add-comment">
                    <input
                        type="text"
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onSubmitComment(e, post.id);
                            }
                        }}
                    />
                    <button
                        onClick={(e) => onSubmitComment(e, post.id)}
                        disabled={!commentText[post.id]?.trim()}
                    >
                        Post
                    </button>
                </div>
            )}
        </div>
    );
}

export default CommentSection;