import { useState, useCallback } from 'react';
import PhotoUploader from '../../components/PhotoUploader';
import PhotoGallery from '../../components/PhotoGallery';
import type { Photo } from '../../types/photo';
import './App.css';

type TabType = 'upload' | 'gallery';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = useCallback((photos: Photo[]) => {
    setMessage({
      type: 'success',
      text: `成功上傳 ${photos.length} 張照片！`
    });
    setRefreshGallery(prev => prev + 1);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setMessage({
      type: 'error',
      text: error
    });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const handleGalleryRefresh = useCallback(() => {
    setRefreshGallery(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Virtual Try-On</h1>
          <p className="text-sm text-gray-600 mt-1">虛擬試穿助手</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            上傳照片
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'gallery'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            照片管理
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'upload' ? (
            <PhotoUploader
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          ) : (
            <PhotoGallery
              key={refreshGallery}
              onRefresh={handleGalleryRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
