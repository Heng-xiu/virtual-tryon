import type { Photo, PhotoStorage, StorageUsage } from '../types/photo';

const STORAGE_KEY = 'virtual-tryon-photos';
const CURRENT_VERSION = 1;
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit
const BYTES_PER_CHAR = 2; // Approximate bytes per character for UTF-16

export class PhotoStorageManager {
  async savePhoto(photo: Photo): Promise<void> {
    const storage = await this.getStorage();
    
    // Check storage space before adding/updating
    const photoSize = this.calculatePhotoSize(photo);
    const existingIndex = storage.photos.findIndex(p => p.id === photo.id);
    
    // Calculate potential new size
    let newUsage = this.calculateStorageUsage(storage).used;
    if (existingIndex >= 0) {
      // Update existing - remove old size, add new size
      const oldSize = this.calculatePhotoSize(storage.photos[existingIndex]);
      newUsage = newUsage - oldSize + photoSize;
    } else {
      // New photo - add to current usage
      newUsage += photoSize;
    }
    
    if (newUsage > MAX_STORAGE_SIZE) {
      throw new Error(`Storage quota exceeded. Maximum size is ${this.formatBytes(MAX_STORAGE_SIZE)}`);
    }
    
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
    await this.setStorage({ version: CURRENT_VERSION, photos: [] });
  }

  async getStorageUsage(): Promise<StorageUsage> {
    const storage = await this.getStorage();
    return this.calculateStorageUsage(storage);
  }

  private calculateStorageUsage(storage: PhotoStorage): StorageUsage {
    const used = storage.photos.reduce((total, photo) => {
      return total + this.calculatePhotoSize(photo);
    }, 0);
    
    return {
      used,
      quota: MAX_STORAGE_SIZE,
      percentage: Math.round((used / MAX_STORAGE_SIZE) * 100)
    };
  }

  private calculatePhotoSize(photo: Photo): number {
    // Estimate size: JSON serialization + base64 data
    const photoJson = JSON.stringify(photo);
    return photoJson.length * BYTES_PER_CHAR;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async getStorage(): Promise<PhotoStorage> {
    let storage: PhotoStorage;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      storage = result[STORAGE_KEY] || { version: CURRENT_VERSION, photos: [] };
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      storage = data ? JSON.parse(data) : { version: CURRENT_VERSION, photos: [] };
    }
    
    // Handle version migration
    if (!storage.version || storage.version < CURRENT_VERSION) {
      storage = await this.migrateStorage(storage);
    }
    
    return storage;
  }

  private async migrateStorage(oldStorage: Partial<PhotoStorage>): Promise<PhotoStorage> {
    // Migration logic for future version upgrades
    const newStorage: PhotoStorage = {
      version: CURRENT_VERSION,
      photos: oldStorage.photos || [],
      defaultPhotoId: oldStorage.defaultPhotoId,
    };
    
    // Save migrated data
    await this.setStorage(newStorage);
    console.log('Storage migrated to version', CURRENT_VERSION);
    
    return newStorage;
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