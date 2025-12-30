import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import '../styles/AvatarUpload.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AvatarUpload = ({ currentUser, onClose }) => {
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
    onSuccess: (data) => {
      toast.success('Avatar uploaded!', { icon: '✨' });
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['posts']);
      onClose();
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
      toast.success('Avatar deleted', { icon: '🗑️' });
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['posts']);
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to delete avatar');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Chechk file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Show preview
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
    if (confirm('Are you sure you want to delete your avatar?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="avatar-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Avatar</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="avatar-preview">
          <img
            src={preview || currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.username}&background=random`}
            alt="Avatar preview"
          />
        </div>

        <div className="avatar-actions">
          <label htmlFor="avatar-input" className="upload-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
            </svg>
            Choose Photo
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {selectedFile && (
            <button
              className="save-btn"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Save'}
            </button>
          )}

          {currentUser.avatar_url && (
            <button
              className="delete-btn"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Avatar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;