import React, { useState, useEffect } from 'react';
import { photoStorage } from '../utils/storage';
import { formatFileSize } from '../utils/imageUtils';
import PhotoPreview from './PhotoPreview';
import type { Photo } from '../types/photo';

interface PhotoGalleryProps {
  onRefresh?: () => void;
}

export default function PhotoGallery({ onRefresh }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const storedPhotos = await photoStorage.getPhotos();
      setPhotos(storedPhotos.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('載入照片失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('確定要刪除這張照片嗎？')) return;
    
    try {
      await photoStorage.deletePhoto(photoId);
      await loadPhotos();
      onRefresh?.();
    } catch (error) {
      console.error('刪除照片失敗:', error);
      alert('刪除照片失敗，請稍後再試');
    }
  };

  const handleSetDefault = async (photoId: string) => {
    try {
      await photoStorage.setDefaultPhoto(photoId);
      await loadPhotos();
      onRefresh?.();
    } catch (error) {
      console.error('設定預設照片失敗:', error);
      alert('設定預設照片失敗，請稍後再試');
    }
  };

  const handlePreviewPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
        <p className="text-gray-500">還沒有上傳任何照片</p>
        <p className="text-sm text-gray-400 mt-1">請先上傳你的標準照片</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">已上傳的照片 ({photos.length})</h3>
          <button
            onClick={loadPhotos}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            重新載入
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="aspect-square cursor-pointer"
                onClick={() => handlePreviewPhoto(photo)}
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {photo.isDefault && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    預設
                  </span>
                </div>
              )}
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  {!photo.isDefault && (
                    <button
                      onClick={() => handleSetDefault(photo.id)}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                      title="設為預設"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-red-50"
                    title="刪除"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 truncate" title={photo.name}>
                  {photo.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>{formatFileSize(photo.size)}</span>
                  <span>{new Date(photo.timestamp).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <PhotoPreview
        photo={selectedPhoto}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}