import { useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { formatDate } from "../utils/dateFormatter";
import { useProfile } from "../hooks/useProfile";
import { getAvatarUrl } from "../utils/avatarColor";
import EditProfileModal from '../components/EditProfileModal';
import '../styles/ProfilePage.css';

const ProfilePage = ({
  isAuthenticated,
  currentUserId,
  showComments,
  showMenu,
  commentText,
  setCommentText,
  toggleCommentsVisibility,
  toggleMenu,
  handleDeletePost,
  handleEditPost,
  handleSubmitComment
}) => {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);

  const { profile, isLoading, error: profileError, toggleLike } = useProfile(userId);

  const handleToggleLike = async (postId) => {
    await toggleLike.mutateAsync(postId);
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (profileError || !profile) {
    return <div className="error">User not found</div>;
  }

  const isOwnProfile = isAuthenticated && parseInt(userId) === parseInt(currentUserId);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={getAvatarUrl(profile.username, 80)}
          alt={profile.username}
          className="profile-avatar"
        />
        <div className="profile-info">
          <div className="profile-name-section">
            <h1>{profile.username}</h1>
            {isOwnProfile && (
              <button
                className="edit-profile-btn"
                onClick={() => setShowEditModal(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          <div className="profile-stats">
            <div className="stat">
              <strong>{profile.posts?.length || 0}</strong>
              <span>posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          Posts ({profile.posts_count})
        </button>
        <button
          className={activeTab === "comments" ? "active" : ""}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({profile.comments_count})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === "posts" ? (
          <ul className="message-list">
            {profile.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                commentText={commentText}
                setCommentText={setCommentText}
                showComments={showComments || {}}
                showMenu={showMenu || {}}
                onToggleComments={toggleCommentsVisibility}
                onToggleMenu={toggleMenu}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                onToggleLike={handleToggleLike}
                onSubmitComment={handleSubmitComment}
              />
            ))}
            {profile.posts.length === 0 && (
              <p className="no-content">No posts yet</p>
            )}
          </ul>
        ) : (
          <ul className="comments-list">
            {profile.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-context">
                  Replied on post by <strong>{comment.owner?.username || 'Unknown'}</strong>
                </div>
                <div className="comment-content">
                  <p>{comment.text}</p>
                  <span className="timestamp">{formatDate(comment.timestamp)}</span>
                </div>
              </div>
            ))}
            {profile.comments.length === 0 && (
              <p className="no-content">No comments yet</p>
            )}
          </ul>
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          currentUser={{
            username: profile.username,
            email: profile.email,
            avatar_url: profile.avatar_url
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;