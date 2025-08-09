import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Storage service for file uploads
export const storageService = {
  // Upload a file to Firebase Storage
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  async uploadFiles(files: File[], basePath: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) => {
        const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
        return this.uploadFile(file, path);
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Delete a file from Firebase Storage
  async deleteFile(path: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Generate a file path based on current timestamp
  generatePath(folder: string, fileName: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    return `${folder}/${timestamp}_${fileName}`;
  },
};
