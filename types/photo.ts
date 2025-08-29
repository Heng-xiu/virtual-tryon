export interface Photo {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
  isDefault: boolean;
  size: number;
  type: string;
}

export interface PhotoStorage {
  version: number;
  photos: Photo[];
  defaultPhotoId?: string;
}

export interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
}

export interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

export interface FileError {
  type: 'SIZE_EXCEEDED' | 'INVALID_FORMAT' | 'INVALID_DIMENSIONS' | 'UNKNOWN_ERROR';
  message: string;
  suggestion: string;
  file: File;
  actualSize?: number;
  maxSize?: number;
  supportedFormats?: string[];
}