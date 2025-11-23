import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { formatDate } from "../utils/dateFormatter";

const API_URL = "http://localhost:8000";

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
  handleToggleLike,
  handleSubmitComment
}) => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // posts | comments

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random&size=128`}
          alt={profile.username}
          className="profile-avatar"
        />
        <div className="profile-info">
          <h1>{profile.username}</h1>
          <p className="profile-email">{profile.email}</p>
          <div className="profile-stats">
            <span>{profile.posts_count} Posts</span>
            <span>{profile.comments_count} Comments</span>
          </div>
          {currentUserId === profile.id && (
            <button className="edit-profile-btn">Edit Profile</button>
          )}
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
                showComments={showComments}
                showMenu={showMenu}
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
    </div>
  );
};

export default ProfilePage;