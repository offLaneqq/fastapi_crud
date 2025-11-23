import { useState } from "react";
import PostForm from "../components/PostForm";
import PostCard from "../components/PostCard";

const HomePage = ({
  isAuthenticated,
  currentUserId,
  posts,
  showComments,
  showMenu,
  commentText,
  setCommentText,
  toggleCommentsVisibility,
  toggleMenu,
  handleDeletePost,
  handleEditPost,
  handleToggleLike,
  handleSubmitComment,
  postText,
  setPostText,
  handleSubmitPost
}) => {
  return (
    <div className="content-column">
      {isAuthenticated && (
        <PostForm
          postText={postText}
          setPostText={setPostText}
          onSubmit={handleSubmitPost}
        />
      )}

      <ul className="message-list">
        {posts.map((post) => (
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
      </ul>
    </div>
  );
};

export default HomePage;