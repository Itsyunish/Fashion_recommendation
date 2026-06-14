import { useRef, useState, useCallback } from 'react';

export default function DropZone({ onFileSelect, accept = 'image/*' }) {
  const fileInputRef = useRef(null);
  const [hasImage, setHasImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFiles = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setHasImage(true);
      onFileSelect(file);
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files[0]);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragover(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e) => {
    if (e.target.files.length) handleFiles(e.target.files[0]);
  }, [handleFiles]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    setHasImage(false);
    setPreview(null);
    setFileName('');
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onFileSelect]);

  return (
    <>
      <div
        className={`drop-zone ${dragover ? 'dragover' : ''} ${hasImage ? 'has-image' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--primary)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </div>
        <p>Drag & drop an image, or <span className="link">browse</span></p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        hidden
        onChange={handleChange}
      />
      {hasImage && preview && (
        <div className="preview-container" style={{ display: 'block' }}>
          <img src={preview} alt={fileName} />
        </div>
      )}
    </>
  );
}
