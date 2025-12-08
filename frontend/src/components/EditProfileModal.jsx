import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatarColor';
import '../styles/EditProfileModal.css';

const API_URL = "http://localhost:8000";

const EditProfileModal = ({ currentUser, onClose }) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload avatar');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Avatar updated!', { icon: '✨' });
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['profile']);
      setSelectedFile(null);
      setPreview(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload avatar');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete avatar');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Avatar removed', { icon: '🗑️' });
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['profile']);
      setPreview(null);
      setSelectedFile(null);
    },
    onError: () => {
      toast.error('Failed to delete avatar');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Перевірка типу
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Перевірка розміру (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Показати превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove your avatar?')) {
      deleteMutation.mutate();
    }
  };

  const currentAvatar = preview || 
    (currentUser.avatar_url ? `${API_URL}${currentUser.avatar_url}` : null) || 
    getAvatarUrl(currentUser.username, 200);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-preview">
              <img src={currentAvatar} alt="Profile avatar" />
            </div>
            
            <div className="avatar-actions">
              <label htmlFor="avatar-input" className="change-avatar-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Change Photo
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {currentUser.avatar_url && (
                <button
                  className="remove-avatar-btn"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleteMutation.isPending ? 'Removing...' : 'Remove Photo'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-info">
            <div className="info-item">
              <label>Username</label>
              <div className="info-value">{currentUser.username}</div>
            </div>

            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{currentUser.email}</div>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;