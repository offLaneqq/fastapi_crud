import { formatDate } from '../utils/dateFormatter';
import { getAvatarUrl } from '../utils/avatarColor';
import CommentSection from './CommentSection';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import '../styles/PostCard.css';

const PostCard = ({
  post,
  currentUserId,
  isAuthenticated,
  showComments = {}, // ✅ Default value
  showMenu = {}, // ✅ Default value
  commentText = {}, // ✅ Default value
  setCommentText = () => { }, // ✅ Default value
  onToggleComments = () => { }, // ✅ Default value
  onToggleMenu = () => { }, // ✅ Default value
  isDetailView = false,
  onEditPost = () => { }, // ✅ Default value
  onDeletePost = () => { }, // ✅ Default value
  onToggleLike = () => { }, // ✅ Default value
  onSubmitComment = () => { } // ✅ Default value
}) => {
  const isOwner = isAuthenticated && currentUserId === post.owner.id;
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handlePostClick = (e) => {
    // Prevent navigation when clicking on interactive elements
    if (
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.closest('.menu') ||
      e.target.closest('.message-menu') ||
      e.target.closest('.comment-section') || // ✅ Prevent navigation when clicking in comment section
      e.target.closest('input') || // ✅ Prevent navigation when clicking input
      e.target.closest('textarea') || // ✅ Prevent navigation when clicking textarea
      isDetailView
    ) {
      return;
    }

    navigate(`/post/${post.id}`);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (showMenu[post.id]) {
          onToggleMenu(post.id);
        }
      }
    };

    if (showMenu[post.id]) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, post.id, onToggleMenu]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showMenu[post.id]) {
        onToggleMenu(post.id);
      }
    };

    if (showMenu[post.id]) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu, post.id, onToggleMenu]);

  const handleReport = () => {
    if (window.confirm('Report this post for violating community guidelines?')) {
      alert('Post reported. Thank you for keeping our community safe.');
      onToggleMenu(post.id);
    }
  };

  return (
    <li className="message-card" onClick={handlePostClick}>
      <div className="message-header">
        <Link to={`/profile/${post.owner.id}`} className="post-author">
          <img
            src={getAvatarUrl(post.owner.username, 32, post.owner.avatar_url)}
            alt={post.owner.username}
            className="comment-avatar"
          />
          <strong>{post.owner.username}</strong>
        </Link>
        <div className='header-right-section'>
          <div className="timestamp">{formatDate(post.timestamp)}</div>

          {isAuthenticated && (
            <div className="message-menu" ref={menuRef}>
              <button
                className="menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu(post.id);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {showMenu[post.id] && (
                <div className="dropdown-menu">
                  {isOwner ? (
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPost(post);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePost(post.id);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReport();
                      }}
                      className="report-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                      </svg>
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="message-text">{post.text}</p>

      {
        post.image_url && (
          <div className='post-image'>
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${post.image_url}`}
              alt="Post visual content"
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          </div>
        )
      }

      <div className="message-actions">
        <button
          className={`action-btn ${post.is_liked_by_user ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(post.id);
          }}
        >
          <svg viewBox="0 0 24 24" fill={post.is_liked_by_user ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{post.likes_count}</span>
        </button>

        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComments(post.id);
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span>{post.replies?.length || 0}</span>
        </button>
      </div>

      {showComments && showComments[post.id] && (
        <CommentSection
          post={post}
          isAuthenticated={isAuthenticated}
          commentText={commentText}
          setCommentText={setCommentText}
          onToggleLike={onToggleLike}
          onSubmitComment={onSubmitComment}
        />
      )}
    </li>
  );
};

export default PostCard;