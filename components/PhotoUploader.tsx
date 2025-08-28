import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateImageFile, compressImage, generatePhotoId, formatFileSize, getFileErrorDetails } from '../utils/imageUtils';
import { photoStorage } from '../utils/storage';
import type { Photo, UploadedFile, FileError } from '../types/photo';

interface PhotoUploaderProps {
  onUploadSuccess?: (photos: Photo[]) => void;
  onUploadError?: (error: string) => void;
}

export default function PhotoUploader({ onUploadSuccess, onUploadError }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const errors: FileError[] = [];
    
    fileRejections.forEach(rejection => {
      const file = rejection.file;
      const error = getFileErrorDetails(file);
      if (error) {
        errors.push(error);
      }
    });
    
    setFileErrors(errors);
    setTimeout(() => setFileErrors([]), 8000);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress('正在處理圖片...');
    
    try {
      const uploadedPhotos: Photo[] = [];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setUploadProgress(`正在處理圖片 ${i + 1}/${acceptedFiles.length}: ${file.name}`);
        
        const validationError = validateImageFile(file);
        if (validationError) {
          onUploadError?.(validationError);
          continue;
        }

        try {
          const compressedDataUrl = await compressImage(file);
          
          const existingPhotos = await photoStorage.getPhotos();
          const isFirstPhoto = existingPhotos.length === 0 && uploadedPhotos.length === 0;
          
          const photo: Photo = {
            id: generatePhotoId(),
            name: file.name,
            dataUrl: compressedDataUrl,
            timestamp: Date.now(),
            isDefault: isFirstPhoto,
            size: file.size,
            type: file.type
          };

          await photoStorage.savePhoto(photo);
          uploadedPhotos.push(photo);
        } catch (error) {
          console.error('處理圖片時發生錯誤:', error);
          onUploadError?.(`處理 ${file.name} 時發生錯誤`);
        }
      }

      if (uploadedPhotos.length > 0) {
        onUploadSuccess?.(uploadedPhotos);
      }
    } catch (error) {
      console.error('上傳過程發生錯誤:', error);
      onUploadError?.('上傳過程發生錯誤');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    disabled: isUploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50 scale-[1.02]' : ''}
          ${isDragReject ? 'border-orange-400 bg-orange-50 scale-[1.02]' : ''}
          ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-blue-300 hover:bg-gray-50' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <div className="text-gray-600">
            {isUploading ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-600">上傳中...</div>
                <div className="text-xs text-gray-500">{uploadProgress}</div>
              </div>
            ) : isDragActive ? (
              isDragReject ? (
                <div className="text-orange-600">
                  <div className="font-medium flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    檔案需要處理
                  </div>
                  <div className="text-sm mt-1">圖片會自動調整或請檢查格式</div>
                </div>
              ) : (
                <div className="text-blue-600">
                  <div className="font-medium flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                    </svg>
                    放開以上傳圖片
                  </div>
                </div>
              )
            ) : (
              <div>
                <div className="font-medium">拖放圖片到此處或點擊上傳</div>
                <div className="text-sm text-gray-500 mt-1">
                  支援 JPEG、PNG、WebP 格式，單檔最大 2MB
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isUploading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg text-blue-800 text-sm">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在處理圖片...
          </div>
        </div>
      )}

      {/* 詳細錯誤提示 */}
      {fileErrors.length > 0 && (
        <div className="mt-4 space-y-3">
          {fileErrors.map((error, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                error.type === 'SIZE_EXCEEDED'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {error.type === 'SIZE_EXCEEDED' ? (
                    <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate" title={error.file.name}>
                      {error.file.name}
                    </span>
                    {error.type === 'SIZE_EXCEEDED' && error.actualSize && error.maxSize && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {formatFileSize(error.actualSize)} → 限制 {formatFileSize(error.maxSize)}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm font-medium ${
                    error.type === 'SIZE_EXCEEDED' ? 'text-orange-800' : 'text-red-800'
                  }`}>
                    {error.message}
                  </p>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {error.suggestion}
                  </p>
                  
                  {error.type === 'SIZE_EXCEEDED' && (
                    <div className="mt-2 flex items-center text-xs text-green-700">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      重新拖放此檔案將自動壓縮
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setFileErrors(prev => prev.filter((_, i) => i !== index))}
                  className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}