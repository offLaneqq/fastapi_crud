import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { formatDate } from "../utils/dateFormatter";
import { useProfile } from "../hooks/useProfile";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState("posts"); // posts | comments
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { profile, isLoading, error: profileError, refetch } = useProfile(userId);

  useEffect(() => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedEmail(profile.email);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");

      const updateData = {};
      if (editedUsername !== profile.username) {
        updateData.username = editedUsername;
      }
      if (editedEmail !== profile.email) {
        updateData.email = editedEmail;
      }

      if(Object.keys(updateData).length === 0) {
        setIsSaving(false);
        setIsEditing(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;

        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          queryClient.invalidateQueries(['currentUser']);
        }

        setIsEditing(false);
        
        queryClient.setQueryData(['profile', userId], (oldData) => ({
          ...oldData,
          username: updatedUser.username,
          email: updatedUser.email,
        }));
        queryClient.setQueryData(['currentUser'], (oldData) => ({
          ...oldData,
          username: updatedUser.username,
          email: updatedUser.email,
        }));
        queryClient.invalidateQueries(['posts']);
      } else {
        const errorData = await response.json();
        setFormError(errorData.detail || "Failed to update profile");
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUsername(profile.username);
    setEditedEmail(profile.email);
    setFormError("");
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (profileError || !profile) {
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
          {isEditing ? (
            <input
              type="text"
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              className="profile-input"
              placeholder={profile.username}
            />
          ) : (
            <h1>{profile.username}</h1>
          )}
          {isEditing ? (
            <input
              type="email"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="profile-input"
              placeholder={profile.email}
            />
          ) : (
            <p className="profile-email">{profile.email}</p>
          )}

          {formError && <p className="error-message">{formError}</p>}

          {currentUserId === profile.id && (
            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button
                    className="save-profile-btn"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-profile-btn"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
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