import type { Photo, PhotoStorage } from '../types/photo';

const STORAGE_KEY = 'virtual-tryon-photos';

export class PhotoStorageManager {
  async savePhoto(photo: Photo): Promise<void> {
    const storage = await this.getStorage();
    const existingIndex = storage.photos.findIndex(p => p.id === photo.id);
    
    if (existingIndex >= 0) {
      storage.photos[existingIndex] = photo;
    } else {
      storage.photos.push(photo);
    }
    
    if (photo.isDefault) {
      storage.defaultPhotoId = photo.id;
      storage.photos = storage.photos.map(p => ({
        ...p,
        isDefault: p.id === photo.id
      }));
    }
    
    await this.setStorage(storage);
  }

  async getPhotos(): Promise<Photo[]> {
    const storage = await this.getStorage();
    return storage.photos;
  }

  async getDefaultPhoto(): Promise<Photo | null> {
    const storage = await this.getStorage();
    return storage.photos.find(p => p.isDefault) || null;
  }

  async deletePhoto(photoId: string): Promise<void> {
    const storage = await this.getStorage();
    const photoToDelete = storage.photos.find(p => p.id === photoId);
    
    storage.photos = storage.photos.filter(p => p.id !== photoId);
    
    if (photoToDelete?.isDefault && storage.photos.length > 0) {
      storage.photos[0].isDefault = true;
      storage.defaultPhotoId = storage.photos[0].id;
    } else if (storage.photos.length === 0) {
      storage.defaultPhotoId = undefined;
    }
    
    await this.setStorage(storage);
  }

  async setDefaultPhoto(photoId: string): Promise<void> {
    const storage = await this.getStorage();
    storage.photos = storage.photos.map(p => ({
      ...p,
      isDefault: p.id === photoId
    }));
    storage.defaultPhotoId = photoId;
    
    await this.setStorage(storage);
  }

  async clearAllPhotos(): Promise<void> {
    await this.setStorage({ photos: [] });
  }

  private async getStorage(): Promise<PhotoStorage> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY] || { photos: [] };
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { photos: [] };
    }
  }

  private async setStorage(storage: PhotoStorage): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [STORAGE_KEY]: storage });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }
  }
}

export const photoStorage = new PhotoStorageManager();