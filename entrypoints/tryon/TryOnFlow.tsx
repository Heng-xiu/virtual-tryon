import React, { useState, useEffect } from 'react';
import PhotoUploader from '../../components/PhotoUploader';
import { photoStorage } from '../../utils/storage';
import type { Photo } from '../../types/photo';

interface TryOnFlowProps {
  selectedImageUrl: string | null;
  sourcePageUrl: string | null;
}

type FlowStep = 'loading' | 'no_photos' | 'upload' | 'processing' | 'result';

export default function TryOnFlow({ selectedImageUrl, sourcePageUrl }: TryOnFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('loading');
  const [defaultPhoto, setDefaultPhoto] = useState<Photo | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    initializeFlow();
  }, []);

  const initializeFlow = async () => {
    try {
      setCurrentStep('loading');
      
      // 檢查是否有預設照片
      const photos = await photoStorage.getPhotos();
      const defaultPhotoData = photos.find(p => p.isDefault) || photos[0];
      
      if (defaultPhotoData) {
        setDefaultPhoto(defaultPhotoData);
        setCurrentStep('processing');
        startProcessing();
      } else {
        setCurrentStep('no_photos');
      }
    } catch (error) {
      console.error('Error initializing try-on flow:', error);
      setCurrentStep('no_photos');
    }
  };

  const handleUploadSuccess = async (photos: Photo[]) => {
    if (photos.length > 0) {
      const newDefaultPhoto = photos.find(p => p.isDefault) || photos[0];
      setDefaultPhoto(newDefaultPhoto);
      setCurrentStep('processing');
      startProcessing();
    }
  };

  const startProcessing = () => {
    setProcessingProgress(0);
    
    // 模擬處理進度
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            showResult();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // 隨機進度增加
      });
    }, 300);
  };

  const showResult = () => {
    // 這裡之後會替換成真正的 API 結果
    // 目前使用預設的模擬結果圖片
    setResultImage('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop&crop=face');
    setCurrentStep('result');
  };

  const handleRetry = () => {
    setCurrentStep('processing');
    setProcessingProgress(0);
    startProcessing();
  };

  const handleClose = () => {
    window.close();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'loading':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">準備虛擬試穿</h2>
            <p className="text-gray-600">正在檢查您的標準照片...</p>
          </div>
        );

      case 'no_photos':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">需要您的標準照片</h2>
              <p className="text-gray-600">請先上傳一張您的標準照片來進行虛擬試穿</p>
            </div>
            
            <PhotoUploader onUploadSuccess={handleUploadSuccess} />
            
            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">上傳標準照片</h2>
            <PhotoUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        );

      case 'processing':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在生成試穿效果</h2>
              <p className="text-gray-600 mb-6">請稍候，這可能需要幾秒鐘時間...</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(processingProgress, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                {processingProgress < 30 && '正在分析服裝特徵...'}
                {processingProgress >= 30 && processingProgress < 60 && '正在匹配您的身型...'}
                {processingProgress >= 60 && processingProgress < 90 && '正在生成試穿效果...'}
                {processingProgress >= 90 && '即將完成...'}
              </p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-4">
            <div className="p-6 bg-blue-600">
              <h2 className="text-2xl font-bold text-white text-center">✨ 虛擬試穿結果</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 原始服裝圖片 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">選擇的服裝</h3>
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={selectedImageUrl || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop'}
                      alt="選擇的服裝"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {sourcePageUrl && (
                    <p className="text-xs text-gray-500 truncate">
                      來源：{new URL(sourcePageUrl).hostname}
                    </p>
                  )}
                </div>
                
                {/* 試穿結果 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">試穿效果</h3>
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                    <img
                      src={resultImage || ''}
                      alt="試穿結果"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-cyan-500 text-white text-xs rounded-full">
                        AI 生成
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 操作按鈕 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  🔄 重新生成
                </button>
                
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImage || '';
                    link.download = 'virtual-tryon-result.jpg';
                    link.click();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  💾 儲存圖片
                </button>
                
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  ✅ 完成
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {renderStep()}
    </div>
  );
}