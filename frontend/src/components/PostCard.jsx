import { formatDate } from '../utils/dateFormatter';
import EditPostModal from './EditPostModal';

const PostCard = ({
    post,
    currentUserId,
    isAuthenticated,
    showComments,
    showMenu,
    commentText,
    setCommentText,
    toggleCommentsVisibility,
    toggleMenu,
    handleEditPost,
    handleDeletePost,
    handleToggleLike,
    handleSubmitComment
}) => {
    return (
    <li className="message-card">
        <div className="message-header">
            <img
                src={post.owner.avatar_url || `https://ui-avatars.com/api/?name=${post.owner.username}&background=random`}
                alt={`avatar for ${post.owner.username}`}
                className="avatar"
            />
            <div className="user-info">
                <strong>{post.owner.username}</strong>
                <span className="timestamp">{formatDate(post.timestamp)}</span>
            </div>

            {isAuthenticated && currentUserId === post.owner.id && (
                <div className="message-menu">
                    <button className="menu-btn" onClick={() => toggleMenu(post.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>

                    {showMenu[post.id] && (
                        <div className="dropdown-menu">
                            <button onClick={() => handleEditPost(post)}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                                Edit
                            </button>
                            <button onClick={() => handleDeletePost(post.id)}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showEditModal && (
                <EditPostModal
                    editText={editText}
                    setEditText={setEditText}
                    handleUpdatePost={handleUpdatePost}
                    setShowEditModal={setShowEditModal}
                />
            )}
        </div>

        <p className="message-text">{post.text}</p>

        <div className="message-actions">
            <button
                className={`action-btn ${post.is_liked_by_user ? 'liked' : ''}`}
                onClick={() => handleToggleLike(post.id)}
            >
                <svg viewBox="0 0 24 24" fill={post.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{post.likes_count}</span>
            </button>

            <button
                className="action-btn"
                onClick={() => toggleCommentsVisibility(post.id)}
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                <span>{post.replies?.length || 0}</span>
            </button>
        </div>

        {showComments[post.id] && (
            <CommentSection
                post={post}
                isAuthenticated={isAuthenticated}
                commentText={commentText}
                setCommentText={setCommentText}
                handleToggleLike={handleToggleLike}
                handleSubmitComment={handleSubmitComment}
            />
        )}
    </li>
    );
}

export default PostCard;