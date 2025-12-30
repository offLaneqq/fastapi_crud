import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import '../styles/PostDetailPage.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function PostDetailPage({
    isAuthenticated,
    currentUserId,
    commentText,
    setCommentText,
    handleDeletePost,
    handleEditPost,
    handleSubmitComment,
    handleToggleLike
}) {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState({});

    const toggleMenu = (id) => {
        setShowMenu(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['post', parseInt(postId)],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};

            const response = await fetch(`${API_URL}/posts/${postId}`, { headers });
            if (!response.ok) {
                if (response.status === 404) throw new Error('Post not found');
                throw new Error('Failed to fetch post');
            }
            return response.json();
        },
        enabled: !!postId,
    });

    if (isLoading) {
        return (
            <div className="post-detail-page">
                <div className="loading">Loading post...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post-detail-page">
                <div className="error">
                    <h2>Post not found</h2>
                    <button onClick={() => navigate('/')}>← Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-detail-page">
            <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
            </button>

            <div className="post-detail-container">
                <PostCard
                    post={post}
                    isAuthenticated={isAuthenticated}
                    currentUserId={currentUserId}
                    showMenu={showMenu}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onToggleMenu={toggleMenu}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                    onToggleLike={handleToggleLike}
                    isDetailView={true}
                />

                <div className="comments-section">
                    <h3>Comments ({post.replies?.length || 0})</h3>

                    <CommentSection
                        post={post}
                        isAuthenticated={isAuthenticated}
                        currentUserId={currentUserId}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        onSubmitComment={handleSubmitComment}
                        onToggleLike={handleToggleLike}
                        isAlwaysOpen={true}
                    />
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;