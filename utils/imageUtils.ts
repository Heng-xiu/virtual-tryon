export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_DIMENSION = 1500;

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

import type { FileError } from '../types/photo';

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return '只支援 JPEG、PNG 和 WebP 格式的圖片';
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    return '圖片大小不能超過 2MB';
  }
  
  return null;
}

export function getFileErrorDetails(file: File): FileError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      type: 'INVALID_FORMAT',
      message: `不支援 ${file.type || '此檔案'} 格式`,
      suggestion: '請使用 JPEG、PNG 或 WebP 格式的圖片',
      file,
      supportedFormats: ['JPEG', 'PNG', 'WebP']
    };
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      type: 'SIZE_EXCEEDED',
      message: `檔案大小超過限制`,
      suggestion: '圖片會自動壓縮到合適大小，品質稍微降低但保持清晰',
      file,
      actualSize: file.size,
      maxSize: MAX_IMAGE_SIZE
    };
  }
  
  return null;
}

export function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function compressImage(
  file: File, 
  options: ResizeOptions = { 
    maxWidth: MAX_IMAGE_DIMENSION, 
    maxHeight: MAX_IMAGE_DIMENSION, 
    quality: 0.8 
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('無法建立 Canvas 上下文'));
      return;
    }
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > options.maxWidth || height > options.maxHeight) {
        const ratio = Math.min(
          options.maxWidth / width,
          options.maxHeight / height
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', options.quality);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('無法載入圖片'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('無法讀取檔案'));
      }
    };
    reader.onerror = () => {
      reject(new Error('讀取檔案時發生錯誤'));
    };
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('無法獲取圖片尺寸'));
    };
    img.src = dataUrl;
  });
}