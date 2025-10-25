import React, { useState, useCallback, useRef } from 'react';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { OptimizedImage } from '../ui/OptimizedImage';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

interface MediaUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesUploaded: (files: MediaFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  allowMultiple?: boolean;
  className?: string;
}

export const MediaUploadPanel: React.FC<MediaUploadPanelProps> = ({
  isOpen,
  onClose,
  onFilesUploaded,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  maxFileSize = 500,
  maxFiles = 10,
  allowMultiple = true,
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxFileSize;
    });

    if (validFiles.length !== fileArray.length) {
      // Handle size validation error
      console.warn(`Some files exceed the ${maxFileSize}MB limit`);
    }

    // Create media file objects
    const mediaFiles: MediaFile[] = validFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('video/') ? 'video' : 'document',
      size: file.size,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...mediaFiles]);

    // Process files
    mediaFiles.forEach(processFile);
  }, [maxFileSize]);

  const processFile = useCallback(async (mediaFile: MediaFile) => {
    try {
      // Simulate file processing
      mediaFile.status = 'processing';
      mediaFile.progress = 25;

      // Create preview for images/videos
      if (mediaFile.type === 'image') {
        const preview = await createImagePreview(mediaFile.file);
        mediaFile.preview = preview;
        mediaFile.metadata = await getImageMetadata(mediaFile.file);
      } else if (mediaFile.type === 'video') {
        const preview = await createVideoPreview(mediaFile.file);
        mediaFile.preview = preview;
        mediaFile.metadata = await getVideoMetadata(mediaFile.file);
      }

      mediaFile.progress = 75;

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      mediaFile.status = 'completed';
      mediaFile.progress = 100;

      setUploadedFiles(prev => [...prev]);
    } catch (error) {
      mediaFile.status = 'error';
      mediaFile.error = error instanceof Error ? error.message : 'Upload failed';
      setUploadedFiles(prev => [...prev]);
    }
  }, []);

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const createVideoPreview = async (file: File): Promise<string> => {
    // For video, we'll use a placeholder or extract first frame
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        // Create canvas to capture first frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = (video.videoHeight / video.videoWidth) * 160;

        video.currentTime = 1; // Seek to 1 second
        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        };
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const getImageMetadata = (file: File): Promise<{width: number, height: number, format: string}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: file.type.split('/')[1]
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const getVideoMetadata = (file: File): Promise<{duration: number, format: string}> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          format: file.type.split('/')[1]
        });
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleUploadComplete = useCallback(() => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    if (completedFiles.length > 0) {
      onFilesUploaded(completedFiles);
      onClose();
    }
  }, [uploadedFiles, onFilesUploaded, onClose]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <PhotoIcon className="w-8 h-8" />;
      case 'video': return <VideoCameraIcon className="w-8 h-8" />;
      default: return <DocumentIcon className="w-8 h-8" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'processing': return <ClockIcon className="w-5 h-5 text-blue-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn('media-upload-overlay', className)}>
      <div className="media-upload-modal">
        {/* Header */}
        <div className="media-upload-header">
          <h2 className="media-upload-title">Upload Media Files</h2>
          <button
            onClick={onClose}
            className="media-upload-close"
            aria-label="Close upload panel"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="media-upload-area">
          <div
            className={cn('upload-dropzone', { 'drag-over': isDragOver })}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="upload-dropzone-title">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </h3>
            <p className="upload-dropzone-subtitle">
              Supports images, videos, and documents up to {maxFileSize}MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple={allowMultiple}
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="media-upload-files">
            <h4 className="files-title">Uploaded Files ({uploadedFiles.length})</h4>
            <div className="files-list">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-preview">
                    {file.preview ? (
                      <img src={file.preview} alt={file.file.name} className="file-thumbnail" />
                    ) : (
                      <div className="file-icon">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>

                  <div className="file-info">
                    <div className="file-name">{file.file.name}</div>
                    <div className="file-details">
                      {(file.size / 1024 / 1024).toFixed(1)}MB • {file.type}
                      {file.metadata && (
                        <>
                          {file.metadata.width && ` • ${file.metadata.width}x${file.metadata.height}`}
                          {file.metadata.duration && ` • ${Math.round(file.metadata.duration)}s`}
                        </>
                      )}
                    </div>

                    {file.status === 'processing' && (
                      <div className="file-progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="file-status">
                    {getStatusIcon(file.status)}
                    {file.error && (
                      <div className="file-error" title={file.error}>
                        {file.error}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="file-remove"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="media-upload-footer">
          <button
            onClick={onClose}
            className="upload-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadComplete}
            disabled={uploadedFiles.filter(f => f.status === 'completed').length === 0}
            className="upload-complete-btn"
          >
            Upload {uploadedFiles.filter(f => f.status === 'completed').length} Files
          </button>
        </div>
      </div>
    </div>
  );
};
