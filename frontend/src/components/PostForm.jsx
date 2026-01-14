import { useState, useRef } from 'react';
import '../styles/PostForm.css';

const PostForm = ({ onSubmit, currentUserId, disabled = false }) => {

    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showFullScreen, setShowFullScreen] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (jpg, png, gif).');
                return;
            }

            // Validation for file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB.');
                return;
            }

            setImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !image) return;

        await onSubmit(text, image);
        setText('');
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
            e.preventDefault();
            onSubmit(text, image);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="message-form">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                disabled={disabled || !currentUserId}
                rows="3"
            />

            {imagePreview && (
                <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" onClick={() => setShowFullScreen(true)} />
                    <button type="button" className="remove-image-button" onClick={handleRemoveImage}>✕</button>
                </div>
            )}

            <div className="form-actions">
                <input
                    type='file'
                    accept="image/png, image/jpeg, image/gif, image/jpg"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    disabled={disabled || !currentUserId}
                />
                <button
                    type="button"
                    className='image-upload-btn'
                    disabled={disabled || !currentUserId}
                    onClick={() => fileInputRef.current?.click()}
                    title={image ? 'Change image' : 'Add image'}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                </button>
                <button className='submit-button' type="submit" disabled={disabled || !text.trim()}>
                    Post
                </button>
            </div>

            {showFullScreen && imagePreview && (
                <div
                    className="image-fullscreen-modal"
                    onClick={() => setShowFullScreen(false)}
                >
                    <button
                        className='close-fullscreen-btn'
                        onClick={() => setShowFullScreen(false)}
                    >✕</button>
                    <img src={imagePreview} alt="Full Screen Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </form>
    );
};

export default PostForm;