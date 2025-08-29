import React from 'react';
import type { Photo } from '../types/photo';
import { formatFileSize } from '../utils/imageUtils';

interface PhotoPreviewProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoPreview({ photo, isOpen, onClose }: PhotoPreviewProps) {
  if (!isOpen || !photo) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-preview-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h3 id="photo-preview-title" className="font-medium text-gray-900 truncate">{photo.name}</h3>
            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
              <span aria-label={`File size: ${formatFileSize(photo.size)}`}>{formatFileSize(photo.size)}</span>
              <span aria-label={`Uploaded at: ${new Date(photo.timestamp).toLocaleString('en-US')}`}>
                {new Date(photo.timestamp).toLocaleString('en-US')}
              </span>
              {photo.isDefault && (
                <span 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  role="status"
                  aria-label="Default photo badge"
                >
                  Default Photo
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <svg 
              className="w-5 h-5 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <img
            src={photo.dataUrl}
            alt={`${photo.name} - Preview image, size: ${formatFileSize(photo.size)}`}
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '70vh' }}
          />
        </div>
      </div>
    </div>
  );
}