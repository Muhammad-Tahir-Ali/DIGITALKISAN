import api from './api';
import * as FileSystem from 'expo-file-system';

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

    // Read file as base64 — works reliably on both iOS and Android
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const { data } = await api.post('/ai/classify', {
      imageData: base64Data,   // pure base64, no data URI prefix
      mimeType,
    });

    return data.data as ClassificationResult;
  },
};

export default aiService;
