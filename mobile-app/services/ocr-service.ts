import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { AIService } from './ai-service';

export class OCRService {
    /**
     * Extracts text from a document (PDF/Image) or a live photo.
     * Uses Gemini Vision/Multimodal capabilities directly for best-in-class extraction.
     */
    static async extractTextFromFile(): Promise<{ text: string; fileName: string }> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled) throw new Error("Selection cancelled");

            const file = result.assets[0];
            const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });

            // We use Gemini Pro Vision for OCR capability
            const prompt = "Please perform high-accuracy OCR on this document. Extract all text exactly as written, preserving structure for academic headings, questions, and module codes.";
            const text = await AIService.generateResponseWithMedia(prompt, base64, file.mimeType || 'image/jpeg');

            return { text, fileName: file.name };
        } catch (error) {
            console.error("[OCRService] Error:", error);
            throw error;
        }
    }

    static async extractTextFromCamera(): Promise<{ text: string }> {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) throw new Error("Camera permission denied");

            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                base64: true
            });

            if (result.canceled) throw new Error("Capture cancelled");

            const photo = result.assets[0];
            const prompt = "Perform OCR on this image. Extract all academic text, questions, and formulas.";
            const text = await AIService.generateResponseWithMedia(prompt, photo.base64!, 'image/jpeg');

            return { text };
        } catch (error) {
            console.error("[OCRService] Camera OCR Error:", error);
            throw error;
        }
    }
}
