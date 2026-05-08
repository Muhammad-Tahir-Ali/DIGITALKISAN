import api from './api';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  digit: '0' | '1' | '2' | '3';
  grade: 'Grade A' | 'Grade B' | 'Grade C' | 'N/A';
  label: string;     // "Premium Quality" | "Average Quality" | "Poor Quality" | "Not a Crop"
  color: string;     // Hex color for UI badge
  isMock?: boolean;  // True in dev mode when GEMINI_API_KEY is not set
}

// ─── Service ─────────────────────────────────────────────────────────────────

const aiService = {
  /**
   * Classify a crop image using the Gemini Vision AI integrated in the backend.
   *
   * Integration source: https://github.com/abdul-haseeb-khokhar/ImagaAnalysis
   * Uses: Google Gemini gemini-2.5-flash-lite model
   *
   * Sends image as base64 JSON — more reliable on React Native than multipart/form-data.
   *
   * @param imageUri - Local file URI from expo-image-picker (e.g., "file:///...")
   */
  classifyCrop: async (imageUri: string): Promise<ClassificationResult> => {
    const filename = imageUri.split('/').pop() ?? 'crop.jpg';
    const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    let base64Data: string;

    if (Platform.OS === 'web') {
      // On web, use fetch + FileReader to convert the blob URL to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Strip the "data:image/jpeg;base64," prefix
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
    }

    // Send as JSON — the auth interceptor will correctly inject the Bearer token
    // Gemini can take 30-60s for large images, so we use a 90s timeout here
    const { data } = await api.post('/ai/classify', {
      imageData: base64Data,
      mimeType,
    }, { timeout: 90000 });

    return data.data as ClassificationResult;
  },
};

export default aiService;
